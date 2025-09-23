import { supabase } from "@/integrations/supabase/client";

const HTTP_URL_REGEX = /^https?:\/\//i;

const AVATAR_STORAGE_KEYS = [
  "avatar_storage_path",
  "avatarStoragePath",
  "avatar_path",
  "avatarPath",
];

const AVATAR_URL_KEYS = ["avatar_url", "avatarUrl", "avatar", "picture"];

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export const PROFILE_IMAGE_BUCKET = "profile-images";

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const isHttpUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && HTTP_URL_REGEX.test(value);

export type AvatarMetadata = {
  storagePath: string | null;
  directUrl: string | null;
};

export const extractAvatarMetadata = (
  metadata: Record<string, unknown> | null | undefined,
): AvatarMetadata => {
  const result: AvatarMetadata = {
    storagePath: null,
    directUrl: null,
  };

  if (!metadata) {
    return result;
  }

  for (const key of AVATAR_STORAGE_KEYS) {
    const candidate = normalizeString(metadata[key]);
    if (candidate) {
      result.storagePath = candidate;
      break;
    }
  }

  for (const key of AVATAR_URL_KEYS) {
    const candidate = normalizeString(metadata[key]);
    if (!candidate) {
      continue;
    }

    if (isHttpUrl(candidate)) {
      if (!result.directUrl) {
        result.directUrl = candidate;
      }
    } else if (!result.storagePath) {
      result.storagePath = candidate;
    }

    if (result.storagePath && result.directUrl) {
      break;
    }
  }

  return result;
};

export const resolveAvatarReference = (
  metadata: Record<string, unknown> | null | undefined,
): { reference: string | null; url: string | null } => {
  const { storagePath, directUrl } = extractAvatarMetadata(metadata);
  const reference = storagePath ?? directUrl ?? null;
  const url = directUrl ?? (reference && isHttpUrl(reference) ? reference : null);

  return { reference, url };
};

export const createProfileImageSignedUrl = async (
  path: string,
  expiresIn = SIGNED_URL_TTL_SECONDS,
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  if (!data?.signedUrl) {
    throw new Error("Failed to create a signed avatar URL");
  }

  return data.signedUrl;
};

export const SIGNED_URL_TTL = SIGNED_URL_TTL_SECONDS;
