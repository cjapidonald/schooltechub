import type { PlanSnapshot } from "@/types/plan-builder";

const memoryStore = new Map<string, string>();

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { localStorage } = window;
    const key = "__plan_storage_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return localStorage;
  } catch (error) {
    console.warn("plan-storage: falling back to in-memory store", error);
    return null;
  }
}

function getMemoryStore(): Map<string, string> {
  return memoryStore;
}

function getSerialized(planId: string): string | null {
  const storage = getBrowserStorage();
  const key = `plan:${planId}`;

  if (storage) {
    return storage.getItem(key);
  }

  return getMemoryStore().get(key) ?? null;
}

function setSerialized(planId: string, value: string): void {
  const storage = getBrowserStorage();
  const key = `plan:${planId}`;

  if (storage) {
    storage.setItem(key, value);
  } else {
    getMemoryStore().set(key, value);
  }
}

export async function savePlanSnapshot(planId: string, snapshot: PlanSnapshot): Promise<PlanSnapshot> {
  const serialized = JSON.stringify(snapshot);
  setSerialized(planId, serialized);
  return snapshot;
}

export async function loadPlanSnapshot(planId: string): Promise<PlanSnapshot | null> {
  const serialized = getSerialized(planId);
  if (!serialized) {
    return null;
  }

  try {
    return JSON.parse(serialized) as PlanSnapshot;
  } catch (error) {
    console.error("plan-storage: failed to parse snapshot", error);
    return null;
  }
}
