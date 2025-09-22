import { beforeEach, describe, expect, it, vi } from "vitest";

type LessonDraftModule = typeof import("@/stores/lessonDraft");

let lessonDraftModule: LessonDraftModule;

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.clearAllTimers();
  window.localStorage.clear();
  vi.resetModules();
  lessonDraftModule = await import("@/stores/lessonDraft");
  lessonDraftModule.useLessonDraftStore.setState({
    draft: lessonDraftModule.createEmptyLessonDraft(),
  });
});

const getStore = () => lessonDraftModule.useLessonDraftStore;

describe("lessonDraft store", () => {
  it("updates top-level fields with setField", () => {
    const store = getStore();
    store.getState().setField("title", "My lesson");

    expect(store.getState().draft.title).toBe("My lesson");
  });

  it("adds a new step with a default title", () => {
    const store = getStore();

    const step = store.getState().addStep();

    expect(step.title).toBe("New step");
    expect(step.resourceIds).toEqual([]);
    expect(store.getState().draft.steps).toHaveLength(1);
    expect(store.getState().draft.steps[0].id).toBe(step.id);
  });

  it("renames an existing step", () => {
    const store = getStore();
    const { id } = store.getState().addStep();

    store.getState().renameStep(id, "Updated title");

    expect(store.getState().draft.steps[0].title).toBe("Updated title");
  });

  it("removes a step by id", () => {
    const store = getStore();
    const first = store.getState().addStep();
    store.getState().addStep();

    store.getState().removeStep(first.id);

    expect(store.getState().draft.steps).toHaveLength(1);
    expect(store.getState().draft.steps[0].id).not.toBe(first.id);
  });

  it("attaches resources without duplicating them", () => {
    const store = getStore();
    const { id } = store.getState().addStep();

    store.getState().attachResource(id, "resource-1");
    store.getState().attachResource(id, "resource-1");
    store.getState().attachResource(id, "resource-2");

    expect(store.getState().draft.steps[0].resourceIds).toEqual([
      "resource-1",
      "resource-2",
    ]);
  });

  it("detaches resources from steps", () => {
    const store = getStore();
    const { id } = store.getState().addStep();
    store.getState().attachResource(id, "resource-1");
    store.getState().attachResource(id, "resource-2");

    store.getState().detachResource(id, "resource-1");

    expect(store.getState().draft.steps[0].resourceIds).toEqual(["resource-2"]);
  });

  it("resets the draft to its empty state", () => {
    const store = getStore();
    store.getState().setField("title", "Filled");
    store.getState().addStep();

    store.getState().resetDraft();

    expect(store.getState().draft).toEqual(lessonDraftModule.createEmptyLessonDraft());
  });

  it("persists changes to localStorage", () => {
    vi.useFakeTimers();
    const store = getStore();

    store.getState().setField("title", "Persisted title");

    vi.runAllTimers();

    const storedValue = window.localStorage.getItem(
      lessonDraftModule.LESSON_DRAFT_STORAGE_KEY,
    );

    expect(storedValue).toBeTruthy();
    expect(storedValue && JSON.parse(storedValue).title).toBe("Persisted title");

    vi.useRealTimers();
  });

  it("hydrates the draft from stored data", async () => {
    const storedDraft = {
      title: "Hydrated lesson",
      steps: [
        {
          id: "step-1",
          title: "Existing step",
          resourceIds: ["res-1"],
        },
      ],
    };

    window.localStorage.setItem(
      lessonDraftModule.LESSON_DRAFT_STORAGE_KEY,
      JSON.stringify(storedDraft),
    );

    vi.resetModules();
    lessonDraftModule = await import("@/stores/lessonDraft");

    const state = lessonDraftModule.useLessonDraftStore.getState().draft;

    expect(state.title).toBe("Hydrated lesson");
    expect(state.steps).toHaveLength(1);
    expect(state.steps[0].id).toBe("step-1");
    expect(state.steps[0].resourceIds).toEqual(["res-1"]);
  });
});
