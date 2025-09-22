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
  label: string;
  url: string;
  isHealthy?: boolean;
  statusText?: string | null;
  lastChecked?: string | null;
}

export interface BuilderStep {
  id: string;
  title: string;
  goal: string;
  notes: string;
  durationMinutes: number;
  grouping: string;
  deliveryMode: string;
  technology: string[];
  tags: string[];
  offlineFallback: string;
  resources: BuilderResourceLink[];
}

export interface BuilderState {
  id: string;
  title: string;
  objective: string;
  stage: string;
  subject: string;
  lessonDate: string | null;
  schoolLogoUrl: string | null;
  steps: BuilderStep[];
  updatedAt: string;
}

export interface BuilderDraftPayload {
  title?: string;
  objective?: string;
  stage?: string;
  subject?: string;
  steps?: BuilderStep[];
}

export type BuilderDraftJSON = Json;
