import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type LinkHealthPayload = {
  url: string;
  status_code: number | null;
  status_text: string | null;
  is_healthy: boolean;
  last_error: string | null;
  last_checked: string;
  failure_count?: number;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async () => {
  const { data: resources, error } = await supabase
    .from("builder_resource_links")
    .select("url")
    .order("last_synced", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Failed to load resource links", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const uniqueUrls = Array.from(new Set((resources ?? []).map(record => record.url))).filter(Boolean);
  const results: LinkHealthPayload[] = [];

  for (const url of uniqueUrls) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const healthy = response.ok;
      results.push({
        url,
        status_code: response.status,
        status_text: response.statusText,
        is_healthy: healthy,
        last_error: healthy ? null : `Response status ${response.status}`,
        last_checked: new Date().toISOString(),
        failure_count: healthy ? 0 : 1,
      });
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
      results.push({
        url,
        status_code: null,
        status_text: null,
        is_healthy: false,
        last_error: message,
        last_checked: new Date().toISOString(),
        failure_count: 1,
      });
    }
  }

  if (results.length) {
    const updates = results.map(result => ({
      url: result.url,
      status_code: result.status_code,
      status_text: result.status_text,
      is_healthy: result.is_healthy,
      last_error: result.last_error,
      last_checked: result.last_checked,
      failure_count: result.failure_count,
    }));

    const { error: upsertError } = await supabase
      .from("builder_link_health_reports")
      .upsert(updates, { onConflict: "url" });

    if (upsertError) {
      console.error("Failed to upsert link health", upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
    }
  }

  return new Response(
    JSON.stringify({ checked: results.length, timestamp: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json" } },
  );
});
