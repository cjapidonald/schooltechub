import { supabase } from "@/integrations/supabase/client";

interface LessonPlanRecord {
  id: string;
  owner_id: string | null;
  title: string | null;
  subject: string | null;
  class_id: string | null;
  date: string | null;
  school_name: string | null;
  school_logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LessonPlanMeta {
  id: string;
  ownerId: string;
  title: string;
  subject: string | null;
  classId: string | null;
  date: string | null;
  schoolName: string | null;
  schoolLogoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

type LessonPlanInput = {
  title: string;
  subject?: string | null;
  classId?: string | null;
  date?: string | null;
  schoolName?: string | null;
  schoolLogoUrl?: string | null;
};

type LessonPlanPayload = Partial<LessonPlanInput>;

function mapLessonPlan(record: LessonPlanRecord): LessonPlanMeta {
  return {
    id: record.id,
    ownerId: record.owner_id ?? "",
    title: record.title ?? "Untitled lesson plan",
    subject: record.subject ?? null,
    classId: record.class_id ?? null,
    date: record.date ?? null,
    schoolName: record.school_name ?? null,
    schoolLogoUrl: record.school_logo_url ?? null,
    createdAt: record.created_at ?? new Date().toISOString(),
    updatedAt: record.updated_at ?? record.created_at ?? new Date().toISOString(),
  } satisfies LessonPlanMeta;
}

function buildPayload(input: LessonPlanPayload): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }
  if (input.subject !== undefined) {
    payload.subject = input.subject;
  }
  if (input.classId !== undefined) {
    payload.class_id = input.classId;
  }
  if (input.date !== undefined) {
    payload.date = input.date;
  }
  if (input.schoolName !== undefined) {
    payload.school_name = input.schoolName;
  }
  if (input.schoolLogoUrl !== undefined) {
    payload.school_logo_url = input.schoolLogoUrl;
  }

  return payload;
}

async function requireUserId(action: string): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error("We couldn't confirm your session. Please sign in again.", { cause: error });
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new Error(`You need to be signed in to ${action}.`);
  }

  return userId;
}

export async function createLessonPlan(input: LessonPlanInput): Promise<{ id: string }> {
  const userId = await requireUserId("create lesson plans");
  const payload = buildPayload(input);

  payload.owner_id = userId;

  const { data, error } = await supabase
    .from("lesson_plans")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error("We couldn't create the lesson plan. Please try again.", { cause: error });
  }

  if (!data?.id) {
    throw new Error("The lesson plan was created but we couldn't confirm its identifier.");
  }

  return { id: String(data.id) };
}

export async function updateLessonPlan(
  id: string,
  updates: Partial<LessonPlanInput>,
): Promise<void> {
  await requireUserId("update lesson plans");

  const payload = buildPayload(updates);

  if (Object.keys(payload).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("lesson_plans")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error("We couldn't update the lesson plan. Please try again.", { cause: error });
  }
}

export async function getLessonPlan(id: string): Promise<LessonPlanMeta | null> {
  await requireUserId("view lesson plans");

  const { data, error } = await supabase
    .from("lesson_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("We couldn't load the lesson plan right now. Please try again.", { cause: error });
  }

  if (!data) {
    return null;
  }

  return mapLessonPlan(data as LessonPlanRecord);
}
