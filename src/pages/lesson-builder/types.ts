import type { Subject } from "@/lib/constants/subjects";

export interface LessonPlanMetaDraft {
  title: string;
  subject: Subject | null;
  date: string | null;
  objective: string;
  successCriteria: string;
}
