import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../_lib/http";
import { getSupabaseClient } from "../_lib/supabase";
import { mergeResourceValues } from "../../types/lesson-builder";
import type { Resource } from "../../types/lesson-builder";

const LESSON_PLAN_TABLE = "lesson_plan_builder_plans";
const LESSON_PLAN_STEPS_TABLE = "lesson_plan_steps";

interface ActivityPayload {
  id: string;
  title?: string | null;
  url?: string | null;
  provider?: string | null;
  thumbnailUrl?: string | null;
  durationMinutes?: number | null;
  summary?: string | null;
  embedHtml?: string | null;
}

interface StepPayload {
  id?: string;
  position?: number | null;
  title?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
  activity?: ActivityPayload | null;
  resources?: (Resource | Record<string, unknown>)[] | null;
  learningGoals?: string[] | null;
  learning_goals?: string[] | null;
  grouping?: string | null;
  deliveryMode?: string | null;
  delivery_mode?: string | null;
  instructionalNote?: string | null;
  instructional_note?: string | null;
}

interface UpdatePayload {
  userId?: string;
  plan?: Record<string, unknown> | null;
  steps?: StepPayload[] | null;
}

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  const id = extractIdFromRequest(request);

  if (!id) {
    return errorResponse(400, "A lesson plan id is required");
  }

  if (method === "GET") {
    return handleGet(id);
  }

  if (method === "PATCH" || method === "PUT") {
    return handleUpdate(request, id);
  }

  return methodNotAllowed(["GET", "PATCH", "PUT"]);
}

async function handleGet(id: string): Promise<Response> {
  const supabase = getSupabaseClient();
  const planResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (planResult.error) {
    return errorResponse(500, "Failed to load lesson plan");
  }

  if (!planResult.data) {
    return errorResponse(404, "Lesson plan not found");
  }

  const stepsResult = await supabase
    .from(LESSON_PLAN_STEPS_TABLE)
    .select("*")
    .eq("lesson_plan_id", id)
    .order("position", { ascending: true, nullsFirst: false });

  if (stepsResult.error) {
    return errorResponse(500, "Failed to load lesson plan steps");
  }

  const plan = mapPlan(planResult.data);
  const steps = Array.isArray(stepsResult.data) ? stepsResult.data : [];

  return jsonResponse({
    plan,
    steps,
  });
}

async function handleUpdate(request: Request, id: string): Promise<Response> {
  const payload = (await parseJsonBody<UpdatePayload>(request)) ?? {};
  const supabase = getSupabaseClient();

  const planResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .select("id, share_access")
    .eq("id", id)
    .maybeSingle();

  if (planResult.error) {
    return errorResponse(500, "Failed to verify lesson plan access");
  }

  if (!planResult.data) {
    return errorResponse(404, "Lesson plan not found");
  }

  const shareAccess = planResult.data.share_access ?? "owner";
  if (!canEdit(shareAccess)) {
    return errorResponse(403, "You do not have permission to update this plan");
  }

  const updates: Record<string, unknown> = {};
  if (payload.plan && typeof payload.plan === "object") {
    for (const [key, value] of Object.entries(payload.plan)) {
      if (value === undefined) continue;
      if (key === "share_access") continue;
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length > 0) {
    const updateResult = await supabase
      .from(LESSON_PLAN_TABLE)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (updateResult.error) {
      return errorResponse(500, "Failed to update lesson plan");
    }
  }

  if (Array.isArray(payload.steps) && payload.steps.length > 0) {
    const normalizedSteps = payload.steps.map((step, index) =>
      mapStepPayload(id, step, index)
    );

    const upsertResult = await supabase
      .from(LESSON_PLAN_STEPS_TABLE)
      .upsert(normalizedSteps, { onConflict: "id" })
      .select("id");

    if (upsertResult.error) {
      return errorResponse(500, "Failed to update lesson plan steps");
    }
  }

  const refreshedPlan = await supabase
    .from(LESSON_PLAN_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (refreshedPlan.error || !refreshedPlan.data) {
    return errorResponse(500, "Failed to load updated lesson plan");
  }

  const refreshedSteps = await supabase
    .from(LESSON_PLAN_STEPS_TABLE)
    .select("*")
    .eq("lesson_plan_id", id)
    .order("position", { ascending: true, nullsFirst: false });

  if (refreshedSteps.error) {
    return errorResponse(500, "Failed to load updated lesson plan steps");
  }

  return jsonResponse({
    plan: mapPlan(refreshedPlan.data),
    steps: Array.isArray(refreshedSteps.data) ? refreshedSteps.data : [],
  });
}

function extractIdFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1];
    return id ? decodeURIComponent(id) : null;
  } catch {
    return null;
  }
}

function mapPlan(plan: Record<string, any>): Record<string, unknown> {
  const shareAccess = plan.share_access ?? "owner";
  return {
    ...plan,
    shareAccess,
    readOnly: !canEdit(shareAccess),
  };
}

function canEdit(shareAccess: string | null | undefined): boolean {
  return shareAccess === "owner" || shareAccess === "editor";
}

function mapStepPayload(
  planId: string,
  step: StepPayload,
  index: number
): Record<string, unknown> {
  const activity = step.activity ?? null;
  const title = sanitizeTitle(step.title, activity?.title);
  const duration =
    step.durationMinutes ?? activity?.durationMinutes ?? null;

  const resources = normalizeStepResources(step, activity);

  const learningGoals = Array.isArray(step.learningGoals)
    ? step.learningGoals
    : Array.isArray(step.learning_goals)
      ? step.learning_goals
      : [];
  const grouping = step.grouping ?? null;
  const deliveryMode = step.deliveryMode ?? step.delivery_mode ?? null;
  const instructionalNote =
    step.instructionalNote ?? step.instructional_note ?? null;

  return {
    id: step.id ?? undefined,
    lesson_plan_id: planId,
    position: step.position ?? index,
    title,
    duration_minutes: duration,
    notes: step.notes ?? null,
    resources,
    learning_goals: learningGoals.length > 0 ? learningGoals : null,
    grouping,
    delivery_mode: deliveryMode ?? null,
    instructional_note: instructionalNote ?? null,
    updated_at: new Date().toISOString(),
  };
}

function sanitizeTitle(
  provided: string | null | undefined,
  activityTitle: string | null | undefined
): string {
  const primary = provided ?? activityTitle ?? "Lesson step";
  return primary.trim().length > 0 ? primary.trim() : "Lesson step";
}

function normalizeStepResources(
  step: StepPayload,
  activity: ActivityPayload | null
): Resource[] {
  if (Array.isArray(step.resources) && step.resources.length > 0) {
    return step.resources
      .map((resource) => mergeResourceValues(resource ?? null))
      .filter((resource): resource is Resource => resource != null);
  }

  if (!activity) {
    return [];
  }

  return [
    mergeResourceValues({
      id: activity.id,
      source_id: activity.id,
      media_type: "activity",
      title: activity.title ?? null,
      summary: activity.summary ?? null,
      url: activity.url ?? null,
      provider: activity.provider ?? null,
      thumbnail_url: activity.thumbnailUrl ?? null,
      duration_minutes: activity.durationMinutes ?? null,
      embed_html: sanitizeEmbed(activity.embedHtml ?? null),
    }),
  ];
}

function sanitizeEmbed(embed: string | null): string | null {
  if (!embed) {
    return null;
  }

  const cleaned = embed.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  if (!/(<iframe|<blockquote)/i.test(cleaned)) {
    return null;
  }
  return cleaned.trim();
}
