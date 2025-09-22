import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LessonBuilderPlan,
  LessonBuilderStepResource,
} from "../../types/lesson-builder";
import type { LessonPlanRecord } from "../../types/lesson-plans";
import { mapRecordToBuilderPlan } from "./lesson-builder-helpers";
import React from "react";
import type { JSX } from "react";

interface LessonPlanExportData {
  plan: LessonBuilderPlan;
  ownerId: string | null;
  classIds: string[];
}

interface PreviewMetadataEntry {
  label: string;
  value: string;
}

interface PreviewResource {
  title: string;
  type: string | null;
  subject: string | null;
  notes: string | null;
  url: string | null;
}

interface PreviewStep {
  id: string;
  title: string;
  notes: string | null;
  badges: string[];
  resources: PreviewResource[];
}

interface PreviewModel {
  title: string;
  objective: string | null;
  metadata: PreviewMetadataEntry[];
  steps: PreviewStep[];
  logoUrl: string | null;
}

const READABLE_CLASS_ROLES = new Set(["owner", "teacher", "assistant"]);

export async function loadLessonPlanExportData(
  supabase: SupabaseClient,
  id: string,
): Promise<LessonPlanExportData | null> {
  const { data, error } = await supabase
    .from<LessonPlanRecord>("lesson_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load lesson plan");
  }

  if (!data) {
    return null;
  }

  const { data: classLinks, error: classError } = await supabase
    .from<{ class_id: string }>("class_lesson_plans")
    .select("class_id")
    .eq("lesson_plan_id", id);

  if (classError) {
    throw new Error("Failed to load linked classes");
  }

  const classIds = Array.isArray(classLinks)
    ? classLinks
        .map((row) => (typeof row.class_id === "string" ? row.class_id : null))
        .filter((value): value is string => Boolean(value))
    : [];

  const plan = mapRecordToBuilderPlan(data);
  const ownerId = typeof data.owner_id === "string" ? data.owner_id : null;

  return { plan, ownerId, classIds };
}

export async function verifyLessonPlanAccess(
  supabase: SupabaseClient,
  userId: string,
  data: LessonPlanExportData,
): Promise<boolean> {
  if (data.ownerId && data.ownerId === userId) {
    return true;
  }

  if (data.classIds.length === 0) {
    return false;
  }

  const { data: memberships, error } = await supabase
    .from<{ class_id: string; role: string | null }>("class_members")
    .select("class_id, role")
    .in("class_id", data.classIds)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to verify class membership");
  }

  return (memberships ?? []).some((membership) =>
    READABLE_CLASS_ROLES.has((membership.role ?? "").toLowerCase()),
  );
}

export function createLessonPlanExportFileName(
  plan: LessonBuilderPlan,
  extension: "pdf" | "docx",
): string {
  const base = plan.title
    ? plan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-+/g, "-")
    : "lesson-plan";
  const safeBase = base || "lesson-plan";
  return `${safeBase}.${extension}`;
}

export async function renderLessonPlanPdf(
  plan: LessonBuilderPlan,
): Promise<Uint8Array> {
  const model = buildPreviewModel(plan);
  const markup = `<!DOCTYPE html>${renderToStaticMarkup(
    <PrintableLessonPlan model={model} />,
  )}`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(markup, { waitUntil: "networkidle" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
    });
    return buffer;
  } finally {
    await browser.close();
  }
}

export async function renderLessonPlanDocx(
  plan: LessonBuilderPlan,
): Promise<Uint8Array> {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const model = buildPreviewModel(plan);
  const paragraphs: Array<InstanceType<typeof Paragraph>> = [] as any;

  paragraphs.push(
    new Paragraph({
      text: model.title,
      heading: HeadingLevel.TITLE,
    }),
  );

  if (model.objective) {
    paragraphs.push(
      new Paragraph({
        text: model.objective,
      }),
    );
  }

  if (model.metadata.length) {
    paragraphs.push(
      new Paragraph({
        text: "Lesson details",
        heading: HeadingLevel.HEADING2,
      }),
    );

    for (const entry of model.metadata) {
      paragraphs.push(
        new Paragraph({
          text: `${entry.label}: ${entry.value}`,
        }),
      );
    }
  }

  paragraphs.push(
    new Paragraph({
      text: "Lesson steps",
      heading: HeadingLevel.HEADING2,
    }),
  );

  if (model.steps.length === 0) {
    paragraphs.push(
      new Paragraph({
        text: "No lesson steps with notes or resources yet.",
      }),
    );
  } else {
    model.steps.forEach((step, index) => {
      paragraphs.push(
        new Paragraph({
          text: `${index + 1}. ${step.title}`,
          heading: HeadingLevel.HEADING3,
        }),
      );

      if (step.badges.length) {
        paragraphs.push(
          new Paragraph({
            children: step.badges.map((badge, badgeIndex) =>
              new TextRun({
                text: badgeIndex === 0 ? badge : ` • ${badge}`,
                italics: true,
              }),
            ),
          }),
        );
      }

      if (step.notes) {
        paragraphs.push(
          new Paragraph({
            text: step.notes,
          }),
        );
      }

      if (step.resources.length) {
        paragraphs.push(
          new Paragraph({
            text: "Resources:",
            heading: HeadingLevel.HEADING4,
          }),
        );

        step.resources.forEach((resource) => {
          const parts: string[] = [resource.title];
          const details = [resource.type, resource.subject]
            .filter((value): value is string => Boolean(value))
            .join(" · ");
          if (details) {
            parts.push(`(${details})`);
          }
          if (resource.url) {
            parts.push(resource.url);
          }
          if (resource.notes) {
            parts.push(resource.notes);
          }

          paragraphs.push(
            new Paragraph({
              text: parts.join(" — "),
              bullet: { level: 0 },
            }),
          );
        });
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

function PrintableLessonPlan({ model }: { model: PreviewModel }): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{model.title}</title>
        <style>{printStyles}</style>
      </head>
      <body>
        <main className="document">
          <header className="document__header">
            {model.logoUrl ? (
              <div className="document__logo">
                <img src={model.logoUrl} alt="School logo" />
              </div>
            ) : null}
            <div className="document__heading">
              <h1>{model.title}</h1>
              {model.objective ? <p className="document__objective">{model.objective}</p> : null}
            </div>
          </header>

          {model.metadata.length ? (
            <section className="document__section">
              <h2>Lesson details</h2>
              <ul className="document__badges">
                {model.metadata.map((entry) => (
                  <li key={entry.label}>
                    <strong>{entry.label}:</strong> {entry.value}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="document__section">
            <h2>Lesson steps</h2>
            {model.steps.length === 0 ? (
              <p className="document__empty">No lesson steps with notes or resources yet.</p>
            ) : (
              model.steps.map((step, index) => (
                <article key={step.id} className="document__step">
                  <header className="document__step-header">
                    <h3>
                      <span className="document__step-index">{index + 1}.</span> {step.title}
                    </h3>
                    {step.badges.length ? (
                      <ul className="document__step-badges">
                        {step.badges.map((badge) => (
                          <li key={badge}>{badge}</li>
                        ))}
                      </ul>
                    ) : null}
                  </header>
                  {step.notes ? <p className="document__step-notes">{step.notes}</p> : null}
                  {step.resources.length ? (
                    <div className="document__resources">
                      {step.resources.map((resource, resourceIndex) => (
                        <div key={`${resource.title}-${resourceIndex}`} className="document__resource">
                          <p className="document__resource-title">{resource.title}</p>
                          {resource.type || resource.subject ? (
                            <p className="document__resource-meta">
                              {[resource.type, resource.subject]
                                .filter((value): value is string => Boolean(value))
                                .join(" · ")}
                            </p>
                          ) : null}
                          {resource.notes ? (
                            <p className="document__resource-notes">{resource.notes}</p>
                          ) : null}
                          {resource.url ? (
                            <p className="document__resource-link">{resource.url}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </section>
        </main>
      </body>
    </html>
  );
}

const printStyles = `
  * {
    box-sizing: border-box;
  }
  body {
    font-family: "Inter", "Segoe UI", Roboto, Arial, sans-serif;
    color: #0f172a;
    margin: 0;
    padding: 32px;
    background: #f8fafc;
  }
  .document {
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    padding: 40px;
    border-radius: 24px;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
  }
  .document__header {
    display: flex;
    gap: 24px;
    align-items: center;
    margin-bottom: 32px;
  }
  .document__logo {
    width: 88px;
    height: 88px;
    border-radius: 16px;
    overflow: hidden;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .document__logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .document__heading h1 {
    font-size: 32px;
    margin: 0 0 8px;
  }
  .document__objective {
    margin: 0;
    color: #475569;
    font-size: 16px;
    line-height: 1.5;
  }
  .document__section {
    margin-bottom: 32px;
  }
  .document__section h2 {
    font-size: 20px;
    margin-bottom: 16px;
  }
  .document__badges {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .document__badges li {
    background: #f1f5f9;
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 14px;
  }
  .document__empty {
    color: #64748b;
    font-size: 15px;
  }
  .document__step {
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    background: #f8fafc;
  }
  .document__step-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  .document__step-index {
    color: #2563eb;
  }
  .document__step-badges {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .document__step-badges li {
    background: #dbeafe;
    color: #1d4ed8;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
  }
  .document__step-notes {
    color: #475569;
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 12px;
  }
  .document__resources {
    display: grid;
    gap: 12px;
  }
  .document__resource {
    background: #ffffff;
    border-radius: 12px;
    padding: 12px 16px;
    border: 1px solid rgba(15, 23, 42, 0.08);
  }
  .document__resource-title {
    margin: 0 0 4px;
    font-weight: 600;
  }
  .document__resource-meta,
  .document__resource-notes,
  .document__resource-link {
    margin: 0;
    color: #64748b;
    font-size: 13px;
  }
  .document__resource-link {
    word-break: break-all;
  }
`;

function buildPreviewModel(plan: LessonBuilderPlan): PreviewModel {
  const metadata: PreviewMetadataEntry[] = [];
  const formattedDate = formatDate(plan.lessonDate ?? null);

  if (formattedDate) {
    metadata.push({ label: "Date", value: formattedDate });
  }

  const aggregatedDuration = collectUniqueValues(
    plan.steps.map((step) => normalizeDuration(step.duration, step.durationMinutes)),
  );
  if (aggregatedDuration) {
    metadata.push({ label: "Duration", value: aggregatedDuration });
  }

  const aggregatedGrouping = collectUniqueValues(
    plan.steps.map((step) => step.grouping ?? null),
    { omit: ["", "whole class"] },
  );
  if (aggregatedGrouping) {
    metadata.push({ label: "Grouping", value: aggregatedGrouping });
  }

  const aggregatedDelivery = collectUniqueValues(
    plan.steps.map((step) => step.delivery ?? null),
    { omit: ["", "in-person"] },
  );
  if (aggregatedDelivery) {
    metadata.push({ label: "Delivery", value: aggregatedDelivery });
  }

  const steps = plan.steps
    .map<PreviewStep | null>((step) => {
      const notes = normalizeText(step.notes);
      const resources = (step.resources ?? [])
        .map((resource) => normalizeResource(resource))
        .filter((resource): resource is PreviewResource => Boolean(resource));

      if (!notes && resources.length === 0) {
        return null;
      }

      const badges: string[] = [];
      const duration = normalizeDuration(step.duration, step.durationMinutes);
      if (duration) {
        badges.push(`Duration: ${duration}`);
      }
      const grouping = normalizeText(step.grouping);
      if (grouping && grouping.toLowerCase() !== "whole class") {
        badges.push(grouping);
      }
      const delivery = normalizeText(step.delivery);
      if (delivery && delivery.toLowerCase() !== "in-person") {
        badges.push(delivery);
      }

      return {
        id: step.id,
        title: normalizeText(step.title) || "Lesson step",
        notes,
        badges,
        resources,
      };
    })
    .filter((step): step is PreviewStep => Boolean(step));

  return {
    title: normalizeText(plan.title) || "Lesson plan",
    objective: normalizeText(plan.summary),
    metadata,
    steps,
    logoUrl: plan.schoolLogoUrl ?? null,
  };
}

function normalizeResource(resource: LessonBuilderStepResource): PreviewResource | null {
  const title = normalizeText(resource.title);
  if (!title) {
    return null;
  }

  const type = normalizeText(resource.type);
  const subject = normalizeText(resource.subject);
  const notes = normalizeText(
    (resource as { notes?: string | null; instructionalNotes?: string | null }).notes ??
      (resource as { instructionalNotes?: string | null }).instructionalNotes ??
      null,
  );
  const url = normalizeUrl((resource as { url?: string | null }).url ?? null);

  return {
    title,
    type,
    subject,
    notes,
    url,
  };
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDuration(
  duration: string | null | undefined,
  minutes: number | null | undefined,
): string | null {
  const text = normalizeText(duration);
  if (text) {
    return text;
  }
  if (typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0) {
    return `${Math.trunc(minutes)} minutes`;
  }
  return null;
}

function normalizeUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    return parsed.toString();
  } catch {
    return value;
  }
}

function collectUniqueValues(
  values: Array<string | null>,
  options: { omit?: string[] } = {},
): string | null {
  const omit = new Set((options.omit ?? []).map((entry) => entry.toLowerCase()));
  const collected = values
    .map((value) => normalizeText(value))
    .filter((value) => value && !omit.has(value.toLowerCase()));
  const unique = Array.from(new Set(collected));
  return unique.length ? unique.join(", ") : null;
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsed);
  } catch {
    return value;
  }
}
