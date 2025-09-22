import { ReactNode, useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminGuardProps {
  children: ReactNode;
}

type GuardState = "loading" | "authorized" | "unauthorized" | "error";

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const location = useLocation();
  const [state, setState] = useState<GuardState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function verifyAccess() {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        if (mounted) {
          setState("unauthorized");
        }
        return;
      }

      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          credentials: "include",
          signal: controller.signal,
        });

        if (!mounted) return;

        if (response.ok) {
          setState("authorized");
          return;
        }

        if (response.status === 401 || response.status === 403) {
          setState("unauthorized");
          return;
        }

        setState("error");
        setErrorMessage("We couldn't confirm your admin access. Please try again.");
      } catch (error) {
        if (!mounted) return;
        if ((error as Error).name === "AbortError") {
          return;
        }
        setState("error");
        setErrorMessage("We couldn't reach the server to verify admin access.");
      }
    }

    verifyAccess();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <div className="space-y-3 text-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid w-full max-w-sm gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (state === "unauthorized") {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to confirm access</CardTitle>
            <CardDescription>
              {errorMessage ?? "Something went wrong while verifying your administrator permissions."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button asChild>
              <Link to="/">Return home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
