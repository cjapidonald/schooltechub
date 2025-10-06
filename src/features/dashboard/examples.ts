import type { Class } from "../../../types/supabase-tables";

export const DASHBOARD_EXAMPLE_CLASS_ID = "example-class";

export const DASHBOARD_EXAMPLE_CLASS: Class & { isExample: true } = {
  id: DASHBOARD_EXAMPLE_CLASS_ID,
  title: "Ms. Rivera's Year 5 Literacy Workshop",
  stage: "Year 5",
  subject: "Literacy & Writing",
  start_date: "2024-09-02",
  end_date: "2025-07-15",
  isExample: true,
};
