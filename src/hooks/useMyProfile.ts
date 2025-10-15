import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Salutation } from "../../types/supabase-tables";

interface MyProfileData {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  honorific: Salutation | null;
  schoolName: string | null;
  schoolLogoUrl: string | null;
  avatarUrl: string | null;
}

const INITIAL_PROFILE: MyProfileData = {
  fullName: null,
  firstName: null,
  lastName: null,
  displayName: null,
  honorific: null,
  schoolName: null,
  schoolLogoUrl: null,
  avatarUrl: null,
};

type ProfileRow = {
  full_name: string | null;
  school_name: string | null;
  school_logo_url: string | null;
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeHonorific(value: unknown): Salutation | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === "Mr" || trimmed === "Ms" || trimmed === "Mx") {
    return trimmed;
  }

  return null;
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
      let honorific = normalizeHonorific(metadata.salutation);
      let firstName = extractMetadataValue(metadata, "first_name");
      let lastName = extractMetadataValue(metadata, "last_name");
      let displayName = extractMetadataValue(metadata, "display_name");
      let avatarUrl = extractMetadataValue(metadata, "avatar_url");

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select(
          "full_name, school_name, school_logo_url, salutation, first_name, last_name, display_name, avatar_url",
        )
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
        const profileHonorific = normalizeHonorific(profileRow.salutation);
        const profileFirstName = normalizeString(profileRow.first_name);
        const profileLastName = normalizeString(profileRow.last_name);
        const profileDisplayName = normalizeString(profileRow.display_name);
        const profileAvatarUrl = normalizeString(profileRow.avatar_url);

        fullName = profileFullName ?? fullName;
        schoolName = profileSchoolName ?? schoolName;
        schoolLogoUrl = profileSchoolLogoUrl ?? schoolLogoUrl;
        honorific = profileHonorific ?? honorific;
        firstName = profileFirstName ?? firstName;
        lastName = profileLastName ?? lastName;
        displayName = profileDisplayName ?? displayName;
        avatarUrl = profileAvatarUrl ?? avatarUrl;
      }

      if (isMountedRef.current) {
        setProfile({
          fullName: fullName ?? null,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          displayName: displayName ?? null,
          honorific: honorific ?? null,
          schoolName: schoolName ?? null,
          schoolLogoUrl: schoolLogoUrl ?? null,
          avatarUrl: avatarUrl ?? null,
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
    firstName: profile.firstName,
    lastName: profile.lastName,
    displayName: profile.displayName,
    honorific: profile.honorific,
    schoolName: profile.schoolName,
    schoolLogoUrl: profile.schoolLogoUrl,
    avatarUrl: profile.avatarUrl,
    isLoading,
    error,
    refresh: loadProfile,
  };
}
