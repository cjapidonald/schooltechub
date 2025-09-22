import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../_lib/http";
import { getSupabaseClient } from "../_lib/supabase";
import {
  buildFaviconUrl,
  extractDomain,
  mapRecordToCard,
  normalizeResourceUrl,
  parseListFilters,
  parseRequestUrl,
  sanitizeInputList,
} from "../_lib/resource-helpers";
import { loadOpenGraphMetadata } from "../_lib/open-graph";
import type { ResourceRecord, ResourceStatus, ResourceVisibility } from "../_lib/resource-helpers";

interface ResourceCreatePayload {
  userId?: string;
  title?: string;
  description?: string | null;
  url?: string;
  resourceType?: string | null;
  subjects?: string[];
  topics?: string[];
  tags?: string[];
  status?: ResourceStatus;
  visibility?: ResourceVisibility;
  instructionalNotes?: string | null;
  thumbnailUrl?: string | null;
}

const TABLE_NAME = "educator_resources";
const VALID_STATUS: ResourceStatus[] = ["draft", "published", "archived"];
const VALID_VISIBILITY: ResourceVisibility[] = ["private", "unlisted", "public"];

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);

  if (method === "GET") {
    return handleList(request);
  }

  if (method === "POST") {
    return handleCreate(request);
  }

  return methodNotAllowed(["GET", "POST"]);
}

async function handleList(request: Request): Promise<Response> {
  const url = parseRequestUrl(request);
  const filters = parseListFilters(url);
  const supabase = getSupabaseClient();

  let query = supabase
    .from<ResourceRecord>(TABLE_NAME)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.ownerId) {
    query = query.eq("owner_id", filters.ownerId);
  } else {
    query = query.eq("visibility", "public").eq("status", "published");
  }

  if (filters.id) {
    query = query.eq("id", filters.id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.visibility) {
    query = query.eq("visibility", filters.visibility);
  }

  if (filters.q) {
    const escaped = escapeIlike(filters.q);
    const condition = [`title.ilike.${escaped}`, `description.ilike.${escaped}`, `domain.ilike.${escaped}`];
    query = query.or(condition.join(","));
  }

  if (filters.subjects.length > 0) {
    query = query.overlaps("subjects", filters.subjects);
  }

  if (filters.topics.length > 0) {
    query = query.overlaps("topics", filters.topics);
  }

  if (filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  if (filters.types.length > 0) {
    query = query.in("resource_type", filters.types);
  }

  const rangeEnd = filters.offset + filters.limit - 1;
  query = query.range(filters.offset, rangeEnd);

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(500, "Failed to load resources");
  }

  const records: ResourceRecord[] = Array.isArray(data) ? (data as ResourceRecord[]) : [];
  const items = records.map(mapRecordToCard);
  const total = count ?? records.length;
  const hasMore = filters.offset + filters.limit < total;

  return jsonResponse({
    items,
    total,
    page: filters.page,
    pageSize: filters.limit,
    hasMore,
    nextPage: hasMore ? filters.page + 1 : null,
  });
}

async function handleCreate(request: Request): Promise<Response> {
  const payload = (await parseJsonBody<ResourceCreatePayload>(request)) ?? {};

  if (!payload.userId) {
    return errorResponse(400, "An authenticated userId is required");
  }

  if (!payload.url || payload.url.trim().length === 0) {
    return errorResponse(422, "A resource URL is required");
  }

  const normalizedUrl = normalizeResourceUrl(payload.url);
  if (!normalizedUrl) {
    return errorResponse(422, "The provided URL is invalid");
  }

  const supabase = getSupabaseClient();

  const duplicateCheck = await supabase
    .from<ResourceRecord>(TABLE_NAME)
    .select("id, owner_id")
    .eq("normalized_url", normalizedUrl)
    .maybeSingle();

  if (duplicateCheck.error) {
    return errorResponse(500, "Failed to verify existing resources");
  }

  if (duplicateCheck.data) {
    const isOwner = duplicateCheck.data.owner_id === payload.userId;
    const message = isOwner
      ? "You have already submitted this resource"
      : "This resource already exists in the library";
    return errorResponse(409, message);
  }

  const metadata = await tryLoadMetadata(normalizedUrl);
  const domain = extractDomain(normalizedUrl);
  const now = new Date().toISOString();
  const status = validateStatus(payload.status) ?? "draft";
  const visibility = validateVisibility(payload.visibility) ?? "private";

  const title = pickString(payload.title, metadata?.metadata.title, domain);
  const description = pickNullableString(payload.description, metadata?.metadata.description);
  const thumbnailUrl = payload.thumbnailUrl ?? metadata?.metadata.image ?? null;
  const faviconUrl = buildFaviconUrl(normalizedUrl);
  const sanitizedFavicon = faviconUrl && faviconUrl.length > 0 ? faviconUrl : null;

  const insertPayload = {
    owner_id: payload.userId,
    title,
    description,
    url: normalizedUrl,
    normalized_url: normalizedUrl,
    domain,
    favicon_url: sanitizedFavicon,
    thumbnail_url: thumbnailUrl,
    resource_type: payload.resourceType ?? null,
    subjects: sanitizeInputList(payload.subjects),
    topics: sanitizeInputList(payload.topics),
    tags: sanitizeInputList(payload.tags),
    instructional_notes: pickNullableString(payload.instructionalNotes),
    status,
    visibility,
    created_at: now,
    updated_at: now,
  } satisfies Partial<ResourceRecord> & {
    owner_id: string;
    title: string;
    url: string;
    normalized_url: string;
    domain: string;
  };

  const insertResult = await supabase
    .from<ResourceRecord>(TABLE_NAME)
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertResult.error || !insertResult.data) {
    return errorResponse(500, "Failed to create resource");
  }

  const resource = mapRecordToCard(insertResult.data);
  return jsonResponse({ resource }, 201);
}

function escapeIlike(value: string): string {
  return `%${value.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
}

function pickString(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "Untitled resource";
}

function pickNullableString(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
}

function validateStatus(status: ResourceStatus | undefined): ResourceStatus | null {
  if (!status) return null;
  return VALID_STATUS.includes(status) ? status : null;
}

function validateVisibility(visibility: ResourceVisibility | undefined): ResourceVisibility | null {
  if (!visibility) return null;
  return VALID_VISIBILITY.includes(visibility) ? visibility : null;
}

async function tryLoadMetadata(url: string) {
  try {
    return await loadOpenGraphMetadata(url);
  } catch {
    return null;
  }
}
