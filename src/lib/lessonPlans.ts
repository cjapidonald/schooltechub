import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LessonPlan, LessonStep } from "@/types/platform";

const LESSON_PLAN_SELECT = "*";
const LESSON_STEP_SELECT = "*";

type Client = SupabaseClient;

export class LessonPlanDataError extends Error {
  declare cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "LessonPlanDataError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
    if (options?.cause instanceof Error && options.cause.message) {
      this.message = `${message} (${options.cause.message})`;
    }
  }
}

export interface LessonStepInput {
  id?: string;
  position?: number | null;
  title?: string | null;
  notes?: string | null;
  resourceIds?: string[] | null;
}

export interface LessonPlanDraft {
  id?: string;
  title: string;
  date?: string | null;
  duration?: string | null;
  grouping?: string | null;
  deliveryMode?: string | null;
  logoUrl?: string | null;
  meta?: Record<string, unknown> | null;
  steps?: LessonStepInput[];
}

export interface LessonPlanWithSteps {
  plan: LessonPlan;
  steps: LessonStep[];
}

async function requireUserId(client: Client, action: string): Promise<string> {
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw new LessonPlanDataError("Unable to verify authentication state.", {
      cause: error,
    });
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new LessonPlanDataError(`You must be signed in to ${action}.`);
  }

  return userId;
}

function mapLessonPlan(record: Record<string, any>): LessonPlan {
  return {
    id: String(record.id ?? ""),
    ownerId: record.owner_id ?? record.ownerId ?? "",
    title: typeof record.title === "string" && record.title.length > 0
      ? record.title
      : "Untitled lesson",
    date: record.date ?? record.lesson_date ?? null,
    duration:
      typeof record.duration === "string"
        ? record.duration
        : typeof record.duration_minutes === "number"
          ? `${record.duration_minutes} minutes`
          : null,
    grouping: record.grouping ?? null,
    deliveryMode: record.delivery_mode ?? null,
    logoUrl: record.logo_url ?? record.school_logo_url ?? null,
    meta:
      record.meta && typeof record.meta === "object"
        ? (record.meta as Record<string, unknown>)
        : {},
    createdAt: record.created_at ?? new Date().toISOString(),
    updatedAt: record.updated_at ?? record.created_at ?? new Date().toISOString(),
  } satisfies LessonPlan;
}

function mapLessonStep(record: Record<string, any>): LessonStep {
  const rawResourceIds = record.resource_ids ?? record.resourceIds;

  return {
    id: String(record.id ?? ""),
    lessonPlanId: record.lesson_plan_id ?? record.lessonPlanId ?? "",
    position: typeof record.position === "number" ? record.position : null,
    title: record.title ?? null,
    notes: record.notes ?? null,
    resourceIds: Array.isArray(rawResourceIds)
      ? rawResourceIds.filter((value: unknown): value is string => typeof value === "string")
      : [],
  } satisfies LessonStep;
}

function buildPlanPayload(
  draft: LessonPlanDraft,
  ownerId?: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (draft.title !== undefined) {
    payload.title = draft.title;
  }
  if (draft.date !== undefined) {
    payload.date = draft.date;
  }
  if (draft.duration !== undefined) {
    payload.duration = draft.duration;
  }
  if (draft.grouping !== undefined) {
    payload.grouping = draft.grouping;
  }
  if (draft.deliveryMode !== undefined) {
    payload.delivery_mode = draft.deliveryMode;
  }
  if (draft.logoUrl !== undefined) {
    payload.logo_url = draft.logoUrl;
  }
  if (draft.meta !== undefined && draft.meta !== null) {
    payload.meta = draft.meta;
  }
  if (ownerId) {
    payload.owner_id = ownerId;
  }

  return payload;
}

function normaliseSteps(planId: string, steps: LessonStepInput[]): Record<string, unknown>[] {
  return steps.map((step, index) => {
    const resourceIds = Array.isArray(step.resourceIds)
      ? step.resourceIds.filter((value): value is string => typeof value === "string")
      : [];

    return {
      id: step.id ?? crypto.randomUUID(),
      lesson_plan_id: planId,
      position: step.position ?? index,
      title: step.title ?? null,
      notes: step.notes ?? null,
      resource_ids: resourceIds,
    };
  });
}

export async function saveDraft(
  draft: LessonPlanDraft,
  client: Client = supabase,
): Promise<LessonPlanWithSteps> {
  const userId = await requireUserId(client, "save lesson plans");
  const payload = buildPlanPayload(draft, draft.id ? undefined : userId);

  let planId = draft.id ?? null;

  if (planId) {
    if (Object.keys(payload).length > 0) {
      const { data, error } = await client
        .from("lesson_plans")
        .update(payload)
        .eq("id", planId)
        .select(LESSON_PLAN_SELECT)
        .single();

      if (error || !data) {
        throw new LessonPlanDataError("Failed to update the lesson plan.", { cause: error });
      }
    }
  } else {
    const { data, error } = await client
      .from("lesson_plans")
      .insert({ ...payload, owner_id: userId })
      .select(LESSON_PLAN_SELECT)
      .single();

    if (error || !data) {
      throw new LessonPlanDataError("Failed to create the lesson plan.", { cause: error });
    }

    planId = String(data.id);
  }

  if (!planId) {
    throw new LessonPlanDataError("Lesson plan id could not be determined after saving.");
  }

  if (Array.isArray(draft.steps) && draft.steps.length > 0) {
    const stepPayload = normaliseSteps(planId, draft.steps);
    const { error } = await client
      .from("lesson_plan_steps")
      .upsert(stepPayload, { onConflict: "id" });

    if (error) {
      throw new LessonPlanDataError("Failed to save lesson plan steps.", { cause: error });
    }
  }

  const result = await getPlanWithSteps(planId, client, userId);

  if (!result) {
    throw new LessonPlanDataError("Lesson plan could not be reloaded after saving.");
  }

  return result;
}

export async function getMyPlans(
  client: Client = supabase,
): Promise<LessonPlan[]> {
  const userId = await requireUserId(client, "view lesson plans");

  const { data, error } = await client
    .from("lesson_plans")
    .select(LESSON_PLAN_SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false, nullsLast: true });

  if (error) {
    throw new LessonPlanDataError("Failed to load your lesson plans.", { cause: error });
  }

  return Array.isArray(data) ? data.map(mapLessonPlan) : [];
}

export async function getPlanWithSteps(
  id: string,
  client: Client = supabase,
  currentUserId?: string,
): Promise<LessonPlanWithSteps | null> {
  const userId = currentUserId ?? (await requireUserId(client, "view lesson plans"));

  const { data: planData, error: planError } = await client
    .from("lesson_plans")
    .select(LESSON_PLAN_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (planError) {
    throw new LessonPlanDataError("Failed to load the lesson plan.", { cause: planError });
  }

  if (!planData) {
    return null;
  }

  if (planData.owner_id !== userId) {
    // RLS should already enforce this, but provide a clearer message just in case.
    throw new LessonPlanDataError("You do not have access to this lesson plan.");
  }

  const { data: stepData, error: stepError } = await client
    .from("lesson_plan_steps")
    .select(LESSON_STEP_SELECT)
    .eq("lesson_plan_id", id)
    .order("position", { ascending: true, nullsFirst: false });

  if (stepError) {
    throw new LessonPlanDataError("Failed to load lesson plan steps.", { cause: stepError });
  }

  const plan = mapLessonPlan(planData);
  const steps = Array.isArray(stepData) ? stepData.map(mapLessonStep) : [];

  return { plan, steps } satisfies LessonPlanWithSteps;
}

function renderLessonPlan(plan: LessonPlan, steps: LessonStep[]): string {
  const parts: string[] = [];
  parts.push(`# ${plan.title}`);

  if (plan.date) {
    parts.push(`Date: ${plan.date}`);
  }
  if (plan.duration) {
    parts.push(`Duration: ${plan.duration}`);
  }
  if (plan.grouping) {
    parts.push(`Grouping: ${plan.grouping}`);
  }
  if (plan.deliveryMode) {
    parts.push(`Delivery mode: ${plan.deliveryMode}`);
  }
  parts.push("");

  steps
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .forEach((step, index) => {
      const title = step.title ?? `Step ${index + 1}`;
      parts.push(`${index + 1}. ${title}`);
      if (step.notes) {
        parts.push(step.notes);
      }
      if (step.resourceIds.length > 0) {
        parts.push(`Resources: ${step.resourceIds.join(", ")}`);
      }
      parts.push("");
    });

  return parts.join("\n");
}

export async function exportPlanToPDF(
  id: string,
  client: Client = supabase,
): Promise<Blob> {
  const result = await getPlanWithSteps(id, client);

  if (!result) {
    throw new LessonPlanDataError("Lesson plan not found.");
  }

  const content = renderLessonPlan(result.plan, result.steps);
  return new Blob([content], { type: "application/pdf" });
}

export async function exportPlanToDocx(
  id: string,
  client: Client = supabase,
): Promise<Blob> {
  const result = await getPlanWithSteps(id, client);

  if (!result) {
    throw new LessonPlanDataError("Lesson plan not found.");
  }

  const content = renderLessonPlan(result.plan, result.steps);
  return new Blob([content], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
