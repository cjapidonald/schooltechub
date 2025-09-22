import type { LessonPlanRecord } from "../types/lesson-plans";
import {
  buildLessonPlanQuery,
  buildListResponse,
  parseListFilters,
  parseRequestUrl,
} from "./_lib/lesson-plan-helpers";
import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "./_lib/http";
import { getSupabaseClient } from "./_lib/supabase";

const LESSON_PLAN_BUILDER_TABLE = "lesson_plan_builder_plans";
const TEACHER_PROFILE_TABLE = "teacher_profiles";

interface LessonPlanCreatePayload {
  userId?: string;
  title?: string;
  summary?: string | null;
  stage?: string | null;
  durationMinutes?: number | null;
}

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);

  if (method === "POST") {
    return handleCreate(request);
  }

  if (method !== "GET") {
    return methodNotAllowed(["GET", "POST"]);
  }

  const url = parseRequestUrl(request);
  const filters = parseListFilters(url);
  const supabase = getSupabaseClient();

  const initialQuery = buildLessonPlanQuery(supabase, filters, {
    useFullTextSearch: true,
  });
  let { data, error } = await initialQuery;

  if (error && filters.q) {
    const fallbackQuery = buildLessonPlanQuery(supabase, filters, {
      useFullTextSearch: false,
    });
    const fallback = await fallbackQuery;
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return errorResponse(500, "Failed to load lesson plans");
  }

  const records: LessonPlanRecord[] = data ?? [];
  const payload = buildListResponse(records, filters);
  return jsonResponse(payload);
}

async function handleCreate(request: Request): Promise<Response> {
  const payload = (await parseJsonBody<LessonPlanCreatePayload>(request)) ?? {};

  if (!payload.userId) {
    return errorResponse(400, "A userId is required to create a lesson plan");
  }

  const supabase = getSupabaseClient();
  const profileResult = await supabase
    .from(TEACHER_PROFILE_TABLE)
    .select(
      "default_stage, default_duration_minutes, default_subject, default_summary"
    )
    .eq("user_id", payload.userId)
    .maybeSingle();

  if (profileResult.error) {
    return errorResponse(500, "Failed to load teacher profile defaults");
  }

  const defaults = profileResult.data ?? {};
  const now = new Date().toISOString();
  const insertPayload = {
    owner_id: payload.userId,
    title: payload.title?.trim() || "Untitled lesson plan",
    summary: payload.summary ?? defaults.default_summary ?? null,
    stage: payload.stage ?? defaults.default_stage ?? null,
    duration_minutes:
      payload.durationMinutes ?? defaults.default_duration_minutes ?? null,
    subject: defaults.default_subject ?? null,
    share_access: "owner" as const,
    created_at: now,
    updated_at: now,
  };

  const insertResult = await supabase
    .from(LESSON_PLAN_BUILDER_TABLE)
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertResult.error) {
    return errorResponse(500, "Failed to create lesson plan");
  }

  return jsonResponse({
    plan: {
      ...insertResult.data,
      shareAccess: insertResult.data?.share_access ?? "owner",
      readOnly:
        insertResult.data?.share_access != null &&
        insertResult.data.share_access !== "owner",
    },
  }, 201);
}
