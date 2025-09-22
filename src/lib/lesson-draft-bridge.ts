import type { LessonDraft } from "@/stores/lessonDraft";

const ACTIVE_STEP_STORAGE_PREFIX = "lesson-draft:active-step:";
const ACTIVE_DRAFT_FLAG_STORAGE_KEY = "lesson-draft:active";
const ACTIVE_DRAFT_ID_STORAGE_KEY = "lesson-draft:active-id";
const GLOBAL_ACTIVE_STEP_STORAGE_KEY = "lesson-draft:active-step-id";
const LEGACY_ACTIVE_STEP_STORAGE_KEY = "activeStepId";
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

type LessonDraftBroadcastMessage =
  | {
      name: typeof CONTEXT_EVENT;
      detail: LessonDraftContextDetail;
    }
  | {
      name: typeof ACTIVE_STEP_EVENT;
      detail: LessonDraftActiveStepDetail;
    }
  | {
      name: typeof ATTACH_RESOURCE_EVENT;
      detail: LessonDraftAttachResourceDetail;
    };

const isBrowser = () => typeof window !== "undefined";

let lessonDraftBroadcast: BroadcastChannel | null | undefined;

const getLessonDraftWindow = (): LessonDraftWindow | null => {
  if (!isBrowser()) {
    return null;
  }
  return window as LessonDraftWindow;
};

const getBroadcastChannel = (): BroadcastChannel | null => {
  if (!isBrowser()) {
    return null;
  }

  if (lessonDraftBroadcast !== undefined) {
    return lessonDraftBroadcast;
  }

  if (typeof BroadcastChannel === "undefined") {
    lessonDraftBroadcast = null;
    return lessonDraftBroadcast;
  }

  try {
    lessonDraftBroadcast = new BroadcastChannel("lesson-draft");
  } catch {
    lessonDraftBroadcast = null;
  }

  return lessonDraftBroadcast;
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

const setStoredActiveDraftId = (draftId: LessonDraft["id"] | null) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    if (draftId) {
      storage.setItem(ACTIVE_DRAFT_FLAG_STORAGE_KEY, "true");
      storage.setItem(ACTIVE_DRAFT_ID_STORAGE_KEY, draftId);
    } else {
      storage.removeItem(ACTIVE_DRAFT_FLAG_STORAGE_KEY);
      storage.removeItem(ACTIVE_DRAFT_ID_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
};

const getStoredActiveDraftId = (): LessonDraft["id"] | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const value = storage.getItem(ACTIVE_DRAFT_ID_STORAGE_KEY);
    return typeof value === "string" && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
};

const setGlobalActiveStepId = (stepId: string | null) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    if (stepId && stepId.trim().length > 0) {
      storage.setItem(GLOBAL_ACTIVE_STEP_STORAGE_KEY, stepId);
      storage.setItem(LEGACY_ACTIVE_STEP_STORAGE_KEY, stepId);
    } else {
      storage.removeItem(GLOBAL_ACTIVE_STEP_STORAGE_KEY);
      storage.removeItem(LEGACY_ACTIVE_STEP_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
};

const getGlobalActiveStepId = (): string | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const value =
      storage.getItem(GLOBAL_ACTIVE_STEP_STORAGE_KEY) ?? storage.getItem(LEGACY_ACTIVE_STEP_STORAGE_KEY);
    return typeof value === "string" && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
};

const dispatchEvent = <TDetail,>(name: string, detail: TDetail) => {
  const target = getLessonDraftWindow();
  if (target) {
    target.dispatchEvent(new CustomEvent<TDetail>(name, { detail }));
  }

  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ name, detail } as LessonDraftBroadcastMessage);
    } catch {
      // Ignore broadcast errors
    }
  }
};

export const getActiveLessonDraftId = (): LessonDraft["id"] | null => {
  const target = getLessonDraftWindow();
  if (target) {
    const id = target.__activeLessonDraft;
    if (typeof id === "string" && id.trim().length > 0) {
      return id;
    }
  }

  return getStoredActiveDraftId();
};

export const hasActiveLessonDraft = (): boolean => {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(ACTIVE_DRAFT_FLAG_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const setActiveLessonDraftId = (draftId: LessonDraft["id"] | null) => {
  const target = getLessonDraftWindow();
  if (target) {
    if (draftId) {
      target.__activeLessonDraft = draftId;
    } else {
      delete target.__activeLessonDraft;
    }
  }

  setStoredActiveDraftId(draftId);
  if (!draftId) {
    setGlobalActiveStepId(null);
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

  if (getStoredActiveDraftId() === draftId) {
    setGlobalActiveStepId(stepId);
  }

  dispatchEvent<LessonDraftActiveStepDetail>(ACTIVE_STEP_EVENT, { draftId, stepId });
};

const subscribeToBroadcast = <TDetail,>(
  name: LessonDraftBroadcastMessage["name"],
  handler: (detail: TDetail) => void,
) => {
  const channel = getBroadcastChannel();
  if (!channel) {
    return () => undefined;
  }

  const listener = (event: MessageEvent<LessonDraftBroadcastMessage>) => {
    if (event.data?.name === name) {
      handler(event.data.detail as TDetail);
    }
  };

  channel.addEventListener("message", listener as EventListener);
  return () => channel.removeEventListener("message", listener as EventListener);
};

export const subscribeToLessonDraftContext = (
  handler: (detail: LessonDraftContextDetail) => void,
) => {
  const target = getLessonDraftWindow();
  const listener = (event: Event) => {
    handler((event as CustomEvent<LessonDraftContextDetail>).detail);
  };

  target?.addEventListener(CONTEXT_EVENT, listener as EventListener);
  const unsubscribeBroadcast = subscribeToBroadcast(CONTEXT_EVENT, handler);

  return () => {
    target?.removeEventListener(CONTEXT_EVENT, listener as EventListener);
    unsubscribeBroadcast();
  };
};

export const subscribeToActiveStepChanges = (
  handler: (detail: LessonDraftActiveStepDetail) => void,
) => {
  const target = getLessonDraftWindow();
  const listener = (event: Event) => {
    handler((event as CustomEvent<LessonDraftActiveStepDetail>).detail);
  };

  target?.addEventListener(ACTIVE_STEP_EVENT, listener as EventListener);
  const unsubscribeBroadcast = subscribeToBroadcast(ACTIVE_STEP_EVENT, handler);

  return () => {
    target?.removeEventListener(ACTIVE_STEP_EVENT, listener as EventListener);
    unsubscribeBroadcast();
  };
};

export const subscribeToResourceAttachments = (
  handler: (detail: LessonDraftAttachResourceDetail) => void,
) => {
  const target = getLessonDraftWindow();
  const listener = (event: Event) => {
    handler((event as CustomEvent<LessonDraftAttachResourceDetail>).detail);
  };

  target?.addEventListener(ATTACH_RESOURCE_EVENT, listener as EventListener);
  const unsubscribeBroadcast = subscribeToBroadcast(ATTACH_RESOURCE_EVENT, handler);

  return () => {
    target?.removeEventListener(ATTACH_RESOURCE_EVENT, listener as EventListener);
    unsubscribeBroadcast();
  };
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
  if (target && target.__activeLessonDraft === draftId) {
    delete target.__activeLessonDraft;
  }

  if (getStoredActiveDraftId() === draftId) {
    setStoredActiveDraftId(null);
    setGlobalActiveStepId(null);
    const storage = getStorage();
    try {
      storage?.removeItem(LEGACY_ACTIVE_STEP_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  dispatchEvent<LessonDraftContextDetail>(CONTEXT_EVENT, { draftId: null });
};

export type {
  LessonDraftContextDetail,
  LessonDraftActiveStepDetail,
  LessonDraftAttachResourceDetail,
};

export {
  ACTIVE_DRAFT_FLAG_STORAGE_KEY,
  ACTIVE_DRAFT_ID_STORAGE_KEY,
  ACTIVE_STEP_STORAGE_PREFIX,
  GLOBAL_ACTIVE_STEP_STORAGE_KEY,
  getStoredActiveDraftId,
  getGlobalActiveStepId,
};
