import { supabase } from "@/integrations/supabase/client";
import type { Resource, ResourceCreateInput, ResourceUpdateInput } from "@/types/resources";

const RESOURCE_SELECT =
  "id,title,description,url,type,subject,stage,tags,thumbnail_url,created_by,created_at,is_active";
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

/**
 * Normalises tags before persistence by trimming whitespace and removing duplicates.
 */
function sanitizeTagsForPersistence(tags: string[] | null | undefined): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }

  const cleaned = (tags ?? []).map(tag => tag.trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
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
 * Ensures the current request is authenticated and returns the active user id.
 */
async function requireUserId(action: string): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new ResourceDataError("Unable to verify authentication state.", { cause: sessionError });
  }

  const userId = sessionData.session?.user.id;

  if (!userId) {
    throw new ResourceDataError(`You must be signed in to ${action}.`);
  }

  return userId;
}

/**
 * Performs a paginated query against the `resources` table, applying optional filters.
 *
 * The search term performs a web-style full-text search against titles, an `ILIKE` match against
 * descriptions, and ensures that at least one tag overlaps with the query.
 */
export async function searchResources(options: ResourceSearchOptions = {}): Promise<{ items: Resource[]; total: number }> {
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("resources")
    .select<Resource>(RESOURCE_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  query = query.eq("is_active", true);

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
        const escapedTag = escapeForOr(tagValue.replace(/"/g, "\\\""));
        orFilters.push(`tags.ov.{\"${escapedTag}\"}`);
      }

      query = query.or(orFilters.join(","));
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new ResourceDataError("Unable to search resources.", { cause: error });
  }

  return {
    items: data ?? [],
    total: count ?? (data?.length ?? 0),
  };
}

/**
 * Retrieves a single resource by its identifier.
 */
export async function getResourceById(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from("resources")
    .select<Resource>(RESOURCE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ResourceDataError("Unable to load the requested resource.", { cause: error });
  }

  return data ?? null;
}

/**
 * Creates a new resource owned by the authenticated user.
 */
export async function createResource(data: ResourceCreateInput): Promise<Resource> {
  const userId = await requireUserId("create a resource");

  const tags = sanitizeTagsForPersistence(data.tags);

  const insertPayload: Record<string, unknown> = {
    title: data.title,
    description: data.description ?? null,
    url: data.url,
    type: data.type,
    subject: data.subject ?? null,
    stage: data.stage ?? null,
    thumbnail_url: data.thumbnail_url ?? null,
    created_by: userId,
    is_active: data.is_active ?? true,
  };

  if (tags !== undefined) {
    insertPayload.tags = tags;
  }

  const { data: created, error } = await supabase
    .from("resources")
    .insert(insertPayload)
    .select<Resource>(RESOURCE_SELECT)
    .single();

  if (error || !created) {
    throw new ResourceDataError("Unable to create resource.", { cause: error });
  }

  return created;
}

/**
 * Updates a resource owned by the authenticated user.
 */
export async function updateResource(id: string, data: ResourceUpdateInput): Promise<Resource> {
  const userId = await requireUserId("update a resource");

  const updatePayload: Record<string, unknown> = {};

  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.url !== undefined) updatePayload.url = data.url;
  if (data.description !== undefined) updatePayload.description = data.description ?? null;
  if (data.type !== undefined) updatePayload.type = data.type;
  if (data.subject !== undefined) updatePayload.subject = data.subject ?? null;
  if (data.stage !== undefined) updatePayload.stage = data.stage ?? null;
  if (data.thumbnail_url !== undefined) updatePayload.thumbnail_url = data.thumbnail_url ?? null;
  if (data.is_active !== undefined) updatePayload.is_active = data.is_active;

  if (data.tags !== undefined) {
    const tags = sanitizeTagsForPersistence(data.tags);
    updatePayload.tags = tags;
  }

  const { data: updated, error } = await supabase
    .from("resources")
    .update(updatePayload)
    .eq("id", id)
    .eq("created_by", userId)
    .select<Resource>(RESOURCE_SELECT)
    .single();

  if (error || !updated) {
    throw new ResourceDataError("Unable to update resource.", { cause: error });
  }

  return updated;
}
