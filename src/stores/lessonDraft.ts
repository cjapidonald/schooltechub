import { nanoid } from "nanoid";
import { create } from "zustand";

export type LessonStep = {
  id: string;
  title: string;
  notes?: string;
  resourceIds: string[];
};

export type LessonDraft = {
  id?: string;
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
  attachResource: (stepId: string, resourceId: string) => void;
  detachResource: (stepId: string, resourceId: string) => void;
  resetDraft: () => void;
};

export const createEmptyLessonDraft = (): LessonDraft => ({
  steps: [],
});

const sanitizeStep = (maybeStep: unknown): LessonStep | undefined => {
  if (!maybeStep || typeof maybeStep !== "object") {
    return undefined;
  }

  const step = maybeStep as Partial<LessonStep> & { [key: string]: unknown };
  const id = typeof step.id === "string" ? step.id : nanoid();
  const title = typeof step.title === "string" ? step.title : "";
  const notes = typeof step.notes === "string" ? step.notes : undefined;
  const resourceIds = Array.isArray(step.resourceIds)
    ? step.resourceIds.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id,
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
  const steps = Array.isArray(draft.steps)
    ? draft.steps
        .map(sanitizeStep)
        .filter((step): step is LessonStep => Boolean(step))
    : [];

  return {
    ...createEmptyLessonDraft(),
    ...draft,
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
  removeStep: (stepId) => {
    set((state) => ({
      draft: {
        ...state.draft,
        steps: state.draft.steps.filter((step) => step.id !== stepId),
      },
    }));
  },
  attachResource: (stepId, resourceId) => {
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

          return {
            ...step,
            resourceIds: [...step.resourceIds, resourceId],
          };
        }),
      },
    }));
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
