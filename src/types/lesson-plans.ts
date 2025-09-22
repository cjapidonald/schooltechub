import type {
  LessonPlanContentBlock as ApiLessonPlanContentBlock,
  LessonPlanContentSection as ApiLessonPlanContentSection,
  LessonPlanListItem as ApiLessonPlanListItem,
  LessonPlanListResponse as ApiLessonPlanListResponse,
  LessonPlanOverview as ApiLessonPlanOverview,
  LessonPlanResource as ApiLessonPlanResource,
  LessonPlanShareAccess as ApiLessonPlanShareAccess,
  LessonPlanVersion as ApiLessonPlanVersion,
  LessonPlanViewerRole as ApiLessonPlanViewerRole,
} from "../../types/lesson-plans";

export interface Stage {
  value: string;
  label: string;
  description?: string;
  gradeRange?: string;
}

export interface DeliveryMode {
  value: string;
  label: string;
  description?: string;
  durationHint?: string;
}

export interface LessonPlan extends ApiLessonPlanListItem {
  overview: ApiLessonPlanOverview | null;
  content: ApiLessonPlanContentSection[];
  resources: ApiLessonPlanResource[];
}

export type LessonPlanListItem = ApiLessonPlanListItem;
export type LessonPlanOverview = ApiLessonPlanOverview;
export type LessonPlanContentBlock = ApiLessonPlanContentBlock;
export type LessonPlanContentSection = ApiLessonPlanContentSection;
export type LessonPlanResource = ApiLessonPlanResource;
export type LessonPlanListResponse = ApiLessonPlanListResponse;
export type LessonPlanShareAccess = ApiLessonPlanShareAccess;
export type LessonPlanViewerRole = ApiLessonPlanViewerRole;
export type LessonPlanVersion = ApiLessonPlanVersion;
