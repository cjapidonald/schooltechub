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

interface DuplicatePayload {
  userId?: string;
  title?: string;
}

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  const id = extractIdFromRequest(request);

  if (!id) {
    return errorResponse(400, "A lesson plan id is required");
  }

  if (method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  return handleDuplicate(request, id);
}

async function handleDuplicate(request: Request, id: string): Promise<Response> {
  const payload = (await parseJsonBody<DuplicatePayload>(request)) ?? {};
  if (!payload.userId) {
    return errorResponse(400, "A userId is required to duplicate a lesson plan");
  }

  const supabase = getSupabaseClient();
  const planResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (planResult.error) {
    return errorResponse(500, "Failed to load lesson plan");
  }

  const sourcePlan = planResult.data;
  if (!sourcePlan) {
    return errorResponse(404, "Lesson plan not found");
  }

  if (!canDuplicate(sourcePlan.share_access)) {
    return errorResponse(403, "You do not have permission to duplicate this plan");
  }

  const stepsResult = await supabase
    .from(LESSON_PLAN_STEPS_TABLE)
    .select("*")
    .eq("lesson_plan_id", id)
    .order("position", { ascending: true });

  if (stepsResult.error) {
    return errorResponse(500, "Failed to load lesson plan steps");
  }

  const now = new Date().toISOString();
  const insertResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .insert({
      title: payload.title?.trim() || `${sourcePlan.title} (Copy)`,
      summary: sourcePlan.summary ?? null,
      subject: sourcePlan.subject ?? null,
      stage: sourcePlan.stage ?? null,
      duration_minutes: sourcePlan.duration_minutes ?? null,
      owner_id: payload.userId,
      share_access: "owner",
      metadata: sourcePlan.metadata ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (insertResult.error || !insertResult.data) {
    return errorResponse(500, "Failed to duplicate lesson plan");
  }

  const newPlan = insertResult.data;
  const steps = Array.isArray(stepsResult.data) ? stepsResult.data : [];
  if (steps.length > 0) {
    const clonedSteps = steps.map((step: Record<string, unknown>, index) => ({
      lesson_plan_id: newPlan.id,
      position: step.position ?? index,
      title: step.title ?? null,
      duration_minutes: step.duration_minutes ?? null,
      notes: step.notes ?? null,
      resources: step.resources ?? [],
      created_at: now,
      updated_at: now,
    }));

    const stepInsert = await supabase
      .from(LESSON_PLAN_STEPS_TABLE)
      .insert(clonedSteps)
      .select("id");

    if (stepInsert.error) {
      return errorResponse(500, "Failed to duplicate lesson plan steps");
    }
  }

  return jsonResponse({
    plan: {
      ...newPlan,
      shareAccess: "owner",
      readOnly: false,
    },
  }, 201);
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

function canDuplicate(shareAccess: string | null | undefined): boolean {
  return shareAccess === "owner" || shareAccess === "editor";
}
