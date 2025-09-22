import {
  Document as PdfDocument,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  Document as DocxDocument,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  TextRun,
} from "docx";
import QRCode from "qrcode";

import type {
  LessonPlanContentBlock,
  LessonPlanContentSection,
  LessonPlanDetail,
  LessonPlanResource,
} from "../../types/lesson-plans";

export type LessonPlanExportFormat = "pdf" | "docx";
export type LessonPlanExportVariant = "default" | "handout";

export interface LessonPlanExportOptions {
  format: LessonPlanExportFormat;
  variant?: LessonPlanExportVariant;
  includeQrCodes?: boolean;
}

export interface LessonPlanExportResult {
  buffer: Uint8Array;
  mimeType: string;
  extension: string;
  filename: string;
}

interface NormalizedLessonPlan {
  id: string;
  title: string;
  summary: string | null;
  subjects: string[];
  deliveryMethods: string[];
  technologyTags: string[];
  durationMinutes: number | null;
  stage: string | null;
  overview: LessonPlanDetail["overview"];
  sections: NormalizedSection[];
  resources: NormalizedResource[];
}

interface NormalizedSection {
  id: string;
  title: string | null;
  description: string | null;
  durationMinutes: number | null;
  group: string | null;
  steps: NormalizedStep[];
}

interface NormalizedStep {
  id: string;
  title: string | null;
  description: string[];
  durationMinutes: number | null;
  group: string | null;
  resources: string[];
  teacherNotes: string[];
  differentiation: string[];
  audience: "teacher" | "student" | "mixed";
}

interface NormalizedResource extends LessonPlanResource {
  qrCodeDataUrl?: string | null;
  qrCodeBuffer?: Uint8Array | null;
}

export async function exportLessonPlan(
  lesson: LessonPlanDetail,
  options: LessonPlanExportOptions
): Promise<LessonPlanExportResult> {
  const normalized = await normalizeLessonPlan(lesson, options.includeQrCodes);
  const variant = options.variant ?? "default";

  switch (options.format) {
    case "pdf":
      return exportLessonPlanToPdf(normalized, { variant });
    case "docx":
      return exportLessonPlanToDocx(normalized, {
        variant,
        includeQrCodes: options.includeQrCodes ?? false,
      });
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

async function normalizeLessonPlan(
  lesson: LessonPlanDetail,
  includeQrCodes = false
): Promise<NormalizedLessonPlan> {
  const sections = lesson.content.map((section, index) =>
    normalizeSection(section, index)
  );

  const resources = await Promise.all(
    lesson.resources.map(async (resource) => {
      if (!includeQrCodes || !resource.url) {
        return { ...resource } satisfies NormalizedResource;
      }

      try {
        const [dataUrl, buffer] = await Promise.all([
          QRCode.toDataURL(resource.url, { margin: 0 }),
          QRCode.toBuffer(resource.url, { margin: 0 }),
        ]);
        return {
          ...resource,
          qrCodeDataUrl: dataUrl,
          qrCodeBuffer: buffer,
        } satisfies NormalizedResource;
      } catch (error) {
        console.error("Failed to generate QR code", error);
        return { ...resource } satisfies NormalizedResource;
      }
    })
  );

  return {
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary ?? lesson.overview?.summary ?? null,
    subjects: lesson.subjects,
    deliveryMethods: lesson.deliveryMethods,
    technologyTags: lesson.technologyTags,
    durationMinutes:
      lesson.durationMinutes ?? lesson.overview?.durationMinutes ?? null,
    stage: lesson.stage,
    overview: lesson.overview,
    sections,
    resources,
  } satisfies NormalizedLessonPlan;
}

function normalizeSection(
  section: LessonPlanContentSection,
  index: number
): NormalizedSection {
  const steps = normalizeSteps(section.blocks);
  const duration = steps.reduce<number | null>((total, step) => {
    if (step.durationMinutes == null) {
      return total;
    }
    return (total ?? 0) + step.durationMinutes;
  }, null);

  const firstGroup = steps.find((step) => step.group)?.group ?? null;

  return {
    id: section.id ?? `section-${index}`,
    title: section.title ?? null,
    description: section.description ?? null,
    durationMinutes: duration,
    group: firstGroup,
    steps,
  } satisfies NormalizedSection;
}

function normalizeSteps(blocks: LessonPlanContentBlock[]): NormalizedStep[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .map((block, index) => normalizeStep(block, index))
    .filter((step): step is NormalizedStep => step !== null);
}

function normalizeStep(
  block: LessonPlanContentBlock,
  index: number
): NormalizedStep | null {
  if (!block) {
    return null;
  }

  const record = block as Record<string, unknown>;
  const type = String(record.type ?? "").toLowerCase();
  const id = String(record.id ?? `step-${index}`);

  const title = firstNonEmptyString([
    record.title,
    record.name,
    record.heading,
    record.label,
    type === "paragraph" ? null : record.text,
  ]);

  const description = collectTextFragments([
    record.summary,
    record.description,
    record.instructions,
    record.text,
    record.body,
    record.content,
  ]);

  const duration = parseDuration(record.duration ?? record.time ?? record.length);
  const group = firstNonEmptyString([
    record.group,
    record.grouping,
    record.setting,
    record.audience,
  ]);

  const teacherNotes = collectTextFragments([
    record.teacherNotes,
    record.teacher,
    record.facilitatorNotes,
    record.notes,
    record.coachNotes,
  ]);

  const differentiation = collectTextFragments([
    record.differentiation,
    record.supports,
    record.extensions,
    record.modifications,
    record.adaptations,
  ]);

  const audience = inferAudience(record.audience ?? record.role ?? null);
  const resources = collectResourceLabels(record.resources ?? record.links);

  if (
    title == null &&
    description.length === 0 &&
    teacherNotes.length === 0 &&
    differentiation.length === 0
  ) {
    if (type === "paragraph" && typeof record.text === "string") {
      return {
        id,
        title: null,
        description: [record.text],
        durationMinutes: duration,
        group: group ?? null,
        resources,
        teacherNotes: [],
        differentiation: [],
        audience,
      } satisfies NormalizedStep;
    }

    return null;
  }

  return {
    id,
    title,
    description,
    durationMinutes: duration,
    group: group ?? null,
    resources,
    teacherNotes,
    differentiation,
    audience,
  } satisfies NormalizedStep;
}

function firstNonEmptyString(candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

function collectTextFragments(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => collectTextFragments(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") {
      return collectTextFragments(record.text);
    }
    if (Array.isArray(record.blocks)) {
      return collectTextFragments(record.blocks);
    }
    return Object.values(record)
      .flatMap((item) => collectTextFragments(item))
      .filter((item) => item.length > 0);
  }

  return [];
}

function parseDuration(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const match = value.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const parsed = Number.parseFloat(match[1]);
      return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
    }
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.minutes === "number") {
      return Math.trunc(record.minutes);
    }
    if (typeof record.value === "number") {
      return Math.trunc(record.value);
    }
    if (typeof record.duration === "number") {
      return Math.trunc(record.duration);
    }
  }

  return null;
}

function inferAudience(value: unknown): "teacher" | "student" | "mixed" {
  if (typeof value !== "string") {
    return "mixed";
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("teacher") || normalized.includes("facilitator")) {
    return "teacher";
  }
  if (normalized.includes("student") || normalized.includes("learner")) {
    return "student";
  }
  return "mixed";
}

function collectResourceLabels(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => collectResourceLabels(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const label = firstNonEmptyString([
      record.title,
      record.label,
      record.name,
      record.text,
    ]);
    if (label) {
      return [label];
    }
  }

  return [];
}

interface PdfExportOptions {
  variant: LessonPlanExportVariant;
}

async function exportLessonPlanToPdf(
  lesson: NormalizedLessonPlan,
  options: PdfExportOptions
): Promise<LessonPlanExportResult> {
  const styles = StyleSheet.create({
    page: {
      padding: 48,
      fontSize: 12,
      fontFamily: "Helvetica",
      lineHeight: 1.45,
    },
    header: {
      marginBottom: 16,
      borderBottom: 1,
      borderBottomColor: "#e5e7eb",
      paddingBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
    },
    summary: {
      marginTop: 6,
      color: "#4b5563",
    },
    metaGrid: {
      marginTop: 12,
    },
    metaItem: {
      marginBottom: 4,
    },
    metaLabel: {
      fontWeight: 600,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 6,
    },
    sectionMeta: {
      color: "#4b5563",
      marginBottom: 8,
    },
    step: {
      marginTop: 12,
      padding: 12,
      borderRadius: 6,
      backgroundColor: "#f9fafb",
    },
    stepHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    stepTitle: {
      fontWeight: 600,
      fontSize: 14,
    },
    stepMeta: {
      color: "#6b7280",
      fontSize: 11,
    },
    paragraph: {
      marginTop: 4,
    },
    label: {
      fontWeight: 600,
    },
    qrImage: {
      width: 64,
      height: 64,
      marginTop: 8,
    },
    resourceItem: {
      marginTop: 6,
    },
    pageNumber: {
      position: "absolute",
      fontSize: 10,
      bottom: 16,
      right: 48,
      color: "#9ca3af",
    },
  });

  const includeTeacherFacing = options.variant !== "handout";

  const doc = (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{lesson.title}</Text>
          {lesson.summary ? (
            <Text style={styles.summary}>{lesson.summary}</Text>
          ) : null}
          <View style={styles.metaGrid}>
            {renderMetaLinePdf("Stage", lesson.stage, styles)}
            {renderMetaLinePdf(
              "Subjects",
              lesson.subjects.join(", ") || null,
              styles
            )}
            {renderMetaLinePdf(
              "Delivery",
              lesson.deliveryMethods.join(", ") || null,
              styles
            )}
            {renderMetaLinePdf(
              "Technology",
              lesson.technologyTags.join(", ") || null,
              styles
            )}
            {renderMetaLinePdf(
              "Duration",
              lesson.durationMinutes != null
                ? `${lesson.durationMinutes} minutes`
                : null,
              styles
            )}
          </View>
        </View>

        {lesson.overview ? (
          <View>
            {renderOverviewSectionPdf(lesson.overview, styles)}
          </View>
        ) : null}

        {lesson.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            {section.title ? (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            ) : null}
            {renderSectionMetaPdf(section, styles)}
            {section.description ? (
              <Text style={styles.paragraph}>{section.description}</Text>
            ) : null}
            {section.steps.map((step, index) => (
              <View key={step.id} style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>
                    {step.title ?? `Step ${index + 1}`}
                  </Text>
                  <Text style={styles.stepMeta}>
                    {formatStepMeta(step)}
                  </Text>
                </View>
                {step.description.map((paragraph, paragraphIndex) => (
                  <Text key={paragraphIndex} style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
                {includeTeacherFacing && step.teacherNotes.length > 0 ? (
                  <Text style={styles.paragraph}>
                    <Text style={styles.label}>Teacher Notes: </Text>
                    {step.teacherNotes.join(" \u2022 ")}
                  </Text>
                ) : null}
                {includeTeacherFacing && step.differentiation.length > 0 ? (
                  <Text style={styles.paragraph}>
                    <Text style={styles.label}>Differentiation: </Text>
                    {step.differentiation.join(" \u2022 ")}
                  </Text>
                ) : null}
                {step.resources.length > 0 ? (
                  <Text style={styles.paragraph}>
                    <Text style={styles.label}>Resources: </Text>
                    {step.resources.join(", ")}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}

        {lesson.resources.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resources</Text>
            {lesson.resources.map((resource, index) => (
              <View key={`${resource.title}-${index}`} style={styles.resourceItem}>
                {resource.url ? (
                  <Text>
                    <Link src={resource.url}>{resource.title}</Link>
                  </Text>
                ) : (
                  <Text>{resource.title}</Text>
                )}
                {resource.description ? (
                  <Text style={styles.paragraph}>{resource.description}</Text>
                ) : null}
                {resource.qrCodeDataUrl ? (
                  <Image
                    src={resource.qrCodeDataUrl}
                    style={styles.qrImage}
                  />
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </PdfDocument>
  );

  const buffer = await renderToBuffer(doc);
  return {
    buffer: buffer as Uint8Array,
    mimeType: "application/pdf",
    extension: "pdf",
    filename: createExportFilename(lesson.title, options.variant, "pdf"),
  } satisfies LessonPlanExportResult;
}

function renderMetaLinePdf(
  label: string,
  value: string | null,
  styles: ReturnType<typeof StyleSheet.create>
): JSX.Element | null {
  if (!value) {
    return null;
  }
  return (
    <Text style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

function renderOverviewSectionPdf(
  overview: LessonPlanDetail["overview"],
  styles: ReturnType<typeof StyleSheet.create>
): JSX.Element | null {
  if (!overview) {
    return null;
  }

  const rows: Array<[string, string[]]> = [
    ["Essential Question", overview.essentialQuestion ? [overview.essentialQuestion] : []],
    ["Objectives", overview.objectives ?? []],
    ["Materials", overview.materials ?? []],
    ["Assessment", overview.assessment ?? []],
    ["Technology", overview.technology ?? []],
    ["Delivery", overview.delivery ?? []],
  ];

  const content = rows
    .filter(([, values]) => values.length > 0)
    .map(([label, values]) => (
      <Text key={label} style={styles.metaItem}>
        <Text style={styles.metaLabel}>{label}: </Text>
        {values.join(", ")}
      </Text>
    ));

  if (content.length === 0) {
    return null;
  }

  return <View>{content}</View>;
}

function renderSectionMetaPdf(
  section: NormalizedSection,
  styles: ReturnType<typeof StyleSheet.create>
): JSX.Element | null {
  const parts: string[] = [];
  if (section.durationMinutes != null) {
    parts.push(`${section.durationMinutes} min`);
  }
  if (section.group) {
    parts.push(section.group);
  }

  if (parts.length === 0) {
    return null;
  }

  return <Text style={styles.sectionMeta}>{parts.join(" • ")}</Text>;
}

function formatStepMeta(step: NormalizedStep): string {
  const parts: string[] = [];
  if (step.durationMinutes != null) {
    parts.push(`${step.durationMinutes} min`);
  }
  if (step.group) {
    parts.push(step.group);
  }
  if (step.audience === "teacher") {
    parts.push("Teacher-facing");
  }
  return parts.join(" • ");
}

interface DocxExportOptions {
  variant: LessonPlanExportVariant;
  includeQrCodes: boolean;
}

async function exportLessonPlanToDocx(
  lesson: NormalizedLessonPlan,
  options: DocxExportOptions
): Promise<LessonPlanExportResult> {
  const includeTeacherFacing = options.variant !== "handout";

  const children: Paragraph[] = [
    new Paragraph({
      text: lesson.title,
      heading: HeadingLevel.TITLE,
    }),
  ];

  if (lesson.summary) {
    children.push(
      new Paragraph({
        text: lesson.summary,
      })
    );
  }

  const metaParagraphs = buildMetaParagraphs(lesson);
  children.push(...metaParagraphs);

  if (lesson.overview) {
    children.push(...buildOverviewParagraphs(lesson.overview));
  }

  lesson.sections.forEach((section) => {
    children.push(
      new Paragraph({
        text: section.title ?? "Lesson Section",
        heading: HeadingLevel.HEADING_2,
      })
    );

    if (section.durationMinutes != null || section.group) {
      const metaParts: string[] = [];
      if (section.durationMinutes != null) {
        metaParts.push(`${section.durationMinutes} min`);
      }
      if (section.group) {
        metaParts.push(section.group);
      }
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: metaParts.join(" • "), italics: true }),
          ],
        })
      );
    }

    if (section.description) {
      children.push(new Paragraph(section.description));
    }

    section.steps.forEach((step, index) => {
      children.push(
        new Paragraph({
          text: step.title ?? `Step ${index + 1}`,
          heading: HeadingLevel.HEADING_3,
        })
      );

      const stepMeta: string[] = [];
      if (step.durationMinutes != null) {
        stepMeta.push(`${step.durationMinutes} min`);
      }
      if (step.group) {
        stepMeta.push(step.group);
      }
      if (step.audience === "teacher") {
        stepMeta.push("Teacher-facing");
      }

      if (stepMeta.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: stepMeta.join(" • "), italics: true }),
            ],
          })
        );
      }

      step.description.forEach((paragraph) => {
        children.push(new Paragraph(paragraph));
      });

      if (includeTeacherFacing && step.teacherNotes.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Teacher Notes: ", bold: true }),
              new TextRun(step.teacherNotes.join(" • ")),
            ],
          })
        );
      }

      if (includeTeacherFacing && step.differentiation.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Differentiation: ", bold: true }),
              new TextRun(step.differentiation.join(" • ")),
            ],
          })
        );
      }

      if (step.resources.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Resources: ", bold: true }),
              new TextRun(step.resources.join(", ")),
            ],
          })
        );
      }
    });
  });

  if (lesson.resources.length > 0) {
    children.push(
      new Paragraph({
        text: "Resources",
        heading: HeadingLevel.HEADING_2,
      })
    );

    lesson.resources.forEach((resource) => {
      const paragraphChildren = resource.url
        ? [
            new ExternalHyperlink({
              link: resource.url,
              children: [
                new TextRun({
                  text: resource.title,
                  style: "Hyperlink",
                  underline: {},
                }),
              ],
            }),
          ]
        : [new TextRun(resource.title)];

      children.push(new Paragraph({ children: paragraphChildren }));

      if (resource.description) {
        children.push(new Paragraph(resource.description));
      }

      if (options.includeQrCodes && resource.qrCodeBuffer) {
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: resource.qrCodeBuffer,
                transformation: {
                  width: 128,
                  height: 128,
                },
              }),
            ],
          })
        );
      }

      if (resource.url) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: resource.url, break: 1, italics: true }),
            ],
          })
        );
      }
    });
  }

  const doc = new DocxDocument({
    sections: [
      {
        type: SectionType.CONTINUOUS,
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return {
    buffer: buffer as Uint8Array,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    filename: createExportFilename(lesson.title, options.variant, "docx"),
  } satisfies LessonPlanExportResult;
}

function buildMetaParagraphs(lesson: NormalizedLessonPlan): Paragraph[] {
  const items: Array<[string, string | null]> = [
    ["Stage", lesson.stage],
    ["Subjects", lesson.subjects.join(", ") || null],
    ["Delivery", lesson.deliveryMethods.join(", ") || null],
    ["Technology", lesson.technologyTags.join(", ") || null],
    [
      "Duration",
      lesson.durationMinutes != null
        ? `${lesson.durationMinutes} minutes`
        : null,
    ],
  ];

  return items
    .filter(([, value]) => value)
    .map(([label, value]) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true }),
          new TextRun(value ?? ""),
        ],
      })
    );
}

function buildOverviewParagraphs(
  overview: LessonPlanDetail["overview"]
): Paragraph[] {
  if (!overview) {
    return [];
  }

  const rows: Array<[string, string[]]> = [
    ["Essential Question", overview.essentialQuestion ? [overview.essentialQuestion] : []],
    ["Objectives", overview.objectives ?? []],
    ["Materials", overview.materials ?? []],
    ["Assessment", overview.assessment ?? []],
    ["Technology", overview.technology ?? []],
    ["Delivery", overview.delivery ?? []],
  ];

  return rows
    .filter(([, values]) => values.length > 0)
    .map(([label, values]) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true }),
          new TextRun(values.join(", ")),
        ],
      })
    );
}

function createExportFilename(
  title: string,
  variant: LessonPlanExportVariant,
  extension: string
): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const suffix = variant === "handout" ? "-handout" : "";
  return `${slug || "lesson-plan"}${suffix}.${extension}`;
}

