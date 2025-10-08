import { nanoid } from "nanoid";
import { create } from "zustand";

export type LessonStep = {
  id: string;
  remoteId: string | null;
  title: string;
  notes?: string;
  resourceIds: string[];
};

export type LessonDraft = {
  id: string;
  remotePlanId: string | null;
  title?: string;
  date?: string;
  logoUrl?: string;
  duration?: string;
  grouping?: "Whole class" | "Pairs" | "Groups" | "Individual";
  deliveryMode?: "Online" | "Offline" | "Hybrid";
  steps: LessonStep[];
};

export const LESSON_DRAFT_STORAGE_KEY = "lessonDraft";

const PERSIST_DEBOUNCE_MS = 300;

type DraftFieldKey = keyof Omit<LessonDraft, "steps">;

type LessonDraftStore = {
  draft: LessonDraft;
  getDraft: () => LessonDraft;
  setField: <K extends DraftFieldKey>(key: K, value: LessonDraft[K]) => void;
  addStep: () => LessonStep;
  renameStep: (stepId: string, title: string) => void;
  removeStep: (stepId: string) => void;
  setStepNotes: (stepId: string, notes: string) => void;
  attachResource: (stepId: string, resourceId: string) => void;
  detachResource: (stepId: string, resourceId: string) => void;
  insertStepResource: (stepId: string, resourceId: string, index?: number) => void;
  reorderStepResources: (stepId: string, resourceIds: string[]) => void;
  moveStepResource: (stepId: string, resourceId: string, direction: "up" | "down") => void;
  resetDraft: () => void;
};

export const createEmptyLessonDraft = (): LessonDraft => ({
  id: nanoid(),
  remotePlanId: null,
  steps: [],
});

const sanitizeStep = (maybeStep: unknown): LessonStep | undefined => {
  if (!maybeStep || typeof maybeStep !== "object") {
    return undefined;
  }

  const step = maybeStep as Partial<LessonStep> & { [key: string]: unknown };
  const id = typeof step.id === "string" ? step.id : nanoid();
  const remoteId =
    typeof step.remoteId === "string" && step.remoteId.trim().length > 0 ? step.remoteId : null;
  const title = typeof step.title === "string" ? step.title : "";
  const notes = typeof step.notes === "string" ? step.notes : undefined;
  const resourceIds = Array.isArray(step.resourceIds)
    ? step.resourceIds.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id,
    remoteId,
    title,
    notes,
    resourceIds,
  };
};

const sanitizeDraft = (maybeDraft: unknown): LessonDraft => {
  if (!maybeDraft || typeof maybeDraft !== "object") {
    return createEmptyLessonDraft();
  }

  const draft = maybeDraft as Partial<LessonDraft> & { [key: string]: unknown };
  const baseDraft = createEmptyLessonDraft();
  const steps = Array.isArray(draft.steps)
    ? draft.steps
        .map(sanitizeStep)
        .filter((step): step is LessonStep => Boolean(step))
    : [];

  return {
    ...baseDraft,
    ...draft,
    id: typeof draft.id === "string" && draft.id.trim().length > 0 ? draft.id : baseDraft.id,
    remotePlanId:
      typeof draft.remotePlanId === "string" && draft.remotePlanId.trim().length > 0
        ? draft.remotePlanId
        : null,
    steps,
  };
};

const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const loadDraftFromStorage = (): LessonDraft => {
  if (!isLocalStorageAvailable()) {
    return createEmptyLessonDraft();
  }

  try {
    const stored = window.localStorage.getItem(LESSON_DRAFT_STORAGE_KEY);
    if (!stored) {
      return createEmptyLessonDraft();
    }

    return sanitizeDraft(JSON.parse(stored));
  } catch {
    return createEmptyLessonDraft();
  }
};

const debounce = <T extends (...args: never[]) => void>(fn: T, delay: number): T => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      fn(...args);
    }, delay);
  }) as T;
};

export const useLessonDraftStore = create<LessonDraftStore>()((set, get) => ({
  draft: loadDraftFromStorage(),
  getDraft: () => get().draft,
  setField: (key, value) => {
    set((state) => ({
      draft: {
        ...state.draft,
        [key]: value,
      },
    }));
  },
  addStep: () => {
    const newStep: LessonStep = {
      id: nanoid(),
      remoteId: null,
      title: "New step",
      resourceIds: [],
    };

    set((state) => ({
      draft: {
        ...state.draft,
        steps: [...state.draft.steps, newStep],
      },
    }));

    return newStep;
  },
  renameStep: (stepId, title) => {
    set((state) => ({
      draft: {
        ...state.draft,
        steps: state.draft.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                title,
              }
            : step,
        ),
      },
    }));
  },
  setStepNotes: (stepId, notes) => {
    set((state) => ({
      draft: {
        ...state.draft,
        steps: state.draft.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                notes: notes.trim().length > 0 ? notes : undefined,
              }
            : step,
        ),
      },
    }));
  },
  removeStep: (stepId) => {
    set((state) => ({
      draft: {
        ...state.draft,
        steps: state.draft.steps.filter((step) => step.id !== stepId),
      },
    }));
  },
  attachResource: (stepId, resourceId) => {
    useLessonDraftStore.getState().insertStepResource(stepId, resourceId);
  },
  detachResource: (stepId, resourceId) => {
    set((state) => ({
      draft: {
        ...state.draft,
        steps: state.draft.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                resourceIds: step.resourceIds.filter((id) => id !== resourceId),
              }
            : step,
        ),
      },
    }));
  },
  insertStepResource: (stepId, resourceId, index) => {
    set((state) => ({
      draft: {
        ...state.draft,
        steps: state.draft.steps.map((step) => {
          if (step.id !== stepId) {
            return step;
          }

          if (step.resourceIds.includes(resourceId)) {
            return step;
          }

          const next = [...step.resourceIds];
          const safeIndex = typeof index === "number" && index >= 0 && index <= next.length ? index : next.length;
          next.splice(safeIndex, 0, resourceId);

          return {
            ...step,
            resourceIds: next,
          };
        }),
      },
    }));
  },
  reorderStepResources: (stepId, resourceIds) => {
    set((state) => ({
      draft: {
        ...state.draft,
        steps: state.draft.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                resourceIds,
              }
            : step,
        ),
      },
    }));
  },
  moveStepResource: (stepId, resourceId, direction) => {
    const { draft, reorderStepResources } = useLessonDraftStore.getState();
    const step = draft.steps.find((item) => item.id === stepId);
    if (!step) {
      return;
    }

    const currentIndex = step.resourceIds.indexOf(resourceId);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= step.resourceIds.length) {
      return;
    }

    const next = [...step.resourceIds];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(nextIndex, 0, moved);

    reorderStepResources(stepId, next);
  },
  resetDraft: () => {
    set({
      draft: createEmptyLessonDraft(),
    });
  },
}));

if (isLocalStorageAvailable()) {
  const persistDraft = debounce((draft: LessonDraft) => {
    try {
      window.localStorage.setItem(LESSON_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn("Failed to persist lesson draft", error);
    }
  }, PERSIST_DEBOUNCE_MS);

  useLessonDraftStore.subscribe((state) => {
    persistDraft(state.draft);
  });
}
