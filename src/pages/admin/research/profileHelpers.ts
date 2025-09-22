import { supabase } from "@/integrations/supabase/client";

export interface AdminProfileSummary {
  id: string;
  fullName: string | null;
  email: string | null;
}

export async function fetchProfilesByIds(userIds: string[]): Promise<Map<string, AdminProfileSummary>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message || "Failed to load user profiles");
  }

  const map = new Map<string, AdminProfileSummary>();
  for (const row of data ?? []) {
    map.set(row.id, {
      id: row.id,
      fullName: row.full_name ?? null,
      email: row.email ?? null,
    });
  }
  return map;
}
