import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../_lib/http";
import { getSupabaseClient } from "../_lib/supabase";

interface ActivityCreatePayload {
  userId?: string;
  title?: string;
  url?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  subjects?: string[] | null;
  gradeLevels?: string[] | null;
  activityTypes?: string[] | null;
  durationMinutes?: number | null;
}

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  if (method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const payload = (await parseJsonBody<ActivityCreatePayload>(request)) ?? {};
  if (!payload.userId) {
    return errorResponse(400, "A userId is required to create an activity");
  }

  if (!payload.title || payload.title.trim().length === 0) {
    return errorResponse(400, "A title is required to create an activity");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("activities")
    .insert({
      title: payload.title.trim(),
      url: payload.url ?? null,
      description: payload.description ?? null,
      thumbnail_url: payload.thumbnailUrl ?? null,
      subjects: payload.subjects ?? null,
      grade_levels: payload.gradeLevels ?? null,
      activity_types: payload.activityTypes ?? null,
      duration_minutes: payload.durationMinutes ?? null,
      created_by: payload.userId,
      status: "draft",
    })
    .select("*")
    .single();

  if (error || !data) {
    return errorResponse(500, "Failed to create activity");
  }

  return jsonResponse({ activity: data }, 201);
}
