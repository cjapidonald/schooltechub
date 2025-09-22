export type LessonPlanStatus = "draft" | "published" | "archived";

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
  schoolLogoUrl: string | null;
  lessonDate: string | null;
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
@@ -92,26 +94,28 @@ export interface LessonPlanRecord {
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
  school_logo_url?: string | null;
  lesson_date?: string | null;
}

  published_at?: string | null;
  metadata?: unknown;
  school_logo_url?: string | null;
  lesson_date?: string | null;
}
