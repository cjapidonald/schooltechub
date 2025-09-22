import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../_lib/http";
import { getSupabaseClient } from "../_lib/supabase";

interface ActivityListFilters {
  q: string | null;
  limit: number;
  offset: number;
  subjects: string[];
  gradeLevels: string[];
  activityTypes: string[];
}

interface ActivityRecord {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  thumbnail_url?: string | null;
  subject?: string | null;
  grade_levels?: string[] | null;
  activity_types?: string[] | null;
  created_at?: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  if (method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const url = parseRequestUrl(request);
  const filters = parseFilters(url);
  const supabase = getSupabaseClient();

  let query = supabase
    .from("activities")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.q) {
    const pattern = `%${filters.q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    query = query.ilike("title", pattern);
  }

  if (filters.subjects.length > 0) {
    query = query.overlaps("subjects", filters.subjects);
  }

  if (filters.gradeLevels.length > 0) {
    query = query.overlaps("grade_levels", filters.gradeLevels);
  }

  if (filters.activityTypes.length > 0) {
    query = query.overlaps("activity_types", filters.activityTypes);
  }

  const end = filters.offset + filters.limit - 1;
  query = query.range(filters.offset, end);

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(500, "Failed to load activities");
  }

  const items = Array.isArray(data) ? (data as ActivityRecord[]) : [];
  const hasMore = count != null ? filters.offset + filters.limit < count : false;
  const nextCursor = hasMore ? filters.offset + filters.limit : null;

  return jsonResponse({
    items,
    nextCursor,
    total: count ?? items.length,
  });
}

function parseRequestUrl(request: Request): URL {
  try {
    return new URL(request.url);
  } catch {
    return new URL(request.url, "http://localhost");
  }
}

function parseFilters(url: URL): ActivityListFilters {
  const params = url.searchParams;
  const limit = clampLimit(parseIntSafe(params.get("limit")) ?? DEFAULT_LIMIT);
  const page = parseIntSafe(params.get("page"));
  const offset = page && page > 0 ? (page - 1) * limit : parseIntSafe(params.get("offset")) ?? 0;
  return {
    q: sanitize(params.get("q")),
    limit,
    offset,
    subjects: parseList(params, "subjects"),
    gradeLevels: parseList(params, "gradeLevels"),
    activityTypes: parseList(params, "types"),
  };
}

function parseList(params: URLSearchParams, key: string): string[] {
  const raw = params.getAll(key);
  const parts = raw
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function clampLimit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(value)));
}

function parseIntSafe(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitize(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
