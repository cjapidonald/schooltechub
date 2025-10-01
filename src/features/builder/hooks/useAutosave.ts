import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BuilderState } from "../types";
import { getAnonUserId } from "../utils/anonUser";
import { syncResourceLinks } from "../api/linkHealth";

interface UseAutosaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  onSaved?: () => void;
  onSaving?: () => void;
}

const DEFAULT_DELAY = 800;

export const useAutosave = (state: BuilderState, options: UseAutosaveOptions = {}) => {
  const { debounceMs, enabled: enabledOption, onSaved, onSaving } = options;
  const delay = debounceMs ?? DEFAULT_DELAY;
  const enabled = enabledOption ?? true;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      onSaving?.();
      const anonUserId = getAnonUserId();
      const payload = {
        title: state.title,
        objective: state.objective,
        stage: state.stage,
        subject: state.subject,
        schoolLogoUrl: state.schoolLogoUrl,
        lessonDate: state.lessonDate,
        steps: state.steps,
      };

      const { error } = await supabase.from("builder_lesson_plans").upsert(
        [{
          id: state.id,
          anon_user_id: anonUserId,
          title: state.title || "Untitled Lesson",
          data: payload as any,
          updated_at: new Date().toISOString(),
        }],
        { onConflict: "anon_user_id" },
      );

      if (!error) {
        await syncResourceLinks(state.id, state.steps);
        onSaved?.();
      } else {
        console.error("Failed to autosave builder draft", error);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [state, delay, enabled, onSaved, onSaving]);
};
