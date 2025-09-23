import { supabase } from "@/integrations/supabase/client";
import type { ResearchProject } from "@/types/platform";

export const PROJECT_QUERY_KEY = ["admin", "research", "projects"] as const;

export async function fetchResearchProjects(): Promise<ResearchProject[]> {
  const { data, error } = await supabase
    .from("research_projects")
    .select("id,title,slug,summary,status,visibility,created_by,created_at")
    .order("created_at", { ascending: false, nullsLast: true });

  if (error) {
    throw new Error(error.message || "Failed to load research projects");
  }

  return (data ?? []).map(record => ({
    id: String(record.id ?? ""),
    title: record.title ?? "Untitled project",
    slug: record.slug ?? null,
    summary: record.summary ?? null,
    status: (record.status as ResearchProject["status"]) ?? "open",
    visibility: (record.visibility as ResearchProject["visibility"]) ?? "list_public",
    createdBy: record.created_by ?? null,
    createdAt: record.created_at ?? new Date().toISOString(),
  }));
}
