import { normalizeInputUrl, stripTrackingParameters } from "./open-graph";

export type ResourceStatus = "draft" | "published" | "archived";
export type ResourceVisibility = "private" | "unlisted" | "public";

export interface ResourceRecord {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  url: string;
  normalized_url: string;
  domain: string;
  favicon_url: string | null;
  thumbnail_url: string | null;
  resource_type: string | null;
  subjects: string[] | null;
  topics: string[] | null;
  tags: string[] | null;
  instructional_notes: string | null;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  created_at: string;
  updated_at: string;
}

export interface ResourceCard {
  id: string;
  title: string;
  description: string | null;
  url: string;
  domain: string;
  faviconUrl: string | null;
  thumbnailUrl: string | null;
  resourceType: string | null;
  subjects: string[];
  topics: string[];
  tags: string[];
  instructionalNotes: string | null;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceListFilters {
  q: string | null;
  page: number;
  limit: number;
  offset: number;
  id: string | null;
  subjects: string[];
  topics: string[];
  tags: string[];
  types: string[];
  status: ResourceStatus | null;
  visibility: ResourceVisibility | null;
  ownerId: string | null;
}

export interface PaginatedResourceResponse {
  items: ResourceCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextPage: number | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function parseRequestUrl(request: Request): URL {
  try {
    return new URL(request.url);
  } catch {
    return new URL(request.url, "http://localhost");
  }
}

export function parseListFilters(url: URL): ResourceListFilters {
  const params = url.searchParams;
  const limit = clampLimit(parseIntSafe(params.get("limit")) ?? DEFAULT_LIMIT);
  const page = Math.max(1, parseIntSafe(params.get("page")) ?? 1);
  const offset = (page - 1) * limit;
  return {
    q: sanitize(params.get("q")),
    page,
    limit,
    offset,
    id: sanitize(params.get("id")),
    subjects: parseList(params, "subjects"),
    topics: parseList(params, "topics"),
    tags: parseList(params, "tags"),
    types: parseList(params, "types"),
    status: parseEnum<ResourceStatus>(params.get("status"), ["draft", "published", "archived"]),
    visibility: parseEnum<ResourceVisibility>(params.get("visibility"), ["private", "unlisted", "public"]),
    ownerId: sanitize(params.get("ownerId")),
  };
}

export function mapRecordToCard(record: ResourceRecord): ResourceCard {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? null,
    url: record.url,
    domain: record.domain,
    faviconUrl: record.favicon_url ?? null,
    thumbnailUrl: record.thumbnail_url ?? null,
    resourceType: record.resource_type ?? null,
    subjects: cleanList(record.subjects),
    topics: cleanList(record.topics),
    tags: cleanList(record.tags),
    instructionalNotes: record.instructional_notes ?? null,
    status: record.status ?? "draft",
    visibility: record.visibility ?? "private",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function normalizeResourceUrl(input: string): string | null {
  const normalized = normalizeInputUrl(input);
  if (!normalized) {
    return null;
  }
  try {
    const stripped = stripTrackingParameters(new URL(normalized));
    stripped.hash = "";
    if (stripped.pathname === "") {
      stripped.pathname = "/";
    }
    return stripped.toString();
  } catch {
    return null;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function buildFaviconUrl(url: string): string {
  try {
    const target = new URL(url);
    const origin = `${target.protocol}//${target.hostname}`;
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}`;
  } catch {
    return "";
  }
}

export function cleanList(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set(
    value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean)
  );
  return Array.from(unique);
}

export function sanitizeInputList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const entries = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
  return Array.from(new Set(entries));
}

function parseList(params: URLSearchParams, key: string): string[] {
  const raw = params.getAll(key);
  const entries = raw
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(entries));
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

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (!value) return null;
  const lower = value.trim().toLowerCase();
  const match = allowed.find((option) => option.toLowerCase() === lower);
  return match ?? null;
}
