import type { LessonPlanRecord } from "../../../types/lesson-plans";
import {
  mapRecordToDetail,
  mapRecordToListItem,
  parseRequestUrl,
} from "../../_lib/lesson-plan-helpers";
import { getSupabaseClient } from "../../_lib/supabase";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type SharePayload = {
  shareAccess: string;
};

export default async function handler(request: Request): Promise<Response> {
  const method = request.method?.toUpperCase() ?? "GET";

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const { url, id } = parseRequest(request);
  if (!id) {
    return jsonResponse({ error: "Lesson plan not found" }, 404);
  }

  const supabase = getSupabaseClient();

  if (method === "GET") {
    const { data, error } = await supabase
      .from<LessonPlanRecord>("lesson_plans")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load lesson plan", error);
      return jsonResponse({ error: "Failed to load share settings" }, 500);
    }

    if (!data) {
      return jsonResponse({ error: "Lesson plan not found" }, 404);
    }

    const item = mapRecordToListItem(data);
    return jsonResponse({
      shareAccess: item.shareAccess,
      viewerRole: item.viewerRole,
      canEdit: item.canEdit,
    });
  }

  if (method !== "POST") {
    return new Response(null, {
      status: 405,
      headers: { ...CORS_HEADERS, Allow: "GET,POST,OPTIONS" },
    });
  }

  let payload: SharePayload;
  try {
    payload = (await request.json()) as SharePayload;
  } catch (error) {
    return jsonResponse({ error: "Invalid share payload" }, 400);
  }

  const shareAccess = normalizeShareAccess(payload.shareAccess);
  if (!shareAccess) {
    return jsonResponse({ error: "Unsupported share access" }, 400);
  }

  const { data, error } = await supabase
    .from<LessonPlanRecord>("lesson_plans")
    .update({ share_access: shareAccess })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Failed to update share settings", error);
    return jsonResponse({ error: "Failed to update share settings" }, 500);
  }

  if (!data) {
    return jsonResponse({ error: "Lesson plan not found" }, 404);
  }

  const detail = mapRecordToDetail(data);
  return jsonResponse({
    shareAccess: detail.shareAccess,
    viewerRole: detail.viewerRole,
    canEdit: detail.canEdit,
  });
}

function parseRequest(request: Request): { url: URL; id: string | null } {
  const url = parseRequestUrl(request);
  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments.pop();
  if (last?.toLowerCase() !== "share") {
    return { url, id: null };
  }
  const id = segments.pop() ?? null;
  return { url, id };
}

function normalizeShareAccess(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (["private", "link", "org", "public"].includes(normalized)) {
    return normalized;
  }
  if (normalized === "organization" || normalized === "organisation") {
    return "org";
  }
  if (normalized === "shared") {
    return "link";
  }
  return null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

