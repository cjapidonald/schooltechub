import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type AdminGuardState = "checking" | "allowed" | "forbidden" | "error";

const PROTOTYPE_SESSION_KEY = "adminPrototypeSession";

export function hasPrototypeAdminSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(PROTOTYPE_SESSION_KEY) === "granted";
}

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
      if (hasPrototypeAdminSession()) {
        setState("allowed");
        return;
      }

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

export function grantPrototypeAdminSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROTOTYPE_SESSION_KEY, "granted");
}

export function clearPrototypeAdminSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PROTOTYPE_SESSION_KEY);
}
