import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface MyProfileData {
  fullName: string | null;
  schoolName: string | null;
  schoolLogoUrl: string | null;
}

const INITIAL_PROFILE: MyProfileData = {
  fullName: null,
  schoolName: null,
  schoolLogoUrl: null,
};

type ProfileRow = {
  full_name: string | null;
  school_name: string | null;
  school_logo_url: string | null;
};

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractMetadataValue(metadata: Record<string, unknown>, key: string): string | null {
  return normalizeString(metadata[key]);
}

export function useMyProfile() {
  const [profile, setProfile] = useState<MyProfileData>(INITIAL_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadProfile = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }

      if (!isMountedRef.current) {
        return;
      }

      const user = userData?.user ?? null;
      if (!user) {
        if (isMountedRef.current) {
          setProfile({ ...INITIAL_PROFILE });
        }
        return;
      }

      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      let fullName = extractMetadataValue(metadata, "full_name");
      let schoolName = extractMetadataValue(metadata, "school_name");
      let schoolLogoUrl = extractMetadataValue(metadata, "school_logo_url");

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, school_name, school_logo_url")
        .eq("id", user.id)
        .maybeSingle() as { data: ProfileRow | null; error: any };

      if (profileError) {
        throw profileError;
      }

      if (!isMountedRef.current) {
        return;
      }

      if (profileRow) {
        const profileFullName = normalizeString(profileRow.full_name);
        const profileSchoolName = normalizeString(profileRow.school_name);
        const profileSchoolLogoUrl = normalizeString(profileRow.school_logo_url);

        fullName = profileFullName ?? fullName;
        schoolName = profileSchoolName ?? schoolName;
        schoolLogoUrl = profileSchoolLogoUrl ?? schoolLogoUrl;
      }

      if (isMountedRef.current) {
        setProfile({
          fullName: fullName ?? null,
          schoolName: schoolName ?? null,
          schoolLogoUrl: schoolLogoUrl ?? null,
        });
      }
    } catch (cause) {
      if (!isMountedRef.current) {
        return;
      }

      const message = cause instanceof Error ? cause.message : "Failed to load profile.";
      setError(new Error(message));
      setProfile({ ...INITIAL_PROFILE });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => {
      isMountedRef.current = false;
      authListener?.subscription.unsubscribe();
    };
  }, [loadProfile]);

  return {
    fullName: profile.fullName,
    schoolName: profile.schoolName,
    schoolLogoUrl: profile.schoolLogoUrl,
    isLoading,
    error,
    refresh: loadProfile,
  };
}
