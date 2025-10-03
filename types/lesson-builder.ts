import type {
  LessonPlanContentBlock,
  LessonPlanContentSection,
  LessonPlanOverview,
  LessonPlanResource,
  LessonPlanStatus,
  LessonPlan,
  LessonPlanListItem,
} from "./lesson-plans";

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

export interface LessonBuilderStepResource {
  id: string;
  label: string;
  url: string;
  type: string | null;
  thumbnail: string | null;
  domain: string | null;
  notes: string | null;
  [key: string]: unknown;
}

export interface LessonBuilderStep {
  id: string;
  title: string;
  description: string | null;
  learningGoals: string | null;
  durationMinutes: number | null;
  duration: string | null;
  grouping: string | null;
  delivery: string | null;
  notes: string | null;
  activities: LessonBuilderActivity[];
  resources: LessonBuilderStepResource[];
}

export interface LessonBuilderResourceSearchResult {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: string | null;
  thumbnail: string | null;
  domain: string | null;
  duration: string | null;
  mediaType: string | null;
  stage: string | null;
  subjects: string[];
  favicon: string | null;
  instructionalNote: string | null;
  hasNotes?: boolean;
  isMine?: boolean;
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
  schoolLogoUrl: string | null;
  lessonDate: string | null;
  overview: LessonPlanOverview | null;
  steps: LessonBuilderStep[];
  standards: LessonBuilderStandard[];
  availableStandards: LessonBuilderStandard[];
  resources: LessonPlanResource[];
  lastSavedAt: string | null;
  version: number;
  parts: LessonBuilderPart[];
  history: LessonBuilderVersionEntry[];
  ownerId?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
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
}

export interface LessonBuilderUpdateRequest {
  plan: LessonBuilderPlan;
}

function ensureString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function extractDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./i, "");
  } catch (error) {
    return null;
  }
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
    schoolLogoUrl: plan.schoolLogoUrl,
    lessonDate: plan.lessonDate,
    status: plan.status,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export function builderPlanToLessonPlan(plan: LessonBuilderPlan): LessonPlan {
  const overview = plan.overview
    ? {
        ...plan.overview,
        objectives: Array.isArray(plan.overview.objectives) ? plan.overview.objectives : [],
        successCriteria: Array.isArray((plan.overview as { successCriteria?: unknown }).successCriteria)
          ? ((plan.overview as { successCriteria?: string[] }).successCriteria ?? [])
          : [],
      }
    : null;

  return {
    ...createListItemFromPlan(plan),
    overview,
    content: builderStepsToContent(plan.steps),
    resources: plan.resources,
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

export function mergeResourceValues(
  values: Partial<LessonBuilderStepResource>
): LessonBuilderStepResource {
  const base = (typeof values === "object" && values !== null ? values : {}) as Record<string, unknown>;
  const url = ensureString(base.url) ?? "";
  const label = ensureString(base.label) ?? ensureString(base.title) ?? "Resource";
  const notes =
    ensureString((base.notes as string | undefined) ?? (base.instructions as string | undefined)) ??
    ensureString((base.instructionalNote as string | undefined) ?? (base.instructional_note as string | undefined)) ??
    null;

  return {
    ...base,
    id: ensureString(base.id) ?? cryptoRandomId("res"),
    label,
    url,
    type: ensureString(base.type),
    thumbnail: ensureString(base.thumbnail),
    domain: ensureString(base.domain) ?? (url ? extractDomain(url) : null),
    notes,
  } as LessonBuilderStepResource;
}

export function mergeStepValues(
  values: Partial<LessonBuilderStep>
): LessonBuilderStep {
  const base = values as Record<string, unknown>;
  const normalizedDescription = ensureString(values.description);
  const learningGoals =
    ensureString((base.learningGoals as string | undefined) ?? (base.learning_goals as string | undefined)) ??
    normalizedDescription;
  const durationText =
    ensureString((base.duration as string | undefined) ?? (base.durationText as string | undefined)) ??
    (typeof values.durationMinutes === "number" && Number.isFinite(values.durationMinutes)
      ? String(Math.max(0, Math.trunc(values.durationMinutes)))
      : null);
  const grouping = ensureString(base.grouping as string | undefined);
  const delivery =
    ensureString((base.delivery as string | undefined) ?? (base.deliveryMode as string | undefined)) ??
    null;
  const notes =
    ensureString(values.notes) ??
    ensureString((base.instructionalNote as string | undefined) ?? (base.instructional_note as string | undefined));

  return {
    id: values.id ?? cryptoRandomId("step"),
    title: ensureString(values.title) ?? "",
    description: learningGoals ?? normalizedDescription,
    learningGoals,
    durationMinutes:
      typeof values.durationMinutes === "number" && Number.isFinite(values.durationMinutes)
        ? Math.max(0, Math.trunc(values.durationMinutes))
        : null,
    duration: durationText,
    grouping,
    delivery,
    notes,
    activities: Array.isArray(values.activities)
      ? values.activities.map((activity) => mergeActivityValues(activity))
      : [],
    resources: Array.isArray((base.resources as unknown[] | undefined))
      ? (base.resources as unknown[]).map((resource) => mergeResourceValues(resource as Partial<LessonBuilderStepResource>))
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
