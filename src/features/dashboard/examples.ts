import type { Class, Curriculum, CurriculumItem } from "../../../types/supabase-tables";

export const DASHBOARD_EXAMPLE_CLASS_ID = "example-class";
export const DASHBOARD_EXAMPLE_CURRICULUM_ID = "example-curriculum";

export const DASHBOARD_EXAMPLE_CLASS: Class & { isExample: true } = {
  id: DASHBOARD_EXAMPLE_CLASS_ID,
  title: "Example Year 5 Literacy",
  stage: "Year 5",
  subject: "Literacy",
  start_date: "2024-09-02",
  end_date: "2025-07-15",
  isExample: true,
};

export type DashboardCurriculumSummary = (Curriculum & {
  class: Class | null;
  items_count: number;
  created_at?: string;
  isExample?: boolean;
});

export type DashboardCurriculumItem = CurriculumItem & {
  isExample?: boolean;
  lesson_plan_id?: string | null;
  resource_shortcut_ids?: string[];
  presentation_links?: string[];
};

export const DASHBOARD_EXAMPLE_CURRICULUM: DashboardCurriculumSummary = {
  id: DASHBOARD_EXAMPLE_CURRICULUM_ID,
  title: "Storytelling & Narrative Techniques",
  subject: "English",
  academic_year: "2024-2025",
  class_id: DASHBOARD_EXAMPLE_CLASS_ID,
  class: DASHBOARD_EXAMPLE_CLASS,
  items_count: 0,
  created_at: "2024-08-19T09:00:00.000Z",
  isExample: true,
};

export const DASHBOARD_EXAMPLE_CURRICULUM_ITEMS: DashboardCurriculumItem[] = [];
