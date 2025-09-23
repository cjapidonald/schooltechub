import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LessonBuilderPart,
  LessonBuilderPlan,
  LessonBuilderStep,
  LessonBuilderStepResource,
  LessonBuilderStandard,
  LessonBuilderVersionEntry,
} from "../../types/lesson-builder";
import { mapRecordToBuilderPlan } from "./lesson-builder-helpers";
import {
  cryptoRandomId,
  mergeStandardValues,
  mergeStepValues,
} from "../../types/lesson-builder";
import type {
  LessonPlanOverview,
  LessonPlanRecord,
  LessonPlanResource,
  LessonPlanStatus,
} from "../../types/lesson-plans";
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
const BUILDER_PLAN_TABLE = "lesson_plan_builder_plans";
const PLAN_STEPS_TABLE = "lesson_plan_steps";
const CLASS_PLAN_LINKS_TABLE = "class_lesson_plans";

export async function loadLessonPlanExportData(
  supabase: SupabaseClient,
  id: string,
): Promise<LessonPlanExportData | null> {
  const {
    data: builderData,
    error: builderError,
  } = await supabase
    .from<Record<string, any>>(BUILDER_PLAN_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (builderError) {
    throw new Error("Failed to load lesson plan");
  }

  if (builderData) {
    const {
      data: stepData,
      error: stepError,
    } = await supabase
      .from<Record<string, any>>(PLAN_STEPS_TABLE)
      .select("*")
      .eq("lesson_plan_id", id);

    if (stepError) {
      throw new Error("Failed to load lesson plan steps");
    }

    const classIds = await loadLinkedClassIds(supabase, id);
    const plan = mapBuilderPlanForExport(
      builderData,
      Array.isArray(stepData) ? stepData : [],
    );
    const ownerId =
      typeof builderData.owner_id === "string" ? builderData.owner_id : null;

    return { plan, ownerId, classIds };
  }

  return loadPublishedPlanExportData(supabase, id);
}

async function loadPublishedPlanExportData(
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

  const classIds = await loadLinkedClassIds(supabase, id);
  const plan = mapRecordToBuilderPlan(data);
  const ownerId = typeof data.owner_id === "string" ? data.owner_id : null;

  return { plan, ownerId, classIds };
}

async function loadLinkedClassIds(
  supabase: SupabaseClient,
  planId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from<{ class_id: string | null }>(CLASS_PLAN_LINKS_TABLE)
    .select("class_id")
    .eq("lesson_plan_id", planId);

  if (error) {
    throw new Error("Failed to load linked classes");
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => (typeof row.class_id === "string" ? row.class_id : null))
    .filter((value): value is string => Boolean(value));
}

type BuilderMetadata = {
  version?: number;
  steps?: unknown;
  standards?: unknown;
  availableStandards?: unknown;
  parts?: unknown;
  lastSavedAt?: unknown;
  history?: unknown;
  lessonDate?: unknown;
  schoolLogoUrl?: unknown;
};

function mapBuilderPlanForExport(
  record: Record<string, any>,
  stepRecords: Record<string, any>[],
): LessonBuilderPlan {
  const id = normalizeId(record.id);
  const title = normalizeString(record.title) ?? "Untitled lesson";
  const slug = resolveSlug(record, title, id);
  const summary = normalizeString(record.summary);
  const stage = normalizeString(record.stage);
  const baseStages = normalizeStringArray(record.stages);
  const stages = stage && !baseStages.includes(stage)
    ? [...baseStages, stage]
    : baseStages;
  const subjects = normalizeSubjects(record);
  const deliveryMethods = normalizeDelivery(record);
  const technologyTags = normalizeTechnology(record);
  const durationMinutes = normalizeNumber(
    record.duration_minutes ?? record.duration ?? record.time_required,
  );

  const metadata = extractBuilderMetadata(record.metadata);
  const sortedSteps = sortStepRecords(stepRecords);
  const storedSteps = sortedSteps.map((step, index) =>
    mapBuilderStep(step, index),
  );
  const steps =
    Array.isArray(metadata.steps) && metadata.steps.length > 0
      ? metadata.steps.map((step) =>
          mergeStepValues(step as Partial<LessonBuilderStep>),
        )
      : storedSteps;

  const standards = normalizeStandards(metadata.standards);
  const availableStandardsRaw = normalizeStandards(metadata.availableStandards);
  const availableStandards =
    availableStandardsRaw.length > 0 ? availableStandardsRaw : standards;
  const schoolLogoUrl =
    normalizeString(metadata.schoolLogoUrl) ??
    normalizeString(record.school_logo_url ?? record.logo_url);
  const lessonDate =
    normalizeString(metadata.lessonDate) ??
    normalizeString(record.lesson_date ?? record.date);
  const overview = buildOverview(
    record,
    summary,
    subjects,
    stage,
    durationMinutes,
    deliveryMethods,
    technologyTags,
  );
  const resources = normalizePlanResources(record.resources);
  const parts = normalizeParts(metadata.parts, summary, steps.length);
  const history = normalizeHistory(metadata.history);
  const lastSavedAt =
    normalizeString(metadata.lastSavedAt) ??
    normalizeString(record.updated_at ?? record.last_saved_at);
  const version =
    typeof metadata.version === "number" && Number.isFinite(metadata.version)
      ? metadata.version
      : 1;

  return {
    id,
    slug,
    title,
    summary,
    status: normalizeStatus(record.status),
    stage,
    stages,
    subjects,
    deliveryMethods,
    technologyTags,
    durationMinutes,
    schoolLogoUrl,
    lessonDate,
    overview,
    steps,
    standards,
    availableStandards,
    resources,
    lastSavedAt,
    version,
    parts,
    history,
    ownerId: normalizeString(record.owner_id),
    createdAt: normalizeString(record.created_at),
    updatedAt: normalizeString(record.updated_at),
  } satisfies LessonBuilderPlan;
}

function extractBuilderMetadata(value: unknown): BuilderMetadata {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  const builderRaw =
    record.builder && typeof record.builder === "object"
      ? (record.builder as Record<string, unknown>)
      : record;

  return {
    version: builderRaw.version as number | undefined,
    steps: builderRaw.steps,
    standards: builderRaw.standards,
    availableStandards:
      (builderRaw.availableStandards as unknown) ??
      builderRaw.available_standards,
    parts: builderRaw.parts,
    lastSavedAt:
      (builderRaw.lastSavedAt as unknown) ?? builderRaw.last_saved_at,
    history: builderRaw.history,
    lessonDate:
      (builderRaw.lessonDate as unknown) ?? builderRaw.lesson_date,
    schoolLogoUrl:
      (builderRaw.schoolLogoUrl as unknown) ?? builderRaw.school_logo_url,
  } satisfies BuilderMetadata;
}

function normalizeId(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return cryptoRandomId("plan");
}

function resolveSlug(
  record: Record<string, any>,
  title: string,
  id: string,
): string {
  const existing = normalizeString(record.slug);
  if (existing) {
    return existing;
  }

  const base = slugify(title);
  if (!base) {
    return id;
  }

  const suffix = id.replace(/[^a-z0-9]+/gi, "").slice(0, 6) || "plan";
  return `${base}-${suffix}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  return [];
}

function normalizeSubjects(record: Record<string, any>): string[] {
  const subjects = normalizeStringArray(record.subjects);
  if (subjects.length > 0) {
    return subjects;
  }
  const fallback = normalizeString(record.subject);
  return fallback ? [fallback] : [];
}

function normalizeDelivery(record: Record<string, any>): string[] {
  return normalizeStringArray(
    record.delivery_methods ??
      record.delivery ??
      record.delivery_modes ??
      record.delivery_format,
  );
}

function normalizeTechnology(record: Record<string, any>): string[] {
  return normalizeStringArray(
    record.technology_tags ??
      record.technology ??
      record.tech ??
      record.tools,
  );
}

function sortStepRecords(
  stepRecords: Record<string, any>[],
): Record<string, any>[] {
  return [...stepRecords].sort((a, b) => {
    const posA = normalizeNumber(a.position);
    const posB = normalizeNumber(b.position);

    if (posA === null && posB === null) {
      return 0;
    }
    if (posA === null) {
      return 1;
    }
    if (posB === null) {
      return -1;
    }
    return posA - posB;
  });
}

function mapBuilderStep(
  step: Record<string, any>,
  index: number,
): LessonBuilderStep {
  const id = normalizeStepId(step.id, index);
  const title = normalizeString(step.title) ?? `Step ${index + 1}`;
  const notes = normalizeString(step.notes);
  const durationMinutes = normalizeNumber(
    step.duration_minutes ?? step.durationMinutes,
  );
  const resources = normalizeResourceList(step.resources);

  return mergeStepValues({
    id,
    title,
    notes: notes ?? undefined,
    durationMinutes: durationMinutes ?? undefined,
    resources,
  });
}

function normalizeStepId(value: unknown, index: number): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return `step_${index + 1}`;
}

function normalizeResourceList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeStandards(value: unknown): LessonBuilderStandard[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((standard) =>
      mergeStandardValues(standard as Partial<LessonBuilderStandard>),
    )
    .filter((standard): standard is LessonBuilderStandard => Boolean(standard));
}

function normalizePlanResources(value: unknown): LessonPlanResource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((resource) => normalizePlanResource(resource))
    .filter((resource): resource is LessonPlanResource => resource !== null);
}

function normalizePlanResource(value: unknown): LessonPlanResource | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = normalizeString(record.title) ?? normalizeString(record.name);
  if (!title) {
    return null;
  }

  return {
    title,
    url: normalizeString(record.url),
    type: normalizeString(record.type),
    description: normalizeString(record.description),
  } satisfies LessonPlanResource;
}

function normalizeParts(
  value: unknown,
  summary: string | null,
  stepCount: number,
): LessonBuilderPart[] {
  if (Array.isArray(value)) {
    const normalized = value
      .map((part) => normalizePart(part))
      .filter((part): part is LessonBuilderPart => Boolean(part));

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return buildDefaultParts(summary, stepCount);
}

function normalizePart(value: unknown): LessonBuilderPart | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id =
    normalizeString(record.id) ?? cryptoRandomId("part");
  const label = normalizeString(record.label) ?? "Part";
  const description = normalizeString(record.description);

  return {
    id,
    label,
    description,
    completed: Boolean(record.completed),
  } satisfies LessonBuilderPart;
}

function buildDefaultParts(
  summary: string | null,
  stepCount: number,
): LessonBuilderPart[] {
  return [
    {
      id: "overview",
      label: "Overview",
      description: summary,
      completed: Boolean(summary),
    },
    {
      id: "activities",
      label: "Learning Activities",
      description:
        stepCount > 0
          ? `${stepCount} ${stepCount === 1 ? "step" : "steps"}`
          : null,
      completed: stepCount > 0,
    },
    {
      id: "assessment",
      label: "Assessment",
      description: null,
      completed: false,
    },
    {
      id: "resources",
      label: "Resources",
      description: null,
      completed: false,
    },
  ];
}

function normalizeHistory(value: unknown): LessonBuilderVersionEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeHistoryEntry(entry))
    .filter((entry): entry is LessonBuilderVersionEntry => Boolean(entry));
}

function normalizeHistoryEntry(value: unknown): LessonBuilderVersionEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = normalizeString(record.id) ?? cryptoRandomId("ver");
  const createdAt = normalizeString(record.createdAt ?? record.created_at);

  if (!createdAt) {
    return null;
  }

  const label = normalizeString(record.label) ?? "Revision";
  const author = normalizeString(record.author);
  const summary = normalizeString(record.summary);

  return {
    id,
    label,
    createdAt,
    author,
    summary,
  } satisfies LessonBuilderVersionEntry;
}

function normalizeSuccessCriteria(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeString(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  const text = normalizeString(value);
  if (!text) {
    return [];
  }

  return text
    .split(/\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildOverview(
  record: Record<string, any>,
  summary: string | null,
  subjects: string[],
  stage: string | null,
  durationMinutes: number | null,
  deliveryMethods: string[],
  technologyTags: string[],
): LessonPlanOverview | null {
  const objective = normalizeString(record.objective);
  const successCriteria = normalizeSuccessCriteria(
    record.success_criteria ?? record.successCriteria,
  );
  const essentialQuestion = normalizeString(
    record.essential_question ?? record.essentialQuestion,
  );

  if (!summary && !objective && successCriteria.length === 0 && !essentialQuestion) {
    return null;
  }

  return {
    summary,
    essentialQuestion,
    objectives: objective ? [objective] : [],
    successCriteria,
    materials: [],
    assessment: [],
    technology: technologyTags,
    delivery: deliveryMethods,
    stage,
    subjects,
    durationMinutes,
  } satisfies LessonPlanOverview;
}

const VALID_STATUSES: LessonPlanStatus[] = [
  "draft",
  "published",
  "archived",
];

function normalizeStatus(value: unknown): LessonPlanStatus {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if ((VALID_STATUSES as string[]).includes(lower)) {
      return lower as LessonPlanStatus;
    }
  }
  return "draft";
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
