import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type { BuilderState, BuilderStep } from "../types";
import { createEmptyStep } from "../utils/stepFactories";

interface BuilderContextValue {
  state: BuilderState;
  setState: (updater: (prev: BuilderState) => BuilderState) => void;
  addStep: () => void;
  duplicateStep: (stepId: string) => void;
  removeStep: (stepId: string) => void;
  reorderSteps: (fromId: string, toId: string) => void;
}

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

interface BuilderProviderProps {
  initialState?: Partial<BuilderState>;
  children: React.ReactNode;
}

const createDefaultState = (): BuilderState => ({
  id: nanoid(),
  title: "Untitled Lesson",
  objective: "",
  stage: "",
  subject: "",
  lessonDate: null,
  schoolLogoUrl: null,
  steps: [createEmptyStep()],
  updatedAt: new Date().toISOString(),
});

export const BuilderProvider = ({ children, initialState }: BuilderProviderProps) => {
  const [state, setStateInternal] = useState<BuilderState>(() => ({
    ...createDefaultState(),
    ...initialState,
    steps: initialState?.steps?.length ? initialState.steps : createDefaultState().steps,
  }));

  const setState = useCallback((updater: (prev: BuilderState) => BuilderState) => {
    setStateInternal(prev => {
      const next = updater(prev);
      return {
        ...next,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const addStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      steps: [...prev.steps, createEmptyStep()],
    }));
  }, [setState]);

  const duplicateStep = useCallback((stepId: string) => {
    setState(prev => {
      const index = prev.steps.findIndex(step => step.id === stepId);
      if (index === -1) return prev;
      const target = prev.steps[index];
      const copy: BuilderStep = {
        ...target,
        id: nanoid(),
        resources: target.resources.map(resource => ({ ...resource, id: nanoid() })),
      };
      const steps = [...prev.steps];
      steps.splice(index + 1, 0, copy);
      return {
        ...prev,
        steps,
      };
    });
  }, [setState]);

  const removeStep = useCallback((stepId: string) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId),
    }));
  }, [setState]);

  const reorderSteps = useCallback((fromId: string, toId: string) => {
    setState(prev => {
      const fromIndex = prev.steps.findIndex(step => step.id === fromId);
      const toIndex = prev.steps.findIndex(step => step.id === toId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return prev;
      }
      const steps = [...prev.steps];
      const [moved] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, moved);
      return {
        ...prev,
        steps,
      };
    });
  }, [setState]);

  const value = useMemo<BuilderContextValue>(
    () => ({ state, setState, addStep, duplicateStep, removeStep, reorderSteps }),
    [state, setState, addStep, duplicateStep, removeStep, reorderSteps],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
};

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
};
