import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Class, ClassStatus } from "@/types/platform";

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
    .order("created_at", { ascending: false, nullsLast: true });

  if (error) {
    throw new ClassDataError("Failed to load your classes.", { cause: error });
  }

  return Array.isArray(data) ? data.map(mapClass) : [];
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

  return mapClass(data);
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
