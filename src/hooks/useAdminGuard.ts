import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type AdminGuardState = "checking" | "allowed" | "forbidden" | "error";

async function fetchAdminStatus(): Promise<Response> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.access_token) {
    throw new Error("Missing access token");
  }

  return fetch("/api/admin/guard", {
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });
}

export function useAdminGuard(pathname: string): AdminGuardState {
  const [state, setState] = useState<AdminGuardState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      setState("checking");

      try {
        const response = await fetchAdminStatus();
        if (cancelled) {
          return;
        }

        if (response.ok) {
          setState("allowed");
        } else if (response.status === 401 || response.status === 403) {
          setState("forbidden");
        } else {
          setState("error");
        }
      } catch (error) {
        if (!cancelled) {
          setState(error instanceof Error && error.message === "Missing access token" ? "forbidden" : "error");
        }
      }
    }

    void verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return state;
}
