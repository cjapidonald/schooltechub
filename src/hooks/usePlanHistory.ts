import { useCallback, useReducer } from "react";

import type { PlanHistoryState, PlanSnapshot } from "@/types/plan-builder";

type HistoryAction =
  | { type: "APPLY"; payload: PlanSnapshot; pushToHistory: boolean }
  | { type: "UPDATE"; updater: (current: PlanSnapshot) => PlanSnapshot }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: PlanSnapshot }
  | { type: "MARK_SERVER" };

function cloneSnapshot(snapshot: PlanSnapshot): PlanSnapshot {
  return {
    ...snapshot,
    steps: snapshot.steps.map((step) => ({
      ...step,
      metadata: step.metadata ? { ...step.metadata } : undefined,
    })),
  };
}

function historyReducer(state: PlanHistoryState, action: HistoryAction): PlanHistoryState {
  switch (action.type) {
    case "APPLY": {
      if (action.pushToHistory) {
        return {
          past: [...state.past, state.present],
          present: cloneSnapshot(action.payload),
          future: [],
          serverRevision: state.serverRevision,
        };
      }

      return {
        ...state,
        present: cloneSnapshot(action.payload),
      };
    }
    case "UPDATE": {
      const next = cloneSnapshot(action.updater(cloneSnapshot(state.present)));
      if (JSON.stringify(next) === JSON.stringify(state.present)) {
        return state;
      }

      return {
        past: [...state.past, state.present],
        present: next,
        future: [],
        serverRevision: state.serverRevision,
      };
    }
    case "UNDO": {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      const past = state.past.slice(0, -1);
      return {
        past,
        present: previous,
        future: [state.present, ...state.future],
        serverRevision: state.serverRevision,
      };
    }
    case "REDO": {
      if (state.future.length === 0) {
        return state;
      }

      const [next, ...future] = state.future;
      return {
        past: [...state.past, state.present],
        present: next,
        future,
        serverRevision: state.serverRevision,
      };
    }
    case "RESET": {
      return {
        past: [],
        present: cloneSnapshot(action.payload),
        future: [],
        serverRevision: 0,
      };
    }
    case "MARK_SERVER": {
      return {
        ...state,
        serverRevision: state.serverRevision + 1,
      };
    }
    default:
      return state;
  }
}

export interface UsePlanHistoryResult {
  snapshot: PlanSnapshot;
  history: PlanHistoryState;
  update: (updater: (current: PlanSnapshot) => PlanSnapshot) => void;
  apply: (snapshot: PlanSnapshot, options?: { pushToHistory?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  reset: (snapshot: PlanSnapshot) => void;
  markServerSnapshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function usePlanHistory(initialSnapshot: PlanSnapshot): UsePlanHistoryResult {
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    present: cloneSnapshot(initialSnapshot),
    future: [],
    serverRevision: 0,
  });

  const update = useCallback(
    (updater: (current: PlanSnapshot) => PlanSnapshot) => {
      dispatch({ type: "UPDATE", updater });
    },
    [],
  );

  const apply = useCallback(
    (snapshot: PlanSnapshot, options?: { pushToHistory?: boolean }) => {
      dispatch({ type: "APPLY", payload: snapshot, pushToHistory: Boolean(options?.pushToHistory) });
    },
    [],
  );

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  const reset = useCallback((snapshot: PlanSnapshot) => dispatch({ type: "RESET", payload: snapshot }), []);
  const markServerSnapshot = useCallback(() => dispatch({ type: "MARK_SERVER" }), []);

  return {
    snapshot: state.present,
    history: state,
    update,
    apply,
    undo,
    redo,
    reset,
    markServerSnapshot,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
