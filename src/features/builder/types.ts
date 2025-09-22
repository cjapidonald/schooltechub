import type { Json } from "@/integrations/supabase/types";

export interface BuilderActivitySummary {
  slug: string;
  name: string;
  description: string | null;
  subjects: string[];
  schoolStages: string[];
  activityTypes: string[];
  tags: string[];
  duration: string | null;
  delivery: string | null;
  technology: string[];
}

export interface BuilderResourceLink {
  id: string;
  resourceId: string;
  title: string;
  url: string;
  description: string | null;
  tags: string[];
  resourceType: string | null;
  subject: string | null;
  gradeLevel: string | null;
  format: string | null;
  instructionalNotes: string | null;
  creatorId: string | null;
  creatorName: string | null;
}

export interface BuilderStep {
  id: string;
  title: string;
  learningGoals: string;
  duration: string;
  grouping: string;
  deliveryMode: string;
  notes: string;
  resources: BuilderResourceLink[];
}

export interface BuilderState {
  id: string;
  title: string;
  objective: string;
  stage: string;
  subject: string;
  schoolLogoUrl: string | null;
  lessonDate: string;
  steps: BuilderStep[];
  updatedAt: string;
}

export interface BuilderDraftPayload {
  title?: string;
  objective?: string;
  stage?: string;
  subject?: string;
  steps?: BuilderStep[];
  schoolLogoUrl?: string | null;
  lessonDate?: string;
}

export type BuilderDraftJSON = Json;
