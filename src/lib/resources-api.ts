import type {
  ResourceCard,
  ResourceListResponse,
  ResourceStatus,
  ResourceVisibility,
} from "../../types/resources";

export class ResourceApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
    this.name = "ResourceApiError";
  }
}

export interface ResourceSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  id?: string;
  subjects?: string[];
  topics?: string[];
  tags?: string[];
  types?: string[];
  status?: ResourceStatus;
  visibility?: ResourceVisibility;
  ownerId?: string;
}

export interface ResourceCreateRequest {
  userId: string;
  title?: string;
  description?: string | null;
  url: string;
  resourceType?: string | null;
  subjects?: string[];
  topics?: string[];
  tags?: string[];
  status?: ResourceStatus;
  visibility?: ResourceVisibility;
  instructionalNotes?: string | null;
  thumbnailUrl?: string | null;
}

export interface ResourceUpdateRequest {
  userId: string;
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

interface ResourceResponsePayload {
  resource: ResourceCard;
}

export async function searchResources(params: ResourceSearchParams = {}): Promise<ResourceListResponse> {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.id) query.set("id", params.id);
  if (params.status) query.set("status", params.status);
  if (params.visibility) query.set("visibility", params.visibility);
  if (params.ownerId) query.set("ownerId", params.ownerId);

  appendList(query, "subjects", params.subjects);
  appendList(query, "topics", params.topics);
  appendList(query, "tags", params.tags);
  appendList(query, "types", params.types);

  return request<ResourceListResponse>(`/api/resources${query.toString() ? `?${query.toString()}` : ""}`);
}

export async function createResource(payload: ResourceCreateRequest): Promise<ResourceCard> {
  const response = await request<ResourceResponsePayload>("/api/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.resource;
}

export async function updateResource(id: string, payload: ResourceUpdateRequest): Promise<ResourceCard> {
  const response = await request<ResourceResponsePayload>(`/api/resources/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.resource;
}

export async function getResource(id: string, ownerId: string): Promise<ResourceCard | null> {
  const result = await searchResources({ id, ownerId, limit: 1, page: 1 });
  return result.items[0] ?? null;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get("Content-Type");
  const isJson = contentType ? /application\/json/i.test(contentType) : false;
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data && typeof (data as Record<string, unknown>).error === "string"
      ? ((data as Record<string, unknown>).error as string)
      : response.statusText || "Request failed";
    throw new ResourceApiError(response.status, message, data ?? undefined);
  }

  return (data as T) ?? ({} as T);
}

function appendList(params: URLSearchParams, key: string, values?: string[]) {
  if (!values || values.length === 0) return;
  params.append(key, values.join(","));
}
