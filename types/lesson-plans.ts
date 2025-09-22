export type LessonPlanStatus = "draft" | "published" | "archived";

export const LESSON_STAGE_VALUES = [
  "early childhood",
  "elementary",
  "middle school",
  "high school",
  "adult learners",
] as const;

export type LessonStageValue = (typeof LESSON_STAGE_VALUES)[number];

export const LESSON_DELIVERY_MODE_VALUES = [
  "in-person",
  "blended",
  "online",
  "project-based",
  "flipped",
] as const;

export type LessonDeliveryModeValue = (typeof LESSON_DELIVERY_MODE_VALUES)[number];

export interface LessonPlanListItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  stage: string | null;
  stages: string[];
  subjects: string[];
  deliveryMethods: string[];
  technologyTags: string[];
  durationMinutes: number | null;
  pdfUrl: string | null;
  status: LessonPlanStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LessonPlanOverview {
  summary: string | null;
  essentialQuestion: string | null;
  objectives: string[];
  materials: string[];
  assessment: string[];
  technology: string[];
  delivery: string[];
  stage: string | null;
  subjects: string[];
  durationMinutes: number | null;
}

export type LessonPlanContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "heading";
      text: string;
      level?: number;
    }
  | {
      type: "list";
      items: string[];
      ordered?: boolean;
    }
  | {
      type: "quote";
      text: string;
      attribution?: string;
    }
  | ({
      type: string;
    } & Record<string, unknown>);

export interface LessonPlanContentSection {
  id?: string;
  title: string | null;
  description: string | null;
  blocks: LessonPlanContentBlock[];
}

export interface LessonPlanResource {
  title: string;
  url: string | null;
  type: string | null;
  description: string | null;
}

export interface LessonPlanDetail extends LessonPlanListItem {
  content: LessonPlanContentSection[];
  overview: LessonPlanOverview | null;
  resources: LessonPlanResource[];
}

export interface LessonPlanListResponse {
  items: LessonPlanListItem[];
  nextCursor: string | null;
}

export interface LessonPlanRecord {
  id: string;
  owner_id?: string;
  slug: string;
  title: string;
  status: LessonPlanStatus;
  summary?: string | null;
  overview?: unknown;
  notes?: string | null;
  stage?: string | null;
  stages?: string[] | null;
  stage_levels?: string[] | null;
  subjects?: string[] | null;
  subject?: string | null;
  delivery_modes?: string[] | null;
  delivery_methods?: string[] | null;
  delivery?: string[] | null;
  delivery_format?: string[] | null;
  technology_tags?: string[] | null;
  technology?: string[] | null;
  tech?: string[] | null;
  tools?: string[] | null;
  grade_levels?: string[] | null;
  tags?: string[] | null;
  duration_minutes?: number | null;
  duration?: number | null;
  time_required?: number | null;
  share_code?: string;
  shared_with?: string[] | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  search_vector?: unknown;
  excerpt?: string | null;
  description?: string | null;
  metadata?: unknown;
  attachments?: unknown;
  resources?: unknown;
  content?: unknown;
  body?: unknown;
  pdf_url?: string | null;
  pdf?: string | null;
}

export interface BuilderActivity {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  stage: LessonStageValue;
  deliveryModes: LessonDeliveryModeValue[];
  subjects: string[];
  technologyTags: string[];
  durationMinutes: number | null;
  materials: string[];
  shareCode: string;
  sharedWith: string[];
  resourceUrl: string | null;
  resourceDomain: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderPlanStep {
  id: string;
  sectionId: string;
  activityId: string | null;
  title: string;
  instructions: string | null;
  stage: LessonStageValue | null;
  deliveryModes: LessonDeliveryModeValue[];
  materials: string[];
  technologyTags: string[];
  durationMinutes: number | null;
  resourceUrl: string | null;
  resourceDomain: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderPlanSection {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  steps: BuilderPlanStep[];
}

export interface BuilderStandard {
  id: string;
  framework: string;
  code: string;
  description: string | null;
  gradeBand: string | null;
  subject: string | null;
  url: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderPlanVersionSnapshot {
  plan: Record<string, unknown>;
  sections: Array<Record<string, unknown>>;
}

export interface BuilderPlanVersion {
  id: string;
  planId: string;
  version: number;
  snapshot: BuilderPlanVersionSnapshot;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface BuilderLessonPlan {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  summary: string | null;
  overview: Record<string, unknown>;
  notes: string | null;
  stage: LessonStageValue | null;
  subjects: string[];
  deliveryModes: LessonDeliveryModeValue[];
  technologyTags: string[];
  gradeLevels: string[];
  durationMinutes: number | null;
  tags: string[];
  status: LessonPlanStatus;
  shareCode: string;
  sharedWith: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: BuilderPlanSection[];
  standards: BuilderStandard[];
}
