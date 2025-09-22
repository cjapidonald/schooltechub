import type {
  LessonBuilderPlan,
  LessonBuilderPart,
  LessonBuilderStandard,
  LessonBuilderVersionEntry,
} from "../../types/lesson-builder";
import {
  builderStepsToContent,
  mergeActivityValues,
  mergeStandardValues,
  mergeStepValues,
  cryptoRandomId,
} from "../../types/lesson-builder";
import type {
  LessonPlanContentSection,
  LessonPlanDetail,
  LessonPlanRecord,
} from "../../types/lesson-plans";
import { mapRecordToDetail } from "./lesson-plan-helpers";

interface BuilderMetadata {
  version?: number;
  steps?: unknown;
  standards?: unknown;
  availableStandards?: unknown;
  parts?: unknown;
  lastSavedAt?: unknown;
  history?: unknown;
}

const DEFAULT_PARTS: Array<{ id: string; label: string; description: string | null }> = [
  { id: "overview", label: "Overview", description: null },
  { id: "activities", label: "Learning Activities", description: null },
  { id: "assessment", label: "Assessment", description: null },
  { id: "resources", label: "Resources", description: null },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeMetadata(value: unknown): BuilderMetadata {
  if (!isRecord(value)) {
    return {};
  }
  const builderRaw = isRecord(value.builder) ? value.builder : value;
  return {
    version: builderRaw.version,
    steps: builderRaw.steps,
    standards: builderRaw.standards,
    availableStandards: builderRaw.availableStandards ?? builderRaw.available_standards,
    parts: builderRaw.parts,
    lastSavedAt: builderRaw.lastSavedAt ?? builderRaw.last_saved_at,
    history: builderRaw.history,
  } as BuilderMetadata;
}

function ensureParts(
  parts: unknown,
  detail: LessonPlanDetail,
  steps: LessonBuilderPlan["steps"]
): LessonBuilderPart[] {
  if (Array.isArray(parts)) {
    const normalized = parts
      .map((part) => normalizePart(part))
      .filter((part): part is LessonBuilderPart => part !== null);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return DEFAULT_PARTS.map((part) => ({
    id: part.id,
    label: part.label,
    description:
      part.id === "overview"
        ? detail.summary ?? null
        : part.id === "activities"
          ? `${steps.length} ${steps.length === 1 ? "step" : "steps"}`
          : part.description,
    completed: part.id === "overview" ? Boolean(detail.summary) : steps.length > 0,
  }));
}

function normalizePart(input: unknown): LessonBuilderPart | null {
  if (!isRecord(input)) {
    return null;
  }
  const id = typeof input.id === "string" && input.id ? input.id : cryptoRandomId("part");
  const label = typeof input.label === "string" && input.label ? input.label : null;
  return {
    id,
    label: label ?? "Part",
    description: typeof input.description === "string" ? input.description : null,
    completed: Boolean(input.completed),
  };
}

function normalizeHistory(history: unknown): LessonBuilderVersionEntry[] {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }
      const id = typeof entry.id === "string" && entry.id.length > 0
        ? entry.id
        : cryptoRandomId("ver");
      const createdAt = typeof entry.createdAt === "string"
        ? entry.createdAt
        : typeof entry.created_at === "string"
          ? entry.created_at
          : null;
      if (!createdAt) {
        return null;
      }
      const label = typeof entry.label === "string" && entry.label.length > 0
        ? entry.label
        : "Revision";
      const author = typeof entry.author === "string" ? entry.author : null;
      const summary = typeof entry.summary === "string" ? entry.summary : null;
      return {
        id,
        label,
        createdAt,
        author,
        summary,
      } satisfies LessonBuilderVersionEntry;
    })
    .filter((entry): entry is LessonBuilderVersionEntry => entry !== null);
}

function stepsFromSections(sections: LessonPlanContentSection[]): LessonBuilderPlan["steps"] {
  return sections.map((section, index) =>
    mergeStepValues({
      id: section.id ?? cryptoRandomId("step"),
      title: section.title ?? `Step ${index + 1}`,
      description: section.description ?? extractFirstParagraph(section),
      activities:
        section.blocks?.filter((block) => block.type === "list").flatMap((block) =>
          "items" in block && Array.isArray(block.items)
            ? block.items.map((item) =>
                mergeActivityValues({
                  title: typeof item === "string" ? item : "Activity",
                })
              )
            : []
        ) ?? [],
    })
  );
}

function extractFirstParagraph(section: LessonPlanContentSection): string | null {
  if (!Array.isArray(section.blocks)) {
    return null;
  }
  const paragraph = section.blocks.find((block) => block.type === "paragraph");
  if (paragraph && "text" in paragraph && typeof paragraph.text === "string") {
    return paragraph.text;
  }
  return null;
}

function normalizeSteps(raw: unknown, fallback: LessonPlanContentSection[]): LessonBuilderPlan["steps"] {
  if (Array.isArray(raw)) {
    const normalized = raw
      .map((step) => mergeStepValues(step as Record<string, unknown>))
      .filter((step) => step !== null);
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return stepsFromSections(fallback);
}

function normalizeStandards(raw: unknown): LessonBuilderStandard[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((standard) => mergeStandardValues(standard as Record<string, unknown>))
    .filter((standard) => standard !== null);
}

export function mapRecordToBuilderPlan(record: LessonPlanRecord): LessonBuilderPlan {
  const detail = mapRecordToDetail(record);
  const metadata = normalizeMetadata(record.metadata ?? null);
  const steps = normalizeSteps(metadata.steps, detail.content);
  const standards = normalizeStandards(metadata.standards);
  const availableStandards = normalizeStandards(metadata.availableStandards ?? standards);
  const history = normalizeHistory(metadata.history);

  const parts = ensureParts(metadata.parts, detail, steps);

  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    summary: detail.summary,
    status: detail.status,
    stage: detail.stage,
    stages: detail.stages,
    subjects: detail.subjects,
    deliveryMethods: detail.deliveryMethods,
    technologyTags: detail.technologyTags,
    durationMinutes: detail.durationMinutes,
    overview: detail.overview,
    steps,
    standards,
    availableStandards,
    resources: detail.resources,
    lastSavedAt: typeof metadata.lastSavedAt === "string" ? metadata.lastSavedAt : detail.updatedAt,
    version: typeof metadata.version === "number" ? metadata.version : detail.updatedAt ? 1 : 0,
    parts,
    history,
    createdAt: detail.createdAt ?? null,
    updatedAt: detail.updatedAt ?? null,
  };
}

export function buildMetadataFromPlan(plan: LessonBuilderPlan): Record<string, unknown> {
  return {
    builder: {
      version: plan.version,
      steps: plan.steps,
      standards: plan.standards,
      availableStandards: plan.availableStandards,
      parts: plan.parts,
      lastSavedAt: plan.lastSavedAt,
      history: plan.history,
    },
  };
}

export function buildUpdatePayload(plan: LessonBuilderPlan): Partial<LessonPlanRecord> {
  return {
    title: plan.title,
    summary: plan.summary,
    stage: plan.stage,
    stages: plan.stages,
    subjects: plan.subjects,
    delivery_methods: plan.deliveryMethods,
    technology_tags: plan.technologyTags,
    duration_minutes: plan.durationMinutes,
    overview: plan.overview,
    content: builderStepsToContent(plan.steps),
    resources: plan.resources,
    metadata: buildMetadataFromPlan(plan),
  } as Partial<LessonPlanRecord>;
}

export function createDraftInsert(
  plan: Pick<LessonBuilderPlan, "id" | "slug" | "title" | "summary" | "stage" | "stages" | "subjects" | "deliveryMethods" | "technologyTags" | "durationMinutes"> & {
    status: LessonPlanRecord["status"];
    overview: LessonBuilderPlan["overview"];
    steps: LessonBuilderPlan["steps"];
    standards: LessonBuilderPlan["standards"];
    availableStandards: LessonBuilderPlan["availableStandards"];
    resources: LessonBuilderPlan["resources"];
    version: number;
    parts: LessonBuilderPlan["parts"];
    history: LessonBuilderPlan["history"];
  }
): Partial<LessonPlanRecord> {
  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    summary: plan.summary,
    stage: plan.stage,
    stages: plan.stages,
    subjects: plan.subjects,
    delivery_methods: plan.deliveryMethods,
    technology_tags: plan.technologyTags,
    duration_minutes: plan.durationMinutes,
    status: plan.status,
    overview: plan.overview,
    content: builderStepsToContent(plan.steps),
    resources: plan.resources,
    metadata: {
      builder: {
        version: plan.version,
        steps: plan.steps,
        standards: plan.standards,
        availableStandards: plan.availableStandards,
        parts: plan.parts,
        lastSavedAt: null,
        history: plan.history,
      },
    },
  } as Partial<LessonPlanRecord>;
}

export function nextVersionEntry(
  plan: LessonBuilderPlan,
  timestamp: string
): LessonBuilderVersionEntry {
  const label = `Draft v${plan.version + 1}`;
  return {
    id: cryptoRandomId("ver"),
    label,
    createdAt: timestamp,
    author: plan.history[0]?.author ?? null,
    summary: plan.summary,
  };
}
