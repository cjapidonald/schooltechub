export type LessonPlanStatus = "draft" | "published" | "archived";

 LessonPlanContentSection as ApiLessonPlanContentSection,
  LessonPlanListItem as ApiLessonPlanListItem,
  LessonPlanListResponse as ApiLessonPlanListResponse,
  LessonPlanOverview as ApiLessonPlanOverview,
  LessonPlanResource as ApiLessonPlanResource,
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
  schoolLogoUrl: string | null;
  lessonDate: string | null;

export type LessonPlanListItem = ApiLessonPlanListItem;
export type LessonPlanOverview = ApiLessonPlanOverview;
export type LessonPlanContentBlock = ApiLessonPlanContentBlock;
export type LessonPlanContentSection = ApiLessonPlanContentSection;
export type LessonPlanResource = ApiLessonPlanResource;
export type LessonPlanListResponse = ApiLessonPlanListResponse;
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
  schoolLogoUrl?: string | null;
  lessonDate?: string | null;
}

export interface LessonPlanListResponse {
  items: LessonPlanListItem[];
  nextCursor: string | null;
}

export interface LessonPlanRecord {
  id: string;
  slug: string;
  title: string;
  status: LessonPlanStatus;
  summary?: string | null;
  excerpt?: string | null;
  description?: string | null;
  overview?: unknown;
  stage?: string | null;
  stages?: string[] | null;
  stage_levels?: string[] | null;
  subjects?: string[] | null;
  subject?: string | null;
  delivery_methods?: string[] | null;
  delivery?: string[] | null;
  delivery_modes?: string[] | null;
  delivery_format?: string[] | null;
  technology_tags?: string[] | null;
  technology?: string[] | null;
  tech?: string[] | null;
  tools?: string[] | null;
  duration_minutes?: number | null;
  duration?: number | null;
  time_required?: number | null;
  pdf_url?: string | null;
  pdf?: string | null;
  attachments?: unknown;
  resources?: unknown;
  content?: unknown;
  body?: unknown;
 created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  metadata?: unknown;
  lesson_date?: string | null;
  school_logo_url?: string | null;
}
