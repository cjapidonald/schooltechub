import type { WorksheetRecord } from "../../types/worksheets";
import { mapRecordToWorksheet, parseRequestUrl } from "../_lib/worksheet-helpers";
import { getSupabaseClient } from "../_lib/supabase";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method && request.method.toUpperCase() !== "GET") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET" },
    });
  }

  const url = parseRequestUrl(request);
  const segments = url.pathname.split("/").filter(Boolean);
  const slug = segments.pop();

  if (!slug) {
    return jsonResponse({ error: "Worksheet not found" }, 404);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from<WorksheetRecord>("worksheets")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Failed to load worksheet" }, 500);
  }

  if (!data) {
    return jsonResponse({ error: "Worksheet not found" }, 404);
  }

  const payload = mapRecordToWorksheet(data);
  return jsonResponse(payload);
}
