import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Class, ClassStatus } from "@/types/platform";
import { logActivity } from "@/lib/activity-log";

// Re-export Class type so it can be imported from this module
export type { Class, ClassStatus } from "@/types/platform";

const CLASS_SELECT = "*";

type Client = SupabaseClient;

export class ClassDataError extends Error {
  declare cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ClassDataError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
    if (options?.cause instanceof Error && options.cause.message) {
      this.message = `${message} (${options.cause.message})`;
    }
  }
}

export interface ClassCreateInput {
  title: string;
  summary?: string | null;
  subject?: string | null;
  stage?: string | null;
  status?: ClassStatus | null;
  startDate?: string | null;
  endDate?: string | null;
  meetingSchedule?: string | null;
  meetingLink?: string | null;
  imageUrl?: string | null;
  maxCapacity?: number | null;
}

export interface ClassUpdateInput extends Partial<ClassCreateInput> {
  currentEnrollment?: number | null;
}

function mapClass(record: Record<string, any>): Class {
  return {
    id: String(record.id ?? ""),
    title: typeof record.title === "string" && record.title.length > 0
      ? record.title
      : typeof record.name === "string" && record.name.length > 0
        ? record.name
        : "Untitled class",
    summary: record.summary ?? record.description ?? null,
    subject: record.subject ?? null,
    stage: record.stage ?? record.level ?? null,
    status: (record.status as ClassStatus | null | undefined) ?? null,
    startDate: record.start_date ?? record.startDate ?? null,
    endDate: record.end_date ?? record.endDate ?? null,
    meetingSchedule: record.meeting_schedule ?? record.meetingSchedule ?? null,
    meetingLink: record.meeting_link ?? record.meetingLink ?? null,
    imageUrl: record.image_url ?? record.imageUrl ?? null,
    currentEnrollment:
      typeof record.current_enrollment === "number"
        ? record.current_enrollment
        : record.currentEnrollment ?? null,
    maxCapacity:
      typeof record.max_capacity === "number"
        ? record.max_capacity
        : record.maxCapacity ?? null,
    ownerId: record.owner_id ?? record.ownerId ?? record.instructor_id ?? null,
    createdAt: record.created_at ?? record.createdAt ?? null,
    updatedAt: record.updated_at ?? record.updatedAt ?? null,
  } satisfies Class;
}

export interface ClassWithPlanCount extends Class {
  planCount: number;
}

export interface ClassLessonPlanLinkSummary {
  /** Identifier of the linked lesson plan. */
  id: string;
  /** Title of the linked lesson plan. */
  title: string;
  /** Scheduled date for the lesson plan if available. */
  date: string | null;
  /** Planned duration for the lesson. */
  duration: string | null;
  /** Timestamp indicating when the plan was attached to the class. */
  addedAt: string | null;
}

async function requireUserId(client: Client, action: string): Promise<string> {
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw new ClassDataError("Unable to verify authentication state.", { cause: error });
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new ClassDataError(`You must be signed in to ${action}.`);
  }

  return userId;
}

function buildClassPayload(
  input: ClassCreateInput | ClassUpdateInput,
  userId?: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if ("title" in input && input.title !== undefined) {
    payload.title = input.title;
  }
  if ("summary" in input && input.summary !== undefined) {
    payload.description = input.summary;
  }
  if ("subject" in input && input.subject !== undefined) {
    payload.subject = input.subject;
  }
  if ("stage" in input && input.stage !== undefined) {
    payload.level = input.stage;
  }
  if ("status" in input && input.status !== undefined) {
    payload.status = input.status;
  }
  if ("startDate" in input && input.startDate !== undefined) {
    payload.start_date = input.startDate;
  }
  if ("endDate" in input && input.endDate !== undefined) {
    payload.end_date = input.endDate;
  }
  if ("meetingSchedule" in input && input.meetingSchedule !== undefined) {
    payload.meeting_schedule = input.meetingSchedule;
  }
  if ("meetingLink" in input && input.meetingLink !== undefined) {
    payload.meeting_link = input.meetingLink;
  }
  if ("imageUrl" in input && input.imageUrl !== undefined) {
    payload.image_url = input.imageUrl;
  }
  if ("maxCapacity" in input && input.maxCapacity !== undefined) {
    payload.max_capacity = input.maxCapacity;
  }
  if ("currentEnrollment" in input && input.currentEnrollment !== undefined) {
    payload.current_enrollment = input.currentEnrollment;
  }
  if (userId) {
    payload.owner_id = userId;
  }

  return payload;
}

export async function listMyClasses(client: Client = supabase): Promise<Class[]> {
  await requireUserId(client, "view classes");

  const { data, error } = await client
    .from("classes")
    .select(CLASS_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ClassDataError("Failed to load your classes.", { cause: error });
  }

  return Array.isArray(data) ? data.map(mapClass) : [];
}

export async function listMyClassesWithPlanCount(
  client: Client = supabase,
): Promise<ClassWithPlanCount[]> {
  await requireUserId(client, "view classes");

  const { data, error } = await client
    .from("classes")
    .select("*, class_lesson_plans ( id )")
    .order("created_at", { ascending: false });

  if (error) {
    throw new ClassDataError("Failed to load your classes.", { cause: error });
  }

  return Array.isArray(data)
    ? data.map(record => {
        const planLinks = Array.isArray(record.class_lesson_plans)
          ? record.class_lesson_plans
          : [];

        return {
          ...mapClass(record),
          planCount: planLinks.length,
        } satisfies ClassWithPlanCount;
      })
    : [];
}

export async function getClass(
  id: string,
  client: Client = supabase,
): Promise<Class | null> {
  await requireUserId(client, "view classes");

  const { data, error } = await client
    .from("classes")
    .select(CLASS_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ClassDataError("Failed to load the class.", { cause: error });
  }

  return data ? mapClass(data) : null;
}

export async function createClass(
  input: ClassCreateInput,
  client: Client = supabase,
): Promise<Class> {
  const userId = await requireUserId(client, "create classes");
  const payload = { ...buildClassPayload(input, userId) };

  const { data, error } = await client
    .from("classes")
    .insert(payload)
    .select(CLASS_SELECT)
    .single();

  if (error || !data) {
    throw new ClassDataError("Unable to create the class.", { cause: error });
  }

  const result = mapClass(data);
  const classTitle = result.title?.trim();
  logActivity("class-created", classTitle ? `Created class “${classTitle}”.` : "Created a new class.", {
    classId: result.id,
    classTitle: classTitle ?? undefined,
  });

  return result;
}

export async function updateClass(
  id: string,
  updates: ClassUpdateInput,
  client: Client = supabase,
): Promise<Class> {
  await requireUserId(client, "update classes");
  const payload = buildClassPayload(updates);

  if (Object.keys(payload).length === 0) {
    return (await getClass(id, client)) ?? (() => {
      throw new ClassDataError("Class not found.");
    })();
  }

  const { data, error } = await client
    .from("classes")
    .update(payload)
    .eq("id", id)
    .select(CLASS_SELECT)
    .single();

  if (error || !data) {
    throw new ClassDataError("Unable to update the class.", { cause: error });
  }

  return mapClass(data);
}

export async function deleteClass(
  id: string,
  client: Client = supabase,
): Promise<void> {
  await requireUserId(client, "delete classes");

  const { error } = await client.from("classes").delete().eq("id", id);

  if (error) {
    throw new ClassDataError("Unable to delete the class.", { cause: error });
  }
}

export async function linkPlanToClass(
  lessonPlanId: string,
  classId: string,
  client: Client = supabase,
): Promise<void> {
  const userId = await requireUserId(client, "link lesson plans to classes");

  const { error } = await client
    .from("class_lesson_plans")
    .insert({
      class_id: classId,
      lesson_plan_id: lessonPlanId,
      added_by: userId,
    });

  if (error) {
    throw new ClassDataError("Failed to link the lesson plan to the class.", {
      cause: error,
    });
  }
}

export async function unlinkPlanFromClass(
  lessonPlanId: string,
  classId: string,
  client: Client = supabase,
): Promise<void> {
  await requireUserId(client, "unlink lesson plans from classes");

  const { error } = await client
    .from("class_lesson_plans")
    .delete()
    .eq("class_id", classId)
    .eq("lesson_plan_id", lessonPlanId);

  if (error) {
    throw new ClassDataError("Failed to unlink the lesson plan from the class.", {
      cause: error,
    });
  }
}

export interface ClassLessonPlanFilterOptions {
  from?: string | Date | null;
  to?: string | Date | null;
}

function normalizeFilterDate(value?: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    if (Number.isNaN(timestamp)) {
      return null;
    }
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function listClassLessonPlans(
  classId: string,
  opts: ClassLessonPlanFilterOptions = {},
  client: Client = supabase,
): Promise<ClassLessonPlanLinkSummary[]> {
  await requireUserId(client, "view class lesson plans");

  const normalizedFrom = normalizeFilterDate(opts.from);
  const normalizedTo = normalizeFilterDate(opts.to);

  let query = client
    .from("class_lesson_plans")
    .select(
      `
        lesson_plan_id,
        added_at,
        lesson_plans!inner (
          id,
          title,
          date,
          duration
        )
      `,
    )
    .eq("class_id", classId);

  if (normalizedFrom) {
    query = query.gte("lesson_plans.date", normalizedFrom);
  }

  if (normalizedTo) {
    query = query.lte("lesson_plans.date", normalizedTo);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
    foreignTable: "lesson_plans",
  });

  if (error) {
    throw new ClassDataError("Failed to load lesson plans linked to the class.", {
      cause: error,
    });
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(record => {
      const lessonPlan = (record as Record<string, any>).lesson_plans ?? null;
      const lessonPlanTitle =
        lessonPlan && typeof lessonPlan.title === "string" && lessonPlan.title.length > 0
          ? lessonPlan.title
          : "Untitled lesson";

      const lessonPlanId =
        record.lesson_plan_id ?? (lessonPlan ? lessonPlan.id ?? null : null);

      return {
        id: lessonPlanId ? String(lessonPlanId) : "",
        title: lessonPlanTitle,
        date: (lessonPlan?.date as string | null | undefined) ?? null,
        duration: (lessonPlan?.duration as string | null | undefined) ?? null,
        addedAt: (record.added_at as string | null | undefined) ?? null,
      } satisfies ClassLessonPlanLinkSummary;
    })
    .sort((a, b) => {
      const aDate = a.date ?? "";
      const bDate = b.date ?? "";

      if (aDate !== bDate) {
        return aDate > bDate ? -1 : 1;
      }

      const aAdded = a.addedAt ?? "";
      const bAdded = b.addedAt ?? "";
      return aAdded > bAdded ? -1 : aAdded < bAdded ? 1 : 0;
    });
}
