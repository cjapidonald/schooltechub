import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { getSupabaseClient } from "../../_lib/supabase";

const LESSON_PLAN_TABLE = "lesson_plan_builder_plans";
const LESSON_PLAN_STEPS_TABLE = "lesson_plan_steps";
const VERSION_TABLE = "lesson_plan_versions";

interface VersionPayload {
  userId?: string;
  label?: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  const id = extractIdFromRequest(request);

  if (!id) {
    return errorResponse(400, "A lesson plan id is required");
  }

  if (method === "GET") {
    return handleList(id);
  }

  if (method === "POST") {
    return handleCreate(request, id);
  }

  return methodNotAllowed(["GET", "POST"]);
}

async function handleList(id: string): Promise<Response> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(VERSION_TABLE)
    .select("id, label, created_at, created_by")
    .eq("lesson_plan_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return errorResponse(500, "Failed to load lesson plan versions");
  }

  return jsonResponse({ versions: data ?? [] });
}

async function handleCreate(request: Request, id: string): Promise<Response> {
  const payload = (await parseJsonBody<VersionPayload>(request)) ?? {};
  if (!payload.userId) {
    return errorResponse(400, "A userId is required to create a version");
  }

  const supabase = getSupabaseClient();
  const accessResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .select("id, share_access")
    .eq("id", id)
    .maybeSingle();

  if (accessResult.error) {
    return errorResponse(500, "Failed to verify lesson plan access");
  }

  if (!accessResult.data) {
    return errorResponse(404, "Lesson plan not found");
  }

  if (!canSnapshot(accessResult.data.share_access)) {
    return errorResponse(403, "You do not have permission to snapshot this plan");
  }

  const planResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (planResult.error || !planResult.data) {
    return errorResponse(500, "Failed to load lesson plan");
  }

  const stepsResult = await supabase
    .from(LESSON_PLAN_STEPS_TABLE)
    .select("*")
    .eq("lesson_plan_id", id)
    .order("position", { ascending: true });

  if (stepsResult.error) {
    return errorResponse(500, "Failed to load lesson plan steps");
  }

  const snapshot = {
    plan: planResult.data,
    steps: stepsResult.data ?? [],
  };

  const now = new Date().toISOString();
  const insertResult = await supabase
    .from(VERSION_TABLE)
    .insert({
      lesson_plan_id: id,
      label: payload.label ?? null,
      snapshot,
      created_by: payload.userId,
      created_at: now,
    })
    .select("*")
    .single();

  if (insertResult.error || !insertResult.data) {
    return errorResponse(500, "Failed to create version snapshot");
  }

  return jsonResponse({ version: insertResult.data }, 201);
}

function extractIdFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 2];
    return id ? decodeURIComponent(id) : null;
  } catch {
    return null;
  }
}

function canSnapshot(shareAccess: string | null | undefined): boolean {
  return shareAccess === "owner" || shareAccess === "editor";
}
