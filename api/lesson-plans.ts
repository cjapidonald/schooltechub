import type { LessonPlanRecord } from "../types/lesson-plans";
import {
  buildLessonPlanQuery,
  buildListResponse,
  parseListFilters,
  parseRequestUrl,
} from "./_lib/lesson-plan-helpers";
import { getSupabaseClient } from "./_lib/supabase";

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
