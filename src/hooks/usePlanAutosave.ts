import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { loadPlanSnapshot, savePlanSnapshot } from "@/lib/plan-storage";
import type { PlanSnapshot } from "@/types/plan-builder";

interface UsePlanAutosaveOptions {
  debounceMs?: number;
  onHydrated?: (snapshot: PlanSnapshot) => void;
  onSaved?: (snapshot: PlanSnapshot) => void;
}

interface DebouncedFunction<T> {
  (value: T): void;
  cancel: () => void;
}

function useDebouncedCallback<T>(callback: (value: T) => void, delay: number): DebouncedFunction<T> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        callback(value);
      }, delay);
    },
    [callback, delay],
  ) as DebouncedFunction<T>;

  debounced.cancel = cancel;
  return debounced;
}

export interface PlanAutosaveResult {
  isSaving: boolean;
  lastSavedAt: string | null;
  serverSnapshot: PlanSnapshot | null;
  hydrate: () => Promise<void>;
  touch: (snapshot: PlanSnapshot) => void;
  setServerSnapshot: (snapshot: PlanSnapshot | null) => void;
}

export function usePlanAutosave(
  planId: string,
  snapshot: PlanSnapshot,
  options?: UsePlanAutosaveOptions,
): PlanAutosaveResult {
  const debounceMs = options?.debounceMs ?? 800;
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [serverSnapshot, setServerSnapshotState] = useState<PlanSnapshot | null>(null);
  const [serverSerialized, setServerSerialized] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: PlanSnapshot) => savePlanSnapshot(planId, payload),
    onSuccess: (result) => {
      const serialized = JSON.stringify(result);
      setServerSerialized(serialized);
      setServerSnapshotState(result);
      setLastSavedAt(new Date().toISOString());
      options?.onSaved?.(result);
    },
  });

  const scheduleSave = useDebouncedCallback((value: PlanSnapshot) => {
    mutation.mutate(value);
  }, debounceMs);

  useEffect(() => () => scheduleSave.cancel(), [scheduleSave]);

  const serialized = useMemo(() => JSON.stringify(snapshot), [snapshot]);

  const touch = useCallback(
    (value: PlanSnapshot) => {
      const nextSerialized = JSON.stringify(value);
      if (serverSerialized && nextSerialized === serverSerialized) {
        return;
      }
      scheduleSave(value);
    },
    [scheduleSave, serverSerialized],
  );

  useEffect(() => {
    if (serverSerialized && serialized === serverSerialized) {
      return;
    }
    scheduleSave(snapshot);
  }, [serialized, snapshot, scheduleSave, serverSerialized]);

  const hydrate = useCallback(async () => {
    const stored = await loadPlanSnapshot(planId);
    if (stored) {
      setServerSnapshotState(stored);
      const serializedStored = JSON.stringify(stored);
      setServerSerialized(serializedStored);
      options?.onHydrated?.(stored);
    }
  }, [planId, options]);

  const setServerSnapshot = useCallback((value: PlanSnapshot | null) => {
    setServerSnapshotState(value);
    setServerSerialized(value ? JSON.stringify(value) : null);
  }, []);

  return {
    isSaving: mutation.isPending || mutation.isLoading,
    lastSavedAt,
    serverSnapshot,
    hydrate,
    touch,
    setServerSnapshot,
  };
}
