import type { LessonPlanRecord } from "../../types/lesson-plans";
import {
  mapRecordToDetail,
  parseRequestUrl,
  renderLessonPlanToPdf,
} from "../_lib/lesson-plan-helpers";
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
      headers: {
        Allow: "GET",
      },
    });
  }

  const url = parseRequestUrl(request);
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSegment = segments.pop();
  if (lastSegment?.toLowerCase() !== "pdf") {
    return jsonResponse({ error: "Lesson plan not found" }, 404);
  }
  const id = segments.pop();

  if (!id) {
    return jsonResponse({ error: "Lesson plan not found" }, 404);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from<LessonPlanRecord>("lesson_plans")
    .select("*")
    .eq("status", "published")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Failed to load lesson plan" }, 500);
  }

  if (!data) {
    return jsonResponse({ error: "Lesson plan not found" }, 404);
  }

  if (data.pdf_url && typeof data.pdf_url === "string") {
    return new Response(null, {
      status: 302,
      headers: {
        Location: data.pdf_url,
      },
    });
  }

  const detail = mapRecordToDetail(data);
  const pdfBuffer = await renderLessonPlanToPdf(detail);

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${detail.slug}.pdf"`,
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
