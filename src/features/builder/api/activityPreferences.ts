import { supabase } from "@/integrations/supabase/client";
import type { BuilderActivitySummary } from "../types";
import { getAnonUserId } from "../utils/anonUser";

interface SupabaseActivityRecord {
  slug: string;
  name: string;
  description: string | null;
  subjects: string[] | null;
  school_stages: string[] | null;
  activity_types: string[] | null;
  group_sizes: string[] | null;
  setup_time: string | null;
  best_for: string | null;
  devices: string[] | null;
}

const ACTIVITY_SELECT = [
  "slug",
  "name",
  "description",
  "subjects",
  "school_stages",
  "activity_types",
  "setup_time",
  "group_sizes",
  "devices",
  "external_link",
].join(",");

const toSummary = (record: SupabaseActivityRecord): BuilderActivitySummary => ({
  slug: record.slug,
  name: record.name,
  description: record.description ?? null,
  subjects: record.subjects ?? [],
  schoolStages: record.school_stages ?? [],
  activityTypes: record.activity_types ?? [],
  tags: record.group_sizes ?? [],
  duration: record.setup_time ?? null,
  delivery: record.best_for ?? null,
  technology: record.devices ?? [],
});

export interface ActivityFilterState {
  search: string;
  stage: string[];
  subject: string[];
  skills: string[];
  duration: string[];
  grouping: string[];
  delivery: string[];
  technology: string[];
  tags: string[];
}

export const defaultActivityFilters: ActivityFilterState = {
  search: "",
  stage: [],
  subject: [],
  skills: [],
  duration: [],
  grouping: [],
  delivery: [],
  technology: [],
  tags: [],
};

export async function fetchActivities(filters: ActivityFilterState) {
  let query = supabase.from("tools_activities").select(ACTIVITY_SELECT).eq("is_published", true);

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.stage.length) {
    query = query.contains("school_stages", filters.stage);
  }
  if (filters.subject.length) {
    query = query.contains("subjects", filters.subject);
  }
  if (filters.grouping.length) {
    query = query.contains("group_sizes", filters.grouping);
  }
  if (filters.technology.length) {
    query = query.contains("devices", filters.technology);
  }
  if (filters.tags.length) {
    query = query.contains("activity_types", filters.tags);
  }
  if (filters.delivery.length) {
    query = query.or(filters.delivery.map(value => `best_for.ilike.%${value}%`).join(","));
  }
  if (filters.duration.length) {
    query = query.or(filters.duration.map(value => `setup_time.ilike.%${value}%`).join(","));
  }
  if (filters.skills.length) {
    query = query.or(filters.skills.map(value => `lesson_idea.ilike.%${value}%`).join(","));
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  return ((data ?? []) as unknown as SupabaseActivityRecord[]).map(toSummary);
}

export async function fetchRecents() {
  const anonUserId = getAnonUserId();
  const { data, error } = await supabase
    .from("builder_activity_recents")
    .select(
      `last_viewed, metadata, activity:tools_activities!builder_activity_recents_activity_slug_fkey(${ACTIVITY_SELECT})`,
    )
    .eq("anon_user_id", anonUserId)
    .order("last_viewed", { ascending: false })
    .limit(12);

  if (error) throw error;
  return ((data ?? []) as any[])
    .filter(
      (row): row is { last_viewed: string; metadata: Record<string, unknown>; activity: SupabaseActivityRecord } =>
        Boolean(row?.activity),
    )
    .map(row => ({
      summary: toSummary(row.activity),
      lastViewed: row.last_viewed,
      metadata: row.metadata ?? {},
    }));
}

export async function fetchFavorites() {
  const anonUserId = getAnonUserId();
  const { data, error } = await supabase
    .from("builder_activity_favorites")
    .select(
      `created_at, activity:tools_activities!builder_activity_favorites_activity_slug_fkey(${ACTIVITY_SELECT})`,
    )
    .eq("anon_user_id", anonUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? [])
    .filter(
      (row): row is { created_at: string; activity: SupabaseActivityRecord } => Boolean(row.activity),
    )
    .map(row => ({
      summary: toSummary(row.activity),
      createdAt: row.created_at,
    }));
}

export async function fetchCollections() {
  const anonUserId = getAnonUserId();
  const { data, error } = await supabase
    .from("builder_collections")
    .select(
      `id, name, description, items:builder_collection_items(activity:tools_activities!builder_collection_items_activity_slug_fkey(${ACTIVITY_SELECT}))`,
    )
    .eq("anon_user_id", anonUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(collection => ({
    id: collection.id as string,
    name: collection.name as string,
    description: (collection.description as string | null) ?? "",
    items: ((collection.items as { activity: SupabaseActivityRecord | null }[] | null) ?? [])
      .filter(item => Boolean(item.activity))
      .map(item => toSummary(item.activity as SupabaseActivityRecord)),
  }));
}

export async function trackRecentActivity(activity: BuilderActivitySummary) {
  const anonUserId = getAnonUserId();
  const { error } = await supabase.from("builder_activity_recents").upsert(
    {
      anon_user_id: anonUserId,
      activity_slug: activity.slug,
      metadata: {
        name: activity.name,
        subjects: activity.subjects,
      },
      last_viewed: new Date().toISOString(),
    },
    { onConflict: "anon_user_id,activity_slug" },
  );

  if (error) throw error;
}

export async function toggleFavorite(activity: BuilderActivitySummary, isFavorite: boolean) {
  const anonUserId = getAnonUserId();
  if (isFavorite) {
    const { error } = await supabase
      .from("builder_activity_favorites")
      .delete()
      .eq("anon_user_id", anonUserId)
      .eq("activity_slug", activity.slug);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("builder_activity_favorites").upsert(
    {
      anon_user_id: anonUserId,
      activity_slug: activity.slug,
      created_at: new Date().toISOString(),
    },
    { onConflict: "anon_user_id,activity_slug" },
  );
  if (error) throw error;
  return true;
}

export async function createCollection(name: string, activitySlugs: string[]) {
  const anonUserId = getAnonUserId();
  const { data, error } = await supabase
    .from("builder_collections")
    .insert({ anon_user_id: anonUserId, name })
    .select("id")
    .single();

  if (error) throw error;
  if (activitySlugs.length) {
    const { error: itemsError } = await supabase.from("builder_collection_items").insert(
      activitySlugs.map(slug => ({ collection_id: data.id, activity_slug: slug })),
    );
    if (itemsError) throw itemsError;
  }
  return data.id as string;
}
