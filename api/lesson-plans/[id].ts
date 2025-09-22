import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../_lib/http";
import { getSupabaseClient } from "../_lib/supabase";

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
  resources?: unknown[] | null;
}

interface UpdatePayload {
  plan?: Record<string, unknown> | null;
  steps?: StepPayload[] | null;
}

type SupabaseClientLike = ReturnType<typeof getSupabaseClient>;

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  const id = extractIdFromRequest(request);

  if (!id) {
    return errorResponse(400, "A lesson plan id is required");
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(401, "Authentication required");
  }

  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !authData?.user?.id) {
    return errorResponse(401, "Authentication required");
  }

  const userId = authData.user.id;

  if (method === "GET") {
    return handleGet(supabase, id, userId);
  }

  if (method === "PATCH" || method === "PUT") {
    return handleUpdate(request, supabase, id, userId);
  }

  return methodNotAllowed(["GET", "PATCH", "PUT"]);
}

async function handleGet(
  supabase: SupabaseClientLike,
  id: string,
  userId: string
): Promise<Response> {
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

  const plan = planResult.data;
  const shareAccess = plan.share_access ?? "owner";
  const isOwner = plan.owner_id === userId;

  if (!canViewPlan(shareAccess, isOwner)) {
    return errorResponse(403, "You do not have permission to view this plan");
  }

  const stepsResult = await supabase
    .from(LESSON_PLAN_STEPS_TABLE)
    .select("*")
    .eq("lesson_plan_id", id)
    .order("position", { ascending: true, nullsFirst: false });

  if (stepsResult.error) {
    return errorResponse(500, "Failed to load lesson plan steps");
  }

  const steps = Array.isArray(stepsResult.data) ? stepsResult.data : [];

  return jsonResponse({
    plan: mapPlan(plan, userId),
    steps,
  });
}

async function handleUpdate(
  request: Request,
  supabase: SupabaseClientLike,
  id: string,
  userId: string
): Promise<Response> {
  const payload = (await parseJsonBody<UpdatePayload>(request)) ?? {};

  const planResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .select("id, owner_id, share_access")
    .eq("id", id)
    .maybeSingle();

  if (planResult.error) {
    return errorResponse(500, "Failed to verify lesson plan access");
  }

  if (!planResult.data) {
    return errorResponse(404, "Lesson plan not found");
  }

  const shareAccess = planResult.data.share_access ?? "owner";
  const isOwner = planResult.data.owner_id === userId;
  if (!canEditPlan(shareAccess, isOwner)) {
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
    plan: mapPlan(refreshedPlan.data, userId),
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

function mapPlan(plan: Record<string, any>, userId: string): Record<string, unknown> {
  const shareAccess = plan.share_access ?? "owner";
  const isOwner = plan.owner_id === userId;
  return {
    ...plan,
    shareAccess,
    readOnly: !canEditPlan(shareAccess, isOwner),
  };
}

function canViewPlan(shareAccess: string | null | undefined, isOwner: boolean): boolean {
  if (isOwner) {
    return true;
  }
  return shareAccess === "viewer" || shareAccess === "editor";
}

function canEditPlan(shareAccess: string | null | undefined, isOwner: boolean): boolean {
  if (isOwner) {
    return true;
  }
  return shareAccess === "editor";
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

  const resources = buildResourceSnapshot(step, activity);

  return {
    id: step.id ?? undefined,
    lesson_plan_id: planId,
    position: step.position ?? index,
    title,
    duration_minutes: duration,
    notes: step.notes ?? null,
    resources,
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

function buildResourceSnapshot(
  step: StepPayload,
  activity: ActivityPayload | null
): unknown[] {
  if (!activity) {
    return step.resources ?? [];
  }

  const snapshot = {
    type: "activity",
    activityId: activity.id,
    title: activity.title ?? null,
    url: activity.url ?? null,
    provider: activity.provider ?? null,
    thumbnailUrl: activity.thumbnailUrl ?? null,
    durationMinutes: activity.durationMinutes ?? null,
    summary: activity.summary ?? null,
    embedHtml: sanitizeEmbed(activity.embedHtml ?? null),
  };

  return [snapshot];
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

function extractAccessToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (header) {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const cookieHeader = request.headers.get("cookie") ?? request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";");
    for (const rawCookie of cookies) {
      const [name, ...rest] = rawCookie.trim().split("=");
      if (name === "sb-access-token") {
        return decodeURIComponent(rest.join("="));
      }
    }
  }

  return null;
}
