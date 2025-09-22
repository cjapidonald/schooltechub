import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";

import { usePlanAutosave } from "@/hooks/usePlanAutosave";
import { usePlanHistory } from "@/hooks/usePlanHistory";
import type { PlanPartType, PlanSnapshot, PlanStep } from "@/types/plan-builder";

export interface PlanPartTemplate {
  id: string;
  type: PlanPartType;
  title: string;
  description?: string;
  defaultDuration: number;
  defaultNotes?: string;
}

interface PlanEditorContextValue {
  plan: PlanSnapshot;
  steps: PlanStep[];
  targetMinutes: number;
  addStepFromTemplate: (template: PlanPartTemplate, index?: number) => void;
  addCustomStep: (step: Omit<PlanStep, "id">, index?: number) => PlanStep;
  updatePlan: (updater: (plan: PlanSnapshot) => PlanSnapshot) => void;
  updateStep: (id: string, updater: (step: PlanStep) => PlanStep) => void;
  removeStep: (id: string) => void;
  duplicateStep: (id: string, index?: number) => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;
  setTargetMinutes: (minutes: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  autosave: {
    isSaving: boolean;
    lastSavedAt: string | null;
  };
}

const PlanEditorContext = createContext<PlanEditorContextValue | undefined>(undefined);

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `step-${Math.random().toString(36).slice(2, 9)}`;
};

function insertAt<T>(list: T[], index: number, value: T): T[] {
  const next = list.slice();
  const position = Math.max(0, Math.min(index, next.length));
  next.splice(position, 0, value);
  return next;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const next = items.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function withUpdatedAt(snapshot: PlanSnapshot, steps: PlanStep[] | null, targetMinutes?: number): PlanSnapshot {
  return {
    ...snapshot,
    steps: steps ?? snapshot.steps,
    targetMinutes: targetMinutes ?? snapshot.targetMinutes,
    updatedAt: new Date().toISOString(),
  };
}

interface PlanEditorProviderProps {
  initialSnapshot: PlanSnapshot;
  children: ReactNode;
}

export function PlanEditorProvider({ initialSnapshot, children }: PlanEditorProviderProps) {
  const history = usePlanHistory(initialSnapshot);

  const handleHydrated = useCallback(
    (stored: PlanSnapshot) => {
      history.apply(stored, { pushToHistory: false });
      history.markServerSnapshot();
    },
    [history],
  );

  const handleSaved = useCallback(() => {
    history.markServerSnapshot();
  }, [history]);

  const { isSaving, lastSavedAt, hydrate } = usePlanAutosave(history.snapshot.id, history.snapshot, {
    onHydrated: handleHydrated,
    onSaved: handleSaved,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const addStepFromTemplate = useCallback(
    (template: PlanPartTemplate, index?: number) => {
      history.update((current) => {
        const step: PlanStep = {
          id: randomId(),
          type: template.type,
          title: template.title,
          description: template.description,
          durationMinutes: template.defaultDuration,
          notes: template.defaultNotes,
        };
        const nextSteps = insertAt(current.steps, index ?? current.steps.length, step);
        return withUpdatedAt(current, nextSteps);
      });
    },
    [history],
  );

  const addCustomStep = useCallback(
    (stepInput: Omit<PlanStep, "id">, index?: number) => {
      let created: PlanStep | null = null;
      history.update((current) => {
        created = {
          ...stepInput,
          id: randomId(),
        };
        const nextSteps = insertAt(current.steps, index ?? current.steps.length, created);
        return withUpdatedAt(current, nextSteps);
      });

      if (!created) {
        throw new Error("Failed to create step");
      }

      return created;
    },
    [history],
  );

  const updatePlan = useCallback(
    (updater: (plan: PlanSnapshot) => PlanSnapshot) => {
      history.update((current) => {
        const cloned: PlanSnapshot = {
          ...current,
          steps: current.steps.map((step) => ({ ...step })),
        };
        const next = updater(cloned);
        return {
          ...next,
          steps: next.steps.map((step) => ({ ...step })),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [history],
  );

  const updateStep = useCallback(
    (id: string, updater: (step: PlanStep) => PlanStep) => {
      history.update((current) => {
        const nextSteps = current.steps.map((step) => (step.id === id ? { ...updater(step), id: step.id } : step));
        return withUpdatedAt(current, nextSteps);
      });
    },
    [history],
  );

  const removeStep = useCallback(
    (id: string) => {
      history.update((current) => {
        const nextSteps = current.steps.filter((step) => step.id !== id);
        return withUpdatedAt(current, nextSteps);
      });
    },
    [history],
  );

  const duplicateStep = useCallback(
    (id: string, index?: number) => {
      history.update((current) => {
        const existingIndex = current.steps.findIndex((step) => step.id === id);
        if (existingIndex === -1) {
          return current;
        }
        const source = current.steps[existingIndex];
        const duplicate: PlanStep = {
          ...source,
          id: randomId(),
          title: `${source.title} (Copy)`,
        };
        const targetIndex = index ?? existingIndex + 1;
        const nextSteps = insertAt(current.steps, targetIndex, duplicate);
        return withUpdatedAt(current, nextSteps);
      });
    },
    [history],
  );

  const reorderSteps = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) {
        return;
      }
      history.update((current) => {
        const nextSteps = moveItem(current.steps, fromIndex, toIndex);
        return withUpdatedAt(current, nextSteps);
      });
    },
    [history],
  );

  const setTargetMinutes = useCallback(
    (minutes: number) => {
      history.update((current) => withUpdatedAt(current, null, Math.max(0, Math.round(minutes))));
    },
    [history],
  );

  const value = useMemo<PlanEditorContextValue>(
    () => ({
      plan: history.snapshot,
      steps: history.snapshot.steps,
      targetMinutes: history.snapshot.targetMinutes,
      addStepFromTemplate,
      addCustomStep,
      updatePlan,
      updateStep,
      removeStep,
      duplicateStep,
      reorderSteps,
      setTargetMinutes,
      undo: history.undo,
      redo: history.redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      autosave: {
        isSaving,
        lastSavedAt,
      },
    }),
    [
      addStepFromTemplate,
      addCustomStep,
      isSaving,
      lastSavedAt,
      duplicateStep,
      history.canRedo,
      history.canUndo,
      history.redo,
      history.snapshot,
      history.undo,
      reorderSteps,
      removeStep,
      setTargetMinutes,
      updatePlan,
      updateStep,
    ],
  );

  return <PlanEditorContext.Provider value={value}>{children}</PlanEditorContext.Provider>;
}

export function usePlanEditor() {
  const context = useContext(PlanEditorContext);
  if (!context) {
    throw new Error("usePlanEditor must be used within a PlanEditorProvider");
  }
  return context;
}
