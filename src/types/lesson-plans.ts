import type {
  LessonDeliveryModeValue,
  LessonPlanContentBlock as ApiLessonPlanContentBlock,
  LessonPlanContentSection as ApiLessonPlanContentSection,
  LessonPlanListItem as ApiLessonPlanListItem,
  LessonPlanListResponse as ApiLessonPlanListResponse,
  LessonPlanOverview as ApiLessonPlanOverview,
  LessonPlanResource as ApiLessonPlanResource,
  LessonStageValue,
} from "../../types/lesson-plans";

export interface Stage {
  value: LessonStageValue;
  label: string;
  description?: string;
  gradeRange?: string;
}

export interface DeliveryMode {
  value: LessonDeliveryModeValue;
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
