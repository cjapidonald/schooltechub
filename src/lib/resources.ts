import { supabase } from "@/integrations/supabase/client";
import type { Resource, ResourceDetail } from "@/types/resources";

const RESOURCE_SELECT =
  "id,title,description,url,storage_path,type,subject,stage,tags,thumbnail_url,created_by,status,approved_by,approved_at,is_active,created_at";

const RESOURCE_DETAIL_SELECT =
  "id,title,description,url,storage_path,type,subject,stage,grade_level,format,tags,thumbnail_url,created_by,status,approved_by,approved_at,is_active,created_at,instructional_notes";
const DEFAULT_PAGE_SIZE = 20;

/**
 * Error wrapper used for all resource data access layer failures.
 */
export class ResourceDataError extends Error {
  declare cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    const causeMessage =
      options?.cause && typeof options.cause === "object" && "message" in options.cause
        ? String((options.cause as { message?: unknown }).message ?? "")
        : undefined;

    super(causeMessage ? `${message} (${causeMessage})` : message);
    this.name = "ResourceDataError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export type ResourceSearchSort = "newest" | "title" | "most-tagged";

/**
 * Search filters supported by {@link searchResources}.
 */
export interface ResourceSearchOptions {
  /** Free-form search query. */
  q?: string;
  /** Filter by one or more resource types. */
  types?: string[];
  /** Filter by one or more subjects. */
  subjects?: string[];
  /** Filter by one or more stages/grade levels. */
  stages?: string[];
  /** Filter by matching tags (overlap). */
  tags?: string[];
  /** Sort order for the result set. */
  sort?: ResourceSearchSort;
  /** Page number to request, defaults to `1`. */
  page?: number;
  /** Page size to request, defaults to `20`. */
  pageSize?: number;
}

/**
 * Normalises potentially user-provided filter values by trimming whitespace and removing empties.
 */
function sanitizeFilterValues(values?: string[]): string[] {
  if (!values?.length) {
    return [];
  }

  const trimmed = values.map(value => value.trim()).filter(Boolean);
  return Array.from(new Set(trimmed));
}

/** Escapes wildcard characters for an ILIKE clause. */
function escapeForIlike(value: string): string {
  return value.replace(/[%_]/g, match => `\\${match}`);
}

/** Escapes commas so values can be safely used within a Supabase `or` clause. */
function escapeForOr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,");
}

/**
 * Simplifies the search term for the websearch full-text operator.
 */
function normaliseWebsearchTerm(value: string): string {
  return value.replace(/[':!&|()]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Ensures the current request is authenticated and returns the active access token.
 */
async function requireAccessToken(action: string): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new ResourceDataError("Unable to verify authentication state.", { cause: sessionError });
  }

  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new ResourceDataError(`You must be signed in to ${action}.`);
  }

  return accessToken;
}

function mapResource(record: Partial<Resource>): Resource {
  return {
    id: record.id ?? "",
    title: record.title ?? "Untitled resource",
    description: record.description ?? null,
    url: record.url ?? null,
    storage_path: record.storage_path ?? null,
    type: record.type ?? "unknown",
    subject: record.subject ?? null,
    stage: record.stage ?? null,
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
    thumbnail_url: record.thumbnail_url ?? null,
    created_by: record.created_by ?? null,
    created_at: record.created_at ?? new Date().toISOString(),
    status: (record.status as Resource["status"]) ?? "pending",
    approved_by: record.approved_by ?? null,
    approved_at: record.approved_at ?? null,
    is_active: record.is_active ?? false,
  } satisfies Resource;
}

type ResourceDetailRecord = {
  grade_level: string | null;
  format: string | null;
  instructional_notes: string | null;
} & Partial<Resource>;

function mapResourceDetail(record: ResourceDetailRecord): ResourceDetail {
  const base = mapResource(record);

  return {
    ...base,
    gradeLevel: record.grade_level ?? null,
    format: record.format ?? null,
    instructionalNotes: record.instructional_notes ?? null,
  } satisfies ResourceDetail;
}

/**
 * Performs a paginated query against the `resources` table, applying optional filters.
 *
 * The search term performs a web-style full-text search against titles, an `ILIKE` match against
 * descriptions, and ensures that at least one tag overlaps with the query.
 */
export async function searchResources(
  options: ResourceSearchOptions = {},
): Promise<{ items: Resource[]; total: number }> {
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const sort = options.sort ?? "newest";

  let query = supabase
    .from("resources")
    .select(RESOURCE_SELECT, { count: "exact" })
    .eq("is_active", true)
    .eq("status", "approved");

  if (sort === "title") {
    query = query.order("title", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const types = sanitizeFilterValues(options.types);
  if (types.length) {
    query = query.in("type", types);
  }

  const subjects = sanitizeFilterValues(options.subjects);
  if (subjects.length) {
    query = query.in("subject", subjects);
  }

  const stages = sanitizeFilterValues(options.stages);
  if (stages.length) {
    query = query.in("stage", stages);
  }

  const tags = sanitizeFilterValues(options.tags);
  if (tags.length) {
    query = query.overlaps("tags", tags);
  }

  const searchTerm = options.q?.trim();
  if (searchTerm) {
    const normalised = normaliseWebsearchTerm(searchTerm);
    if (normalised) {
      const orFilters = [`title.wfts.${escapeForOr(normalised)}`];
      const escapedIlike = escapeForIlike(searchTerm);
      orFilters.push(`title.ilike.%${escapedIlike}%`);
      orFilters.push(`description.ilike.%${escapedIlike}%`);

      const tagValue = searchTerm.replace(/[{}]/g, "").trim();
      if (tagValue) {
        const escapedTag = escapeForOr(tagValue.replace(/"/g, '\\"'));
        orFilters.push(`tags.ov.{"${escapedTag}"}`);
      }

      query = query.or(orFilters.join(","));
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new ResourceDataError("Unable to search resources.", { cause: error });
  }

  const items = ((data ?? []) as any[]).map(mapResource);

  if (sort === "most-tagged") {
    items.sort((a, b) => {
      const diff = (b.tags?.length ?? 0) - (a.tags?.length ?? 0);
      if (diff !== 0) {
        return diff;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return {
    items,
    total: count ?? items.length,
  };
}

export async function fetchResourceById(id: string): Promise<ResourceDetail> {
  const { data, error } = await supabase
    .from("resources")
    .select(RESOURCE_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ResourceDataError("Unable to load resource details.", { cause: error });
  }

  if (!data) {
    throw new ResourceDataError("Resource not found.");
  }

  return mapResourceDetail(data as ResourceDetailRecord);
}

/**
 * Retrieves a single resource by its identifier.
 */
export async function getResourceById(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    throw new ResourceDataError("Unable to load the requested resource.", { cause: error });
  }

  return data ? mapResource(data) : null;
}

/**
 * Retrieves a set of resources in a single request, preserving input order.
 */
export async function getResourcesByIds(ids: string[]): Promise<Resource[]> {
  const uniqueIds = Array.from(new Set(ids.map(id => id.trim()).filter(Boolean)));

  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .in("id", uniqueIds)
    .eq("is_active", true)
    .eq("status", "approved");

  if (error) {
    throw new ResourceDataError("Unable to load the requested resources.", { cause: error });
  }

  const lookup = new Map(((data ?? []) as any[]).map(resource => [resource.id, mapResource(resource)] as const));
  return uniqueIds
    .map(id => lookup.get(id))
    .filter((resource): resource is Resource => Boolean(resource));
}

/**
 * Submits a new resource upload request via the API endpoint.
 */
export async function createUpload(formData: FormData): Promise<Resource> {
  const accessToken = await requireAccessToken("upload a resource");

  let response: Response;
  try {
    response = await fetch("/api/resources/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
  } catch (error) {
    throw new ResourceDataError("Failed to submit resource upload.", { cause: error });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error.trim()) || "Failed to upload resource.";
    throw new ResourceDataError(message);
  }

  if (!payload || typeof payload !== "object" || payload === null || !("resource" in payload)) {
    throw new ResourceDataError("Upload succeeded but no resource was returned.");
  }

  return mapResource((payload as { resource: Partial<Resource> }).resource);
}

/**
 * Retrieves a signed download URL for the specified resource.
 */
export async function getSignedDownloadUrl(id: string): Promise<string> {
  const accessToken = await requireAccessToken("download this resource");

  let response: Response;
  try {
    response = await fetch(`/api/resources/${encodeURIComponent(id)}/download`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      redirect: "follow",
    });
  } catch (error) {
    throw new ResourceDataError("Failed to request download URL.", { cause: error });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = "Unable to download resource.";
    if (isJson) {
      const payload = await response.json().catch(() => null);
      if (payload && typeof payload.error === "string" && payload.error.trim()) {
        message = payload.error;
      }
    }
    throw new ResourceDataError(message);
  }

  if (isJson) {
    const payload = await response.json().catch(() => null);
    const url = payload && typeof payload.url === "string" ? payload.url : null;
    if (url) {
      return url;
    }
    throw new ResourceDataError("Download URL was not provided by the server.");
  }

  if (!response.url) {
    throw new ResourceDataError("Unable to determine download URL.");
  }

  return response.url;
}
