import { errorResponse, jsonResponse, methodNotAllowed, normalizeMethod } from "../_lib/http";
import { getSupabaseClient } from "../_lib/supabase";

type ResourceType = "worksheet" | "video" | "picture" | "ppt" | "online" | "offline";

type InsertedResource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  storage_path: string | null;
  type: ResourceType;
  subject: string | null;
  stage: string | null;
  tags: string[];
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  status: string;
  is_active: boolean;
};

const VALID_TYPES: ResourceType[] = ["worksheet", "video", "picture", "ppt", "online", "offline"];

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);

  if (method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(401, "Authentication required");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "Invalid form data");
  }

  const supabase = getSupabaseClient();
  const { data: userResult, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !userResult?.user?.id) {
    return errorResponse(401, "Authentication required");
  }

  const userId = userResult.user.id;

  const title = getRequiredField(formData, "title");
  if (!title) {
    return errorResponse(422, "A title is required");
  }

  const typeInput = getRequiredField(formData, "type");
  if (!typeInput) {
    return errorResponse(422, "A resource type is required");
  }

  const normalizedType = typeInput.toLowerCase() as ResourceType;
  if (!VALID_TYPES.includes(normalizedType)) {
    return errorResponse(422, "Invalid resource type");
  }

  const description = getOptionalField(formData, "description");
  const subject = getOptionalField(formData, "subject");
  const stage = getOptionalField(formData, "stage");
  const thumbnailUrl = getOptionalField(formData, "thumbnail");

  const urlValue = getOptionalUrl(formData, "url");
  if (urlValue === false) {
    return errorResponse(422, "Invalid resource URL");
  }

  const tags = parseTags(formData);

  const fileEntry = formData.get("file");
  let storagePath: string | null = null;

  if (fileEntry instanceof File && fileEntry.size > 0) {
    const extension = resolveFileExtension(fileEntry);
    const fileName = `${crypto.randomUUID()}.${extension}`;
    storagePath = `resources/uploads/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("resources").upload(storagePath, fileEntry, {
      cacheControl: "3600",
      upsert: false,
      contentType: fileEntry.type || "application/octet-stream",
    });

    if (uploadError) {
      return errorResponse(500, "Failed to store uploaded file");
    }
  } else if (fileEntry instanceof File && fileEntry.size === 0) {
    return errorResponse(422, "Uploaded file is empty");
  }

  if (!storagePath && !urlValue) {
    return errorResponse(422, "Either a file or an external URL is required");
  }

  const insertPayload = {
    title,
    description,
    url: urlValue ?? null,
    storage_path: storagePath,
    type: normalizedType,
    subject,
    stage,
    tags,
    thumbnail_url: thumbnailUrl,
    created_by: userId,
    status: "pending" as const,
  } satisfies Partial<InsertedResource> & { title: string; type: ResourceType; created_by: string; status: "pending" };

  const { data, error } = await supabase
    .from("resources")
    .insert(insertPayload)
    .select(
      "id,title,description,url,storage_path,type,subject,stage,tags,thumbnail_url,created_by,status,is_active,created_at",
    )
    .single<InsertedResource>();

  if (error || !data) {
    return errorResponse(500, "Failed to create resource");
  }

  return jsonResponse({ resource: data }, 201);
}

function getRequiredField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOptionalField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOptionalUrl(formData: FormData, name: string): string | null | false {
  const value = getOptionalField(formData, name);
  if (!value) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return parsed.toString();
  } catch {
    return false;
  }
}

function parseTags(formData: FormData): string[] {
  const rawValues = [...formData.getAll("tags[]"), ...formData.getAll("tags")];
  const collected: string[] = [];

  for (const value of rawValues) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            if (typeof entry === "string" && entry.trim()) {
              collected.push(entry.trim());
            }
          }
          continue;
        }
      } catch {
        // fall through to simple handling
      }
    }

    if (trimmed.includes(",")) {
      for (const part of trimmed.split(",")) {
        const tag = part.trim();
        if (tag) {
          collected.push(tag);
        }
      }
      continue;
    }

    collected.push(trimmed);
  }

  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of collected) {
    const normalised = tag.trim();
    if (!normalised || seen.has(normalised.toLowerCase())) {
      continue;
    }
    seen.add(normalised.toLowerCase());
    result.push(normalised);
  }

  return result;
}

function resolveFileExtension(file: File): string {
  const nameParts = (file.name ?? "").split(".");
  if (nameParts.length > 1) {
    const candidate = nameParts.pop();
    if (candidate && /^[a-zA-Z0-9]{1,8}$/.test(candidate)) {
      return candidate.toLowerCase();
    }
  }

  if (file.type && file.type.includes("/")) {
    const subtype = file.type.split("/").pop();
    if (subtype && /^[a-zA-Z0-9.+-]{1,16}$/.test(subtype)) {
      return subtype.toLowerCase().replace(/[^a-z0-9]+/g, "");
    }
  }

  return "bin";
}

function extractAccessToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (header) {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const cookieHeader = request.headers.get("cookie") ?? request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";");
    for (const rawCookie of cookies) {
      const [name, ...rest] = rawCookie.trim().split("=");
      if (name === "sb-access-token") {
        return decodeURIComponent(rest.join("="));
      }
    }
  }

  return null;
}
