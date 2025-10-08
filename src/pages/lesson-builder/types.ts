import type { Subject } from "@/lib/constants/subjects";
import type { Resource } from "@/types/resources";

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

export interface LessonWorkspaceTextCard {
  id: string;
  title: string;
  content: string;
}

export type LessonWorkspaceItem =
  | {
      id: string;
      type: "resource";
      resource: Resource;
    }
  | {
      id: string;
      type: "text";
      textId: string;
    };
