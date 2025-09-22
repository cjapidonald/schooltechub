import type { LessonDraft } from "@/stores/lessonDraft";

const ACTIVE_STEP_STORAGE_PREFIX = "lesson-draft:active-step:";
const CONTEXT_EVENT = "lesson-draft:context-change";
const ACTIVE_STEP_EVENT = "lesson-draft:active-step-change";
const ATTACH_RESOURCE_EVENT = "lesson-draft:attach-resource";

type LessonDraftWindow = Window & {
  __activeLessonDraft?: LessonDraft["id"];
};

type LessonDraftContextDetail = {
  draftId: LessonDraft["id"] | null;
};

type LessonDraftActiveStepDetail = {
  draftId: LessonDraft["id"];
  stepId: string | null;
};

type LessonDraftAttachResourceDetail = {
  draftId: LessonDraft["id"];
  stepId: string;
  resourceId: string;
};

const isBrowser = () => typeof window !== "undefined";

const getLessonDraftWindow = (): LessonDraftWindow | null => {
  if (!isBrowser()) {
    return null;
  }
  return window as LessonDraftWindow;
};

const getStorage = (): Storage | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getActiveStepStorageKey = (draftId: string) => `${ACTIVE_STEP_STORAGE_PREFIX}${draftId}`;

const dispatchEvent = <TDetail,>(name: string, detail: TDetail) => {
  const target = getLessonDraftWindow();
  if (!target) {
    return;
  }

  target.dispatchEvent(new CustomEvent<TDetail>(name, { detail }));
};

export const getActiveLessonDraftId = (): LessonDraft["id"] | null => {
  const target = getLessonDraftWindow();
  if (!target) {
    return null;
  }

  const id = target.__activeLessonDraft;
  return typeof id === "string" && id.trim().length > 0 ? id : null;
};

export const setActiveLessonDraftId = (draftId: LessonDraft["id"] | null) => {
  const target = getLessonDraftWindow();
  if (!target) {
    return;
  }

  if (draftId) {
    target.__activeLessonDraft = draftId;
  } else {
    delete target.__activeLessonDraft;
  }

  dispatchEvent<LessonDraftContextDetail>(CONTEXT_EVENT, { draftId });
};

export const getStoredActiveStepId = (draftId: LessonDraft["id"]) => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const value = storage.getItem(getActiveStepStorageKey(draftId));
    return typeof value === "string" && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
};

export const persistActiveStepId = (draftId: LessonDraft["id"], stepId: string | null) => {
  const storage = getStorage();
  if (storage) {
    try {
      const key = getActiveStepStorageKey(draftId);
      if (stepId && stepId.trim().length > 0) {
        storage.setItem(key, stepId);
      } else {
        storage.removeItem(key);
      }
    } catch (error) {
      console.warn("Failed to persist active step", error);
    }
  }

  dispatchEvent<LessonDraftActiveStepDetail>(ACTIVE_STEP_EVENT, { draftId, stepId });
};

export const subscribeToLessonDraftContext = (
  handler: (detail: LessonDraftContextDetail) => void,
) => {
  const target = getLessonDraftWindow();
  if (!target) {
    return () => undefined;
  }

  const listener = (event: Event) => {
    handler((event as CustomEvent<LessonDraftContextDetail>).detail);
  };

  target.addEventListener(CONTEXT_EVENT, listener as EventListener);
  return () => target.removeEventListener(CONTEXT_EVENT, listener as EventListener);
};

export const subscribeToActiveStepChanges = (
  handler: (detail: LessonDraftActiveStepDetail) => void,
) => {
  const target = getLessonDraftWindow();
  if (!target) {
    return () => undefined;
  }

  const listener = (event: Event) => {
    handler((event as CustomEvent<LessonDraftActiveStepDetail>).detail);
  };

  target.addEventListener(ACTIVE_STEP_EVENT, listener as EventListener);
  return () => target.removeEventListener(ACTIVE_STEP_EVENT, listener as EventListener);
};

export const subscribeToResourceAttachments = (
  handler: (detail: LessonDraftAttachResourceDetail) => void,
) => {
  const target = getLessonDraftWindow();
  if (!target) {
    return () => undefined;
  }

  const listener = (event: Event) => {
    handler((event as CustomEvent<LessonDraftAttachResourceDetail>).detail);
  };

  target.addEventListener(ATTACH_RESOURCE_EVENT, listener as EventListener);
  return () => target.removeEventListener(ATTACH_RESOURCE_EVENT, listener as EventListener);
};

export const emitAttachResource = (detail: LessonDraftAttachResourceDetail) => {
  dispatchEvent(ATTACH_RESOURCE_EVENT, detail);
};

export const attachResourceToActiveStep = (resourceId: string): boolean => {
  const draftId = getActiveLessonDraftId();
  if (!draftId) {
    return false;
  }

  const stepId = getStoredActiveStepId(draftId);
  if (!stepId) {
    return false;
  }

  emitAttachResource({ draftId, stepId, resourceId });
  return true;
};

export const clearLessonDraftContext = (draftId: LessonDraft["id"]) => {
  const target = getLessonDraftWindow();
  if (!target) {
    return;
  }

  if (target.__activeLessonDraft === draftId) {
    delete target.__activeLessonDraft;
  }

  dispatchEvent<LessonDraftContextDetail>(CONTEXT_EVENT, { draftId: null });
};

export type {
  LessonDraftContextDetail,
  LessonDraftActiveStepDetail,
  LessonDraftAttachResourceDetail,
};
