export type Salutation = "Mr" | "Ms" | "Mx";

export type Profile = {
  id: string;
  salutation?: Salutation;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
};

export type Class = {
  id: string;
  title: string;
  stage?: string;
  subject?: string;
  start_date?: string;
  end_date?: string;
};

export type Curriculum = {
  id: string;
  class_id: string;
  subject: string;
  title: string;
  academic_year?: string;
};

export type CurriculumItemStatus = "planned" | "in_progress" | "done";

export type CurriculumItem = {
  id: string;
  curriculum_id: string;
  position: number;
  seq_index?: number;
  lesson_title: string;
  stage?: string;
  scheduled_on?: string;
  status: CurriculumItemStatus;
};

export type LessonPlan = {
  id: string;
  curriculum_item_id: string;
  title: string;
  class_id: string;
  stage?: string;
  planned_date?: string;
  body_md: string;
  exported_pdf_url?: string;
  exported_docx_url?: string;
};

export type ResourceType = "link" | "pdf" | "ppt" | "docx" | "image" | "video";

export type Resource = {
  id: string;
  type: ResourceType;
  title: string;
  instructions?: string;
  url?: string;
  file_path?: string;
  meta?: Record<string, unknown> | null;
};
