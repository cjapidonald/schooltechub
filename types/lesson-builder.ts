import type {
  LessonPlanContentBlock,
  LessonPlanContentSection,
  LessonPlanOverview,
  LessonPlanResource,
  LessonPlanStatus,
  LessonPlan,
  LessonPlanListItem,
} from "./lesson-plans";

export type MediaType =
  | "activity"
  | "video"
  | "audio"
  | "document"
  | "image"
  | "website"
  | "presentation"
  | "other"
  | (string & {});

export interface Resource {
  id: string;
  source_id: string | null;
  media_type: MediaType;
  title: string | null;
  summary: string | null;
  url: string | null;
  provider: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  embed_html: string | null;
}

export interface LessonBuilderActivity {
  id: string;
  title: string;
  summary: string | null;
  subjects: string[];
  gradeLevels: string[];
  durationMinutes: number | null;
  sourceUrl: string | null;
  tags: string[];
}

export interface LessonBuilderStep {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  notes: string | null;
  activities: LessonBuilderActivity[];
  learning_goals: string[];
  grouping: string | null;
  delivery_mode: string | null;
  instructional_note: string | null;
  resources: Resource[];
}

export interface LessonBuilderStandard {
  id: string;
  code: string;
  description: string;
  domain: string | null;
  subject: string | null;
  gradeLevels: string[];
}

export interface LessonBuilderPart {
  id: string;
  label: string;
  description: string | null;
  completed: boolean;
}

export interface LessonBuilderVersionEntry {
  id: string;
  label: string;
  createdAt: string;
  author: string | null;
  summary: string | null;
}

export interface LessonBuilderPlan {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  status: LessonPlanStatus;
  stage: string | null;
  stages: string[];
  subjects: string[];
  deliveryMethods: string[];
  technologyTags: string[];
  durationMinutes: number | null;
  overview: LessonPlanOverview | null;
  steps: LessonBuilderStep[];
  standards: LessonBuilderStandard[];
  availableStandards: LessonBuilderStandard[];
  resources: LessonPlanResource[];
  lastSavedAt: string | null;
  version: number;
  parts: LessonBuilderPart[];
  history: LessonBuilderVersionEntry[];
  createdAt: string | null;
  updatedAt: string | null;
  school_logo_url: string | null;
  lesson_date: string | null;
}

export interface LessonBuilderPlanResponse {
  plan: LessonBuilderPlan;
}

export interface LessonBuilderHistoryResponse {
  versions: LessonBuilderVersionEntry[];
}

export interface LessonBuilderActivitySearchResponse {
  results: LessonBuilderActivity[];
}

export interface LessonBuilderDraftRequest {
  title?: string | null;
  stage?: string | null;
  subjects?: string[];
  profileId?: string | null;
}

export interface LessonBuilderUpdateRequest {
  plan: LessonBuilderPlan;
}

function ensureString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function ensureStringArray(values: unknown): string[] {
  if (!values) {
    return [];
  }
  if (Array.isArray(values)) {
    return values
      .map((value) => ensureString(value))
      .filter((value): value is string => Boolean(value));
  }
  if (typeof values === "string") {
    return values
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

export function builderStepsToContent(
  steps: LessonBuilderStep[]
): LessonPlanContentSection[] {
  return steps.map((step, index) => {
    const blocks: LessonPlanContentBlock[] = [];

    if (step.description) {
      blocks.push({
        type: "paragraph",
        text: step.description,
      });
    }

    if (step.activities.length > 0) {
      blocks.push({
        type: "list",
        items: step.activities.map((activity) =>
          activity.summary
            ? `${activity.title} — ${activity.summary}`
            : activity.title
        ),
      });
    }

    if (step.notes) {
      blocks.push({
        type: "quote",
        text: step.notes,
      });
    }

    const metadataBlock: Record<string, unknown> = {
      type: "builderStepMetadata",
      learning_goals: step.learning_goals,
      grouping: step.grouping,
      delivery_mode: step.delivery_mode,
      instructional_note: step.instructional_note,
      resources: step.resources,
    };

    const hasMetadata =
      step.learning_goals.length > 0 ||
      Boolean(step.grouping) ||
      Boolean(step.delivery_mode) ||
      Boolean(step.instructional_note) ||
      step.resources.length > 0;

    if (hasMetadata) {
      blocks.push(metadataBlock as LessonPlanContentBlock);
    }

    return {
      id: step.id,
      title: step.title || `Step ${index + 1}`,
      description: step.description,
      blocks,
    };
  });
}

function createListItemFromPlan(plan: LessonBuilderPlan): LessonPlanListItem {
  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    summary: plan.summary,
    stage: plan.stage,
    stages: plan.stages,
    subjects: plan.subjects,
    deliveryMethods: plan.deliveryMethods,
    technologyTags: plan.technologyTags,
    durationMinutes: plan.durationMinutes,
    pdfUrl: null,
    status: plan.status,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export function builderPlanToLessonPlan(plan: LessonBuilderPlan): LessonPlan {
  return {
    ...createListItemFromPlan(plan),
    overview: plan.overview,
    content: builderStepsToContent(plan.steps),
    resources: plan.resources,
    schoolLogoUrl: plan.school_logo_url,
    lessonDate: plan.lesson_date,
  };
}

export function mergeStandardValues(
  values: Partial<LessonBuilderStandard>
): LessonBuilderStandard {
  return {
    id: values.id ?? cryptoRandomId("std"),
    code: ensureString(values.code) ?? "STD",
    description: ensureString(values.description) ?? "Standard",
    domain: ensureString(values.domain),
    subject: ensureString(values.subject),
    gradeLevels: ensureStringArray(values.gradeLevels),
  };
}

export function mergeActivityValues(
  values: Partial<LessonBuilderActivity>
): LessonBuilderActivity {
  return {
    id: values.id ?? cryptoRandomId("act"),
    title: ensureString(values.title) ?? "Untitled Activity",
    summary: ensureString(values.summary),
    subjects: ensureStringArray(values.subjects),
    gradeLevels: ensureStringArray(values.gradeLevels),
    durationMinutes:
      typeof values.durationMinutes === "number" && Number.isFinite(values.durationMinutes)
        ? Math.max(0, Math.trunc(values.durationMinutes))
        : null,
    sourceUrl: ensureString(values.sourceUrl),
    tags: ensureStringArray(values.tags),
  };
}

export function mergeResourceValues(values: Partial<Resource> | null | undefined): Resource {
  const mediaType =
    typeof values?.media_type === "string" && values.media_type.trim().length > 0
      ? (values.media_type as MediaType)
      : "other";

  const duration = values?.duration_minutes;
  const normalizedDuration =
    typeof duration === "number" && Number.isFinite(duration)
      ? Math.max(0, Math.trunc(duration))
      : null;

  return {
    id: values?.id ?? cryptoRandomId("res"),
    source_id: ensureString(values?.source_id),
    media_type: mediaType,
    title: ensureString(values?.title),
    summary: ensureString(values?.summary),
    url: ensureString(values?.url),
    provider: ensureString(values?.provider),
    thumbnail_url: ensureString(values?.thumbnail_url),
    duration_minutes: normalizedDuration,
    embed_html: ensureString(values?.embed_html),
  };
}

export function mergeStepValues(
  values: Partial<LessonBuilderStep>
): LessonBuilderStep {
  return {
    id: values.id ?? cryptoRandomId("step"),
    title: ensureString(values.title) ?? "",
    description: ensureString(values.description),
    durationMinutes:
      typeof values.durationMinutes === "number" && Number.isFinite(values.durationMinutes)
        ? Math.max(0, Math.trunc(values.durationMinutes))
        : null,
    notes: ensureString(values.notes),
    activities: Array.isArray(values.activities)
      ? values.activities.map((activity) => mergeActivityValues(activity))
      : [],
    learning_goals: ensureStringArray(values.learning_goals),
    grouping: ensureString(values.grouping),
    delivery_mode: ensureString(values.delivery_mode),
    instructional_note: ensureString(values.instructional_note),
    resources: Array.isArray(values.resources)
      ? values.resources.map((resource) => mergeResourceValues(resource))
      : [],
  };
}

export function cryptoRandomId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}
