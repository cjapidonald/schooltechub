import { supabase } from "@/integrations/supabase/client";

import type { ResourceCard, ResourceListResponse, ResourceRecord } from "../../types/resources";

export class ResourceApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ResourceApiError";
  }
}

export interface ResourceSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  id?: string;
  resourceType?: string;
  subject?: string;
  gradeLevel?: string;
  format?: string;
  creatorId?: string;
  tags?: string[];
}

export interface ResourceCreateRequest {
  userId: string;
  title: string;
  url: string;
  description?: string | null;
  resourceType?: string | null;
  subject?: string | null;
  gradeLevel?: string | null;
  format?: string | null;
  tags?: string[];
  instructionalNotes?: string | null;
}

export interface ResourceUpdateRequest {
  userId: string;
  title?: string;
  url?: string;
  description?: string | null;
  resourceType?: string | null;
  subject?: string | null;
  gradeLevel?: string | null;
  format?: string | null;
  tags?: string[];
  instructionalNotes?: string | null;
}

interface ResourceWithProfile extends ResourceRecord {
  profiles?: {
    full_name: string | null;
  } | null;
}

const mapRecordToCard = (record: ResourceWithProfile): ResourceCard => ({
  id: record.id,
  title: record.title,
  description: record.description,
  url: record.url,
  tags: record.tags ?? [],
  resourceType: record.resource_type,
  subject: record.subject,
  gradeLevel: record.grade_level,
  format: record.format,
  instructionalNotes: record.instructional_notes,
  creatorId: record.creator_id,
  creatorName: record.profiles?.full_name ?? null,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const escapeIlike = (value: string) => value.replace(/[%_]/g, match => `\\${match}`);
const escapeJsonString = (value: string) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const sanitizeTags = (tags?: string[]) => (tags ?? []).map(tag => tag.trim()).filter(Boolean);

export async function searchResources(params: ResourceSearchParams = {}): Promise<ResourceListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 20);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("resources")
    .select(
      `id,title,url,description,tags,resource_type,subject,grade_level,format,instructional_notes,creator_id,created_at,updated_at`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.id) {
    query = query.eq("id", params.id);
  }

  if (params.resourceType) {
    query = query.eq("resource_type", params.resourceType);
  }

  if (params.subject) {
    query = query.eq("subject", params.subject);
  }

  if (params.gradeLevel) {
    query = query.eq("grade_level", params.gradeLevel);
  }

  if (params.format) {
    query = query.eq("format", params.format);
  }

  if (params.creatorId) {
    query = query.eq("creator_id", params.creatorId);
  }

  if (params.tags && params.tags.length) {
    query = query.contains("tags", sanitizeTags(params.tags));
  }

  if (params.q) {
    const trimmed = params.q.trim();
    if (trimmed) {
      const escaped = escapeIlike(trimmed);
      const escapedTag = escapeJsonString(trimmed);
      query = query.or(
        [`title.ilike.%${escaped}%`, `description.ilike.%${escaped}%`, `tags.cs.{"${escapedTag}"}`].join(","),
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new ResourceApiError(500, error.message);
  }

  const records = (data ?? []) as unknown as ResourceWithProfile[];
  const items = records.map(mapRecordToCard);
  const total = count ?? items.length;
  const hasMore = from + items.length < total;

  return {
    items,
    total,
    page,
    pageSize: limit,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
  };
}

export async function createResource(payload: ResourceCreateRequest): Promise<ResourceCard> {
  const now = new Date().toISOString();
  const tags = sanitizeTags(payload.tags);

  const { data, error } = await supabase
    .from("resources")
    .insert({
      creator_id: payload.userId,
      title: payload.title,
      url: payload.url,
      description: payload.description ?? null,
      resource_type: payload.resourceType ?? null,
      subject: payload.subject ?? null,
      grade_level: payload.gradeLevel ?? null,
      format: payload.format ?? null,
      tags,
      instructional_notes: payload.instructionalNotes ?? null,
      created_at: now,
      updated_at: now,
    })
    .select(
      `id,title,url,description,tags,resource_type,subject,grade_level,format,instructional_notes,creator_id,created_at,updated_at,profiles:creator_id(full_name)`,
    )
    .single();

  if (error || !data) {
    throw new ResourceApiError(500, error?.message ?? "Failed to create resource");
  }

  return mapRecordToCard(data as unknown as ResourceWithProfile);
}

export async function updateResource(id: string, payload: ResourceUpdateRequest): Promise<ResourceCard> {
  const tags = sanitizeTags(payload.tags);

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updatePayload.title = payload.title;
  if (payload.url !== undefined) updatePayload.url = payload.url;
  if (payload.description !== undefined) updatePayload.description = payload.description ?? null;
  if (payload.resourceType !== undefined) updatePayload.resource_type = payload.resourceType ?? null;
  if (payload.subject !== undefined) updatePayload.subject = payload.subject ?? null;
  if (payload.gradeLevel !== undefined) updatePayload.grade_level = payload.gradeLevel ?? null;
  if (payload.format !== undefined) updatePayload.format = payload.format ?? null;
  if (payload.tags !== undefined) updatePayload.tags = tags;
  if (payload.instructionalNotes !== undefined) {
    updatePayload.instructional_notes = payload.instructionalNotes ?? null;
  }

  const { data, error } = await supabase
    .from("resources")
    .update(updatePayload)
    .eq("id", id)
    .eq("creator_id", payload.userId)
    .select()
    .single();

  if (error || !data) {
    throw new ResourceApiError(500, error?.message ?? "Failed to update resource");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', data.creator_id)
    .single();

  return mapRecordToCard({ ...data, profiles: profile } as ResourceWithProfile);
}

export async function deleteResource(id: string, userId: string): Promise<void> {
  const { error } = await supabase.from("resources").delete().eq("id", id).eq("creator_id", userId);
  if (error) {
    throw new ResourceApiError(500, error.message);
  }
}

export async function getResource(id: string, ownerId: string): Promise<ResourceCard | null> {
  const { data, error } = await supabase
    .from("resources")
    .select()
    .eq("id", id)
    .eq("creator_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new ResourceApiError(500, error.message);
  }

  if (!data) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', data.creator_id)
    .single();

  return mapRecordToCard({ ...data, profiles: profile } as ResourceWithProfile);
}
