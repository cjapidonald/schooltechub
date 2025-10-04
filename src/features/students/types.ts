import type { Class } from "../../../types/supabase-tables";

export type StudentSkillScore = {
  id: string;
  month: string;
  score: number;
};

export type StudentSkillProgress = {
  skillId: string;
  skillName: string;
  scores: StudentSkillScore[];
};

export type StudentRecord = {
  id: string;
  classId: string;
  fullName: string;
  preferredName?: string;
  guardianName?: string;
  guardianContact?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  behaviorComment?: string;
  academicComment?: string;
  skills: StudentSkillProgress[];
  isExample?: boolean;
};

export type SkillDefinition = {
  id: string;
  classId: string;
  title: string;
  description?: string;
  isExample?: boolean;
};

export type ClassSummary = Pick<Class, "id" | "title" | "stage" | "subject">;
