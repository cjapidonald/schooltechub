import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the current Supabase user without enforcing authentication redirects.
 * Useful for views that can render in a read-only mode for visitors.
 */
export function useOptionalUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          console.error("Failed to load auth session", error);
          setUser(null);
        } else {
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        if (active) {
          console.error("Unexpected auth lookup error", error);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
