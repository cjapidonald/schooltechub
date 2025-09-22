import { getSupabaseClient } from "../../../_lib/supabase";
import { mergeActivityValues, cryptoRandomId } from "../../../../types/lesson-builder";
import type { LessonBuilderActivitySearchResponse } from "../../../../types/lesson-builder";

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

function ensureArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((value): value is string => typeof value === "string");
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function mapActivity(record: Record<string, unknown>) {
  const title = typeof record.title === "string" && record.title.length > 0 ? record.title : "Activity";
  const summary = typeof record.excerpt === "string" ? record.excerpt : null;
  const subjects = ensureArray(record.subjects);
  const gradeLevels = ensureArray(record.grade_levels ?? record.gradeLevels);
  const durationMinutes = typeof record.read_time === "number" ? record.read_time : null;
  const tags = ensureArray(record.activity_type ?? record.activityTypes ?? record.tags);
  const slug = typeof record.slug === "string" ? record.slug : null;
  const sourceUrl = slug ? `/edutech/${slug}` : null;

  return mergeActivityValues({
    id: typeof record.id === "string" ? record.id : cryptoRandomId("activity"),
    title,
    summary,
    subjects,
    gradeLevels,
    durationMinutes,
    sourceUrl,
    tags,
  });
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
  const query = url.searchParams.get("q");
  const supabase = getSupabaseClient();

  let builder = supabase
    .from("content_master")
    .select("id,title,excerpt,subjects,grade_levels,activity_type,slug,read_time")
    .eq("content_type", "activity")
    .limit(12);

  if (query && query.trim().length > 0) {
    const term = `%${query.trim()}%`;
    builder = builder.or(
      [
        `title.ilike.${term}`,
        `excerpt.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error } = await builder;

  if (error) {
    return errorResponse(500, "Failed to search activities");
  }

  const records = Array.isArray(data) ? data : [];
  const results = records
    .map((record) => mapActivity(record as Record<string, unknown>))
    .filter((activity) => activity.title.length > 0);

  const response: LessonBuilderActivitySearchResponse = { results };
  return jsonResponse(response);
}
