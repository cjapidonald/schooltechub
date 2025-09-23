import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { user, loading } = useRequireAuth();
  const { language } = useLanguage();

  if (loading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={getLocalizedPath("/auth", language)} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
