import { supabase } from "@/integrations/supabase/client";
import type { BuilderStep } from "../types";

export interface LinkHealthStatus {
  url: string;
  isHealthy: boolean;
  statusCode: number | null;
  statusText: string | null;
  lastChecked: string | null;
  lastError: string | null;
}

export async function fetchLinkStatuses(urls: string[]): Promise<Record<string, LinkHealthStatus>> {
  if (!urls.length) return {};
  const { data, error } = await supabase
    .from("builder_link_health_reports")
    .select("url,is_healthy,status_code,status_text,last_checked,last_error")
    .in("url", urls);

  if (error) throw error;

  const lookup: Record<string, LinkHealthStatus> = {};
  for (const row of data ?? []) {
    lookup[row.url] = {
      url: row.url,
      isHealthy: row.is_healthy ?? true,
      statusCode: row.status_code ?? null,
      statusText: row.status_text ?? null,
      lastChecked: row.last_checked ?? null,
      lastError: row.last_error ?? null,
    };
  }
  return lookup;
}

export async function syncResourceLinks(draftId: string, steps: BuilderStep[]) {
  const existingResponse = await supabase
    .from("builder_resource_links")
    .select("id,step_id,url")
    .eq("draft_id", draftId);

  if (existingResponse.error) {
    throw existingResponse.error;
  }

  const records = steps.flatMap(step =>
    step.resources.map(resource => ({
      draft_id: draftId,
      step_id: step.id,
      label: resource.title,
      url: resource.url,
      resource_id: resource.resourceId ?? null,
      last_synced: new Date().toISOString(),
    })),
  );

  if (!records.length) {
    if ((existingResponse.data?.length ?? 0) > 0) {
      const { error: deleteError } = await supabase
        .from("builder_resource_links")
        .delete()
        .eq("draft_id", draftId);
      if (deleteError) throw deleteError;
    }
    return;
  }

  const { error } = await supabase.from("builder_resource_links").upsert(records, {
    onConflict: "draft_id,step_id,url",
  });

  if (error) throw error;

  const keepKeys = new Set(records.map(record => `${record.step_id}::${record.url}`));
  const staleIds = (existingResponse.data ?? [])
    .filter(row => !keepKeys.has(`${row.step_id}::${row.url}`))
    .map(row => row.id);

  if (staleIds.length) {
    const { error: deleteError } = await supabase
      .from("builder_resource_links")
      .delete()
      .in("id", staleIds);
    if (deleteError) throw deleteError;
  }
}
