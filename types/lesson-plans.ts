export type LessonPlanStatus = "draft" | "published" | "archived";

export type LessonPlanShareAccess =
  | "private"
  | "link"
  | "org"
  | "public";

export type LessonPlanViewerRole = "owner" | "editor" | "viewer";

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
  shareAccess: LessonPlanShareAccess;
  viewerRole: LessonPlanViewerRole;
  canEdit: boolean;
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

export interface LessonPlanVersion {
  id: string;
  planId: string;
  snapshot: unknown;
  createdAt: string;
  createdBy: string | null;
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
  share_access?: string | null;
  viewer_role?: string | null;
  viewer_can_edit?: boolean | null;
  owner_id?: string | null;
}
