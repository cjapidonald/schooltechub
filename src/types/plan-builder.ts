export type PlanPartType = "activity" | "timer" | "objective" | "standard" | "export";

export interface PlanStep {
  id: string;
  type: PlanPartType;
  title: string;
  description?: string;
  durationMinutes: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface PlanSnapshot {
  id: string;
  title: string;
  targetMinutes: number;
  steps: PlanStep[];
  updatedAt: string;
}

export interface PlanHistoryState {
  past: PlanSnapshot[];
  present: PlanSnapshot;
  future: PlanSnapshot[];
  serverRevision: number;
}

export interface AutosaveMetadata {
  lastSavedAt: string | null;
  serverSnapshot: PlanSnapshot | null;
}
