import type {
  LessonPlanRecord,
  LessonPlanVersion,
} from "../../../types/lesson-plans";
import {
  mapRecordToDetail,
  parseRequestUrl,
} from "../../_lib/lesson-plan-helpers";
import { getSupabaseClient } from "../../_lib/supabase";

interface PlanVersionRecord {
  id: string;
  plan_id: string;
  snapshot: unknown;
  created_at: string;
  created_by: string | null;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type RollbackPayload = {
  versionId: string;
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
      .from<PlanVersionRecord>("plan_versions")
      .select("id, plan_id, snapshot, created_at, created_by")
      .eq("plan_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load plan versions", error);
      return jsonResponse({ error: "Failed to load plan versions" }, 500);
    }

    const versions: LessonPlanVersion[] = (data ?? []).map((version) => ({
      id: version.id,
      planId: version.plan_id,
      snapshot: version.snapshot,
      createdAt: version.created_at,
      createdBy: version.created_by,
    }));

    return jsonResponse({ versions });
  }

  if (method !== "POST") {
    return new Response(null, {
      status: 405,
      headers: { ...CORS_HEADERS, Allow: "GET,POST,OPTIONS" },
    });
  }

  let payload: RollbackPayload;
  try {
    payload = (await request.json()) as RollbackPayload;
  } catch (error) {
    return jsonResponse({ error: "Invalid rollback payload" }, 400);
  }

  if (!payload.versionId) {
    return jsonResponse({ error: "Version ID is required" }, 400);
  }

  const { data: version, error: versionError } = await supabase
    .from<PlanVersionRecord>("plan_versions")
    .select("id, plan_id, snapshot, created_at, created_by")
    .eq("id", payload.versionId)
    .eq("plan_id", id)
    .maybeSingle();

  if (versionError) {
    console.error("Failed to load plan version", versionError);
    return jsonResponse({ error: "Failed to load plan version" }, 500);
  }

  if (!version) {
    return jsonResponse({ error: "Plan version not found" }, 404);
  }

  const patch = buildLessonPlanPatch(version.snapshot);
  if (Object.keys(patch).length === 0) {
    return jsonResponse({ error: "Version snapshot is empty" }, 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from<LessonPlanRecord>("lesson_plans")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updateError) {
    console.error("Failed to apply plan version", updateError);
    return jsonResponse({ error: "Failed to restore plan version" }, 500);
  }

  if (!updated) {
    return jsonResponse({ error: "Lesson plan not found" }, 404);
  }

  const detail = mapRecordToDetail(updated);
  return jsonResponse({ lesson: detail, restoredVersionId: version.id });
}

function parseRequest(request: Request): { url: URL; id: string | null } {
  const url = parseRequestUrl(request);
  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments.pop();
  if (last?.toLowerCase() !== "versions") {
    return { url, id: null };
  }
  const id = segments.pop() ?? null;
  return { url, id };
}

function buildLessonPlanPatch(snapshot: unknown): Partial<LessonPlanRecord> {
  if (!snapshot || typeof snapshot !== "object") {
    return {};
  }

  const record = snapshot as Record<string, unknown>;
  const patch: Partial<LessonPlanRecord> = {};
  const allowedKeys: Array<keyof LessonPlanRecord> = [
    "title",
    "summary",
    "overview",
    "content",
    "resources",
    "activities",
    "materials",
    "objectives",
    "standards",
    "duration_minutes",
    "tags",
    "grade_levels",
    "subject",
    "status",
  ];

  for (const key of allowedKeys) {
    if (key in record) {
      (patch as Record<string, unknown>)[key] = record[key];
    }
  }

  return patch;
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

