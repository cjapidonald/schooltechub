import { mapRecordToBuilderPlan } from "../../../_lib/lesson-builder-helpers";
import { getSupabaseClient } from "../../../_lib/supabase";
import type { LessonBuilderHistoryResponse } from "../../../../types/lesson-builder";
import type { LessonPlanRecord } from "../../../../types/lesson-plans";

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

export default async function handler(request: Request): Promise<Response> {
  if (request.method && request.method.toUpperCase() !== "GET") {
    return new Response(null, {
      status: 405,
      headers: {
        Allow: "GET",
      },
    });
  }

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const id = segments[segments.length - 2];

  if (!id) {
    return errorResponse(404, "Lesson plan not found");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from<LessonPlanRecord>("lesson_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return errorResponse(500, "Failed to load version history");
  }

  if (!data) {
    return errorResponse(404, "Lesson plan not found");
  }

  const plan = mapRecordToBuilderPlan(data);
  const response: LessonBuilderHistoryResponse = { versions: plan.history };
  return jsonResponse(response);
}
