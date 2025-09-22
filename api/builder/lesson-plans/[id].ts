import { mapRecordToBuilderPlan, buildUpdatePayload, nextVersionEntry, buildMetadataFromPlan } from "../../_lib/lesson-builder-helpers";
import { getSupabaseClient } from "../../_lib/supabase";
import type {
  LessonBuilderPlan,
  LessonBuilderPlanResponse,
  LessonBuilderUpdateRequest,
} from "../../../types/lesson-builder";
import type { LessonPlanRecord } from "../../../types/lesson-plans";

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

function errorResponse(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}

function parseLookup(url: URL): "id" | "slug" {
  const lookup = url.searchParams.get("lookup");
  return lookup === "slug" ? "slug" : "id";
}

async function loadPlan(id: string, lookup: "id" | "slug") {
  const supabase = getSupabaseClient();
  let query = supabase.from<LessonPlanRecord>("lesson_plans").select("*");
  if (lookup === "slug") {
    query = query.eq("slug", id).eq("status", "published");
  } else {
    query = query.eq("id", id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    return { error: errorResponse(500, "Failed to load lesson plan") };
  }
  if (!data) {
    return { error: errorResponse(404, "Lesson plan not found") };
  }
  return { plan: mapRecordToBuilderPlan(data) };
}

function parseUpdate(body: unknown): LessonBuilderUpdateRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  if (!("plan" in body)) {
    return null;
  }
  return body as LessonBuilderUpdateRequest;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const id = segments.pop();

  if (!id) {
    return errorResponse(404, "Lesson plan not found");
  }

  if (!request.method) {
    return errorResponse(405, "Method not allowed");
  }

  const method = request.method.toUpperCase();
  const lookup = parseLookup(url);

  if (method === "GET") {
    const result = await loadPlan(id, lookup);
    if ("error" in result) {
      return result.error;
    }
    const response: LessonBuilderPlanResponse = { plan: result.plan };
    return jsonResponse(response);
  }

  if (method !== "PATCH") {
    return new Response(null, {
      status: 405,
      headers: {
        Allow: "GET, PATCH",
      },
    });
  }

  if (lookup === "slug") {
    return errorResponse(400, "Updates must use plan id");
  }

  let payload: LessonBuilderUpdateRequest | null = null;
  try {
    payload = parseUpdate(await request.json());
  } catch {
    payload = null;
  }

  if (!payload || !payload.plan) {
    return errorResponse(400, "Invalid payload");
  }

  const incomingPlan = payload.plan;
  const timestamp = new Date().toISOString();
  const history = [nextVersionEntry(incomingPlan, timestamp), ...incomingPlan.history].slice(0, 25);

  const updatedPlan: LessonBuilderPlan = {
    ...incomingPlan,
    lastSavedAt: timestamp,
    version: incomingPlan.version + 1,
    history,
  };

  const update = buildUpdatePayload(updatedPlan);
  // Ensure metadata keeps version + history updates
  update.metadata = buildMetadataFromPlan(updatedPlan);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from<LessonPlanRecord>("lesson_plans")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return errorResponse(500, "Failed to save lesson plan");
  }

  const plan = mapRecordToBuilderPlan(data);
  const response: LessonBuilderPlanResponse = { plan };
  return jsonResponse(response);
}
