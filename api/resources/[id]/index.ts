import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { getSupabaseClient } from "../../_lib/supabase";
import {
  buildFaviconUrl,
  extractDomain,
  mapRecordToCard,
  normalizeResourceUrl,
  sanitizeInputList,
} from "../../_lib/resource-helpers";
import { loadOpenGraphMetadata } from "../../_lib/open-graph";
import type { ResourceRecord, ResourceStatus, ResourceVisibility } from "../../_lib/resource-helpers";

interface ResourceUpdatePayload {
  userId?: string;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  resourceType?: string | null;
  subjects?: string[];
  topics?: string[];
  tags?: string[];
  status?: ResourceStatus;
  visibility?: ResourceVisibility;
  instructionalNotes?: string | null;
  thumbnailUrl?: string | null;
  refreshMetadata?: boolean;
}

const TABLE_NAME = "educator_resources";
const VALID_STATUS: ResourceStatus[] = ["draft", "published", "archived"];
const VALID_VISIBILITY: ResourceVisibility[] = ["private", "unlisted", "public"];

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  const id = extractIdFromRequest(request);

  if (!id) {
    return errorResponse(400, "A resource id is required");
  }

  if (method !== "PUT" && method !== "PATCH") {
    return methodNotAllowed(["PUT", "PATCH"]);
  }

  return handleUpdate(request, id);
}

async function handleUpdate(request: Request, id: string): Promise<Response> {
  const payload = (await parseJsonBody<ResourceUpdatePayload>(request)) ?? {};

  if (!payload.userId) {
    return errorResponse(400, "An authenticated userId is required");
  }

  const supabase = getSupabaseClient();
  const existingResult = await supabase
    .from<ResourceRecord>(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (existingResult.error) {
    return errorResponse(500, "Failed to load resource");
  }

  const existing = existingResult.data;
  if (!existing) {
    return errorResponse(404, "Resource not found");
  }

  if (existing.owner_id !== payload.userId) {
    return errorResponse(403, "You do not have permission to update this resource");
  }

  const updates: Partial<ResourceRecord> = {};
  let metadata: Awaited<ReturnType<typeof loadOpenGraphMetadata>> | null = null;
  let normalizedUrl: string | null = null;

  if (typeof payload.url === "string") {
    if (payload.url.trim().length === 0) {
      return errorResponse(422, "A resource URL cannot be empty");
    }
    normalizedUrl = normalizeResourceUrl(payload.url);
    if (!normalizedUrl) {
      return errorResponse(422, "The provided URL is invalid");
    }

    if (normalizedUrl !== existing.normalized_url) {
      const duplicateCheck = await supabase
        .from<ResourceRecord>(TABLE_NAME)
        .select("id, owner_id")
        .eq("normalized_url", normalizedUrl)
        .maybeSingle();

      if (duplicateCheck.error) {
        return errorResponse(500, "Failed to verify existing resources");
      }

      if (duplicateCheck.data && duplicateCheck.data.id !== existing.id) {
        const isOwner = duplicateCheck.data.owner_id === payload.userId;
        const message = isOwner
          ? "You have already submitted this resource"
          : "This resource already exists in the library";
        return errorResponse(409, message);
      }
    }
  }

  if (normalizedUrl && normalizedUrl !== existing.normalized_url) {
    updates.url = normalizedUrl;
    updates.normalized_url = normalizedUrl;
    updates.domain = extractDomain(normalizedUrl);
    metadata = await tryLoadMetadata(normalizedUrl);
    updates.favicon_url = buildFaviconUrl(normalizedUrl);
    if (metadata?.metadata.image) {
      updates.thumbnail_url = metadata.metadata.image;
    }
  } else if (payload.refreshMetadata) {
    metadata = await tryLoadMetadata(existing.normalized_url);
    if (metadata?.metadata.image) {
      updates.thumbnail_url = metadata.metadata.image;
    }
  }

  if (typeof payload.title === "string") {
    const trimmed = payload.title.trim();
    if (trimmed.length > 0) {
      updates.title = trimmed;
    }
  }

  if (payload.description !== undefined) {
    updates.description = sanitizeNullable(payload.description);
  }

  if (payload.resourceType !== undefined) {
    updates.resource_type = payload.resourceType ?? null;
  }

  if (payload.thumbnailUrl !== undefined) {
    const trimmed = payload.thumbnailUrl?.trim();
    updates.thumbnail_url = trimmed && trimmed.length > 0 ? trimmed : null;
  }

  if (payload.instructionalNotes !== undefined) {
    updates.instructional_notes = sanitizeNullable(payload.instructionalNotes);
  }

  if (payload.subjects !== undefined) {
    updates.subjects = sanitizeInputList(payload.subjects);
  }

  if (payload.topics !== undefined) {
    updates.topics = sanitizeInputList(payload.topics);
  }

  if (payload.tags !== undefined) {
    updates.tags = sanitizeInputList(payload.tags);
  }

  if (payload.status) {
    if (!VALID_STATUS.includes(payload.status)) {
      return errorResponse(422, "Invalid status value");
    }
    updates.status = payload.status;
  }

  if (payload.visibility) {
    if (!VALID_VISIBILITY.includes(payload.visibility)) {
      return errorResponse(422, "Invalid visibility value");
    }
    updates.visibility = payload.visibility;
  }

  if (metadata && !updates.title) {
    const candidate = metadata.metadata.title;
    if (candidate && candidate.trim().length > 0) {
      updates.title = candidate.trim();
    }
  }

  if (metadata && updates.description == null) {
    updates.description = sanitizeNullable(metadata.metadata.description);
  }

  if (Object.keys(updates).length === 0) {
    return jsonResponse({ resource: mapRecordToCard(existing) });
  }

  updates.updated_at = new Date().toISOString();

  const updateResult = await supabase
    .from<ResourceRecord>(TABLE_NAME)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateResult.error || !updateResult.data) {
    return errorResponse(500, "Failed to update resource");
  }

  const resource = mapRecordToCard(updateResult.data);
  return jsonResponse({ resource });
}

function extractIdFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url, "http://localhost");
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments.pop();
    return id ?? null;
  } catch {
    return null;
  }
}

function sanitizeNullable(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function tryLoadMetadata(url: string) {
  try {
    return await loadOpenGraphMetadata(url);
  } catch {
    return null;
  }
}
