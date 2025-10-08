import type { Subject } from "@/lib/constants/subjects";

export interface LessonPlanMetaDraft {
  title: string;
  teacher: string | null;
  subject: Subject | null;
  date: string | null;
  objective: string;
  successCriteria: string;
  classId: string | null;
  lessonId: string | null;
  sequence: number | null;
  stage: string | null;
}
