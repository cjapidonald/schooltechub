import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { listMyClasses } from "@/lib/classes";

export interface MyClassSummary {
  id: string;
  title: string;
}

export function useMyClasses() {
  const [classes, setClasses] = useState<MyClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadClasses = async () => {
      if (!isMounted) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const records = await listMyClasses();
        if (!isMounted) {
          return;
        }

        const summaries = records.map(classItem => ({
          id: classItem.id,
          title: classItem.title,
        }));

        setClasses(summaries);
      } catch (cause) {
        if (isMounted) {
          const message = cause instanceof Error ? cause.message : "Failed to load classes.";
          setError(new Error(message, { cause }));
          setClasses([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadClasses();

    const authClient = supabase.auth;
    let authSubscription: { unsubscribe: () => void } | null = null;

    if (authClient && typeof authClient.onAuthStateChange === "function") {
      const { data } = authClient.onAuthStateChange(() => {
        void loadClasses();
      });
      authSubscription = data?.subscription ?? null;
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  return { classes, isLoading, error };
}
