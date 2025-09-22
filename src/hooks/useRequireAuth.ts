import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

export function useRequireAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      if (!user) {
        navigate(getLocalizedPath("/auth", language));
      } else {
        setUser(user);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [navigate, language]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate(getLocalizedPath("/auth", language));
      } else {
        setUser(session.user);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [navigate, language]);

  return { user, loading };
}
