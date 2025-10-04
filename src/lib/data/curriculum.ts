import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurriculumItem, CurriculumLessonLink } from "@/types/platform";

const randomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

type Client = SupabaseClient;

const toStringOrNull = (value: unknown): string | null => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const DEMO_CURRICULUM: CurriculumItem[] = [
  {
    id: "demo-curriculum-1",
    classId: "demo-class-1",
    title: "Forces and Motion",
    stage: "Primary",
    subject: "Science",
    week: 5,
    topic: "Physics basics",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-curriculum-2",
    classId: "demo-class-1",
    title: "Narrative Writing",
    stage: "Primary",
    subject: "English",
    week: 6,
    topic: "Story arcs",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_LINKS: CurriculumLessonLink[] = [
  {
    id: "demo-link-1",
    curriculumItemId: "demo-curriculum-1",
    lessonPlanId: "demo-plan-1",
    status: "draft",
    viewUrl: null,
    createdAt: new Date().toISOString(),
  },
];

function isTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "42P01" || code === "42703";
}

function mapCurriculum(record: Record<string, unknown>): CurriculumItem {
  const classId = record.class_id ?? record.classId ?? "";
  const stage = toStringOrNull(record.stage) ?? toStringOrNull(record.level);
  const subject = toStringOrNull(record.subject);
  const week = toNumberOrNull(record.week);
  const topic = toStringOrNull(record.topic) ?? toStringOrNull(record.focus);
  const date = toStringOrNull(record.date) ?? toStringOrNull(record.scheduled_for);
  const createdAt = toStringOrNull(record.created_at) ?? toStringOrNull(record.createdAt);
  const updatedAt = toStringOrNull(record.updated_at) ?? toStringOrNull(record.updatedAt);

  return {
    id: String(record.id ?? randomId()),
    classId: String(classId ?? ""),
    title: toStringOrNull(record.title) ?? "Untitled lesson",
    stage,
    subject,
    week,
    topic,
    date,
    createdAt,
    updatedAt,
  } satisfies CurriculumItem;
}

function mapLink(record: Record<string, unknown>): CurriculumLessonLink {
  const statusValue = toStringOrNull(record.status);
  return {
    id: String(record.id ?? randomId()),
    curriculumItemId: String(record.curriculum_item_id ?? record.curriculumItemId ?? ""),
    lessonPlanId: String(record.lesson_plan_id ?? record.lessonPlanId ?? ""),
    status: statusValue === "published" || statusValue === "archived" ? statusValue : "draft",
    viewUrl: toStringOrNull(record.view_url) ?? toStringOrNull(record.viewUrl),
    createdAt: toStringOrNull(record.created_at) ?? toStringOrNull(record.createdAt),
  } satisfies CurriculumLessonLink;
}

export async function listCurriculumItems(client: Client = supabase): Promise<CurriculumItem[]> {
  const { data, error } = await client
    .from("curriculum_items")
    .select("*")
    .order("date", { ascending: true, nullsFirst: false });

  if (error) {
    if (isTableMissing(error)) {
      console.warn("curriculum_items table missing, returning demo curriculum", error);
      return DEMO_CURRICULUM;
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapCurriculum);
}

export async function saveCurriculumItem(
  input: Partial<CurriculumItem> & { classId: string; title: string },
  client: Client = supabase,
): Promise<CurriculumItem> {
  const payload = {
    id: input.id ?? undefined,
    class_id: input.classId,
    title: input.title,
    stage: input.stage ?? null,
    subject: input.subject ?? null,
    week: input.week ?? null,
    topic: input.topic ?? null,
    date: input.date ?? null,
  };

  const query = input.id
    ? client.from("curriculum_items").update(payload).eq("id", input.id).select().maybeSingle()
    : client.from("curriculum_items").insert(payload).select().maybeSingle();

  const { data, error } = await query;

  if (error) {
    if (isTableMissing(error)) {
      console.warn("curriculum_items table missing, returning demo curriculum item", error);
      return mapCurriculum({ ...payload, id: input.id ?? randomId(), created_at: new Date().toISOString() });
    }
    throw error;
  }

  return mapCurriculum(data ?? payload);
}

export async function linkCurriculumToLesson(
  input: { curriculumItemId: string; lessonPlanId: string; viewUrl?: string | null; status?: CurriculumLessonLink["status"]; },
  client: Client = supabase,
): Promise<CurriculumLessonLink> {
  const payload = {
    curriculum_item_id: input.curriculumItemId,
    lesson_plan_id: input.lessonPlanId,
    view_url: input.viewUrl ?? null,
    status: input.status ?? "draft",
  };

  const { data, error } = await client
    .from("curriculum_lessons")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    if (isTableMissing(error)) {
      console.warn("curriculum_lessons table missing, returning demo link", error);
      return mapLink({ ...payload, id: randomId(), created_at: new Date().toISOString() });
    }
    throw error;
  }

  return mapLink(data ?? payload);
}

export function getDemoCurriculumLinks(): CurriculumLessonLink[] {
  return DEMO_LINKS;
}

export async function listCurriculumLessonLinks(client: Client = supabase): Promise<CurriculumLessonLink[]> {
  const { data, error } = await client
    .from("curriculum_lessons")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    if (isTableMissing(error)) {
      console.warn("curriculum_lessons table missing, returning demo curriculum lesson links", error);
      return DEMO_LINKS;
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapLink);
}

export async function upsertCurriculumLessonLink(
  input: {
    id?: string | null;
    curriculumItemId: string;
    lessonPlanId: string;
    viewUrl?: string | null;
    status?: CurriculumLessonLink["status"];
  },
  client: Client = supabase,
): Promise<CurriculumLessonLink> {
  const payload = {
    id: input.id ?? undefined,
    curriculum_item_id: input.curriculumItemId,
    lesson_plan_id: input.lessonPlanId,
    view_url: input.viewUrl ?? null,
    status: input.status ?? "draft",
  };

  const query = input.id
    ? client.from("curriculum_lessons").update(payload).eq("id", input.id).select().maybeSingle()
    : client
        .from("curriculum_lessons")
        .upsert(payload, { onConflict: "curriculum_item_id" })
        .select()
        .maybeSingle();

  const { data, error } = await query;

  if (error) {
    if (isTableMissing(error)) {
      console.warn("curriculum_lessons table missing, returning demo curriculum lesson link", error);
      return mapLink({ ...payload, id: input.id ?? randomId(), created_at: new Date().toISOString() });
    }
    throw error;
  }

  return mapLink(data ?? payload);
}

export async function deleteCurriculumLessonLink(id: string, client: Client = supabase): Promise<void> {
  const { error } = await client.from("curriculum_lessons").delete().eq("id", id);

  if (error) {
    if (isTableMissing(error)) {
      console.warn("curriculum_lessons table missing, skipping delete", error);
      return;
    }
    throw error;
  }
}

export async function deleteCurriculumItem(id: string, client: Client = supabase): Promise<void> {
  const { error } = await client.from("curriculum_items").delete().eq("id", id);

  if (error) {
    if (isTableMissing(error)) {
      console.warn("curriculum_items table missing, skipping delete", error);
      return;
    }
    throw error;
  }
}
