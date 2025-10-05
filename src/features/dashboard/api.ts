import { supabase } from "@/integrations/supabase/client";
import type {
  Class,
  Curriculum,
  CurriculumItem,
  LessonPlan,
  Profile,
  Resource,
} from "../../../types/supabase-tables";
import {
  DASHBOARD_EXAMPLE_CLASS,
  DASHBOARD_EXAMPLE_CURRICULUM,
  DASHBOARD_EXAMPLE_CURRICULUM_ITEMS,
  type DashboardCurriculumItem,
} from "./examples";

export type LessonPlanWithRelations = LessonPlan & {
  class?: Class | null;
  curriculum_item?: (CurriculumItem & { curriculum?: Curriculum | null }) | null;
};

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,salutation,first_name,last_name,display_name,avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile", error);
    throw error;
  }

  return data;
}

export async function fetchMyClasses(userId: string): Promise<Class[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("id,title,stage,subject,start_date,end_date")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load classes", error);
    throw error;
  }

  return data ?? [];
}

export async function createClass(input: {
  ownerId: string;
  title: string;
  stage?: string;
  subject?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Class> {
  const { data, error } = await supabase
    .from("classes")
    .insert({
      owner_id: input.ownerId,
      title: input.title,
      stage: input.stage ?? null,
      subject: input.subject ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
    })
    .select("id,title,stage,subject,start_date,end_date")
    .single();

  if (error) {
    console.error("Failed to create class", error);
    throw error;
  }

  return data;
}

export async function fetchCurricula(
  userId: string,
): Promise<Array<Curriculum & { class: Class | null; items_count: number; created_at?: string }>> {
  const { data, error } = await supabase
    .from("curricula")
    .select(
      "id,title,subject,academic_year,class_id,created_at,classes(id,title,stage,subject,start_date,end_date),curriculum_items(count)"
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load curricula", error);
    throw error;
  }

  return (
    data ?? []
  ).map(curriculum => ({
    id: curriculum.id,
    title: curriculum.title,
    subject: curriculum.subject,
    academic_year: curriculum.academic_year ?? undefined,
    class_id: curriculum.class_id,
    created_at: curriculum.created_at ?? undefined,
    class: curriculum.classes
      ? {
          id: curriculum.classes.id,
          title: curriculum.classes.title,
          stage: curriculum.classes.stage ?? undefined,
          subject: curriculum.classes.subject ?? undefined,
          start_date: curriculum.classes.start_date ?? undefined,
          end_date: curriculum.classes.end_date ?? undefined,
        }
      : null,
    items_count: Array.isArray(curriculum.curriculum_items)
      ? curriculum.curriculum_items[0]?.count ?? 0
      : 0,
  }));
}

export async function createCurriculum(input: {
  ownerId: string;
  classId: string;
  subject: string;
  title: string;
  academicYear?: string;
  lessonTitles: string[];
}): Promise<{ curriculum: Curriculum; items: DashboardCurriculumItem[] }> {
  const { data: curriculum, error } = await supabase
    .from("curricula")
    .insert({
      owner_id: input.ownerId,
      class_id: input.classId,
      subject: input.subject,
      title: input.title,
      academic_year: input.academicYear ?? null,
    })
    .select("id,class_id,subject,title,academic_year")
    .single();

  if (error) {
    console.error("Failed to create curriculum", error);
    throw error;
  }

  const itemsPayload = input.lessonTitles.map((lessonTitle, index) => ({
    curriculum_id: curriculum.id,
    position: index + 1,
    seq_index: index + 1,
    lesson_title: lessonTitle,
  }));

  const { data: items, error: itemsError } = await supabase
    .from("curriculum_items")
    .insert(itemsPayload)
    .select("id,curriculum_id,position,seq_index,lesson_title,stage,scheduled_on,status");

  if (itemsError) {
    console.error("Failed to create curriculum items", itemsError);
    throw itemsError;
  }

  return {
    curriculum,
    items: (items ?? []).map(item => ({
      ...item,
      lesson_plan_id: null,
      resource_shortcut_ids: [],
    })),
  };
}

type RawCurriculumItemRow = CurriculumItem & {
  seq_index?: number | null;
  resource_shortcuts?: unknown;
  lesson_plans?: { id: string }[] | { id: string } | null;
};

const extractResourceShortcutIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map(entry => {
      if (typeof entry === "string") {
        return entry;
      }

      if (entry && typeof entry === "object") {
        if ("id" in entry && typeof (entry as { id?: unknown }).id === "string") {
          return (entry as { id: string }).id;
        }

        if ("resource_id" in entry && typeof (entry as { resource_id?: unknown }).resource_id === "string") {
          return (entry as { resource_id: string }).resource_id;
        }
      }

      return null;
    })
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  return Array.from(new Set(ids));
};

const extractLessonPlanId = (value: RawCurriculumItemRow["lesson_plans"]): string | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const match = value.find(item => item && typeof item.id === "string");
    return match?.id ?? null;
  }

  if (typeof value === "object" && typeof value.id === "string") {
    return value.id;
  }

  return null;
};

export async function fetchCurriculumItems(curriculumId: string): Promise<DashboardCurriculumItem[]> {
  const { data, error } = await supabase
    .from("curriculum_items")
    .select(
      "id,curriculum_id,position,seq_index,lesson_title,stage,scheduled_on,status,resource_shortcuts,lesson_plans(id)",
    )
    .eq("curriculum_id", curriculumId)
    .order("seq_index", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true });

  if (error) {
    console.error("Failed to load curriculum items", error);
    throw error;
  }

  const rows = (data ?? []) as RawCurriculumItemRow[];

  return rows.map(row => {
    const { lesson_plans, resource_shortcuts, seq_index, ...base } = row;
    const normalizedSeqIndex =
      typeof seq_index === "number" ? seq_index : seq_index === null ? null : base.seq_index ?? undefined;

    return {
      ...base,
      seq_index: normalizedSeqIndex,
      lesson_plan_id: extractLessonPlanId(lesson_plans ?? null),
      resource_shortcut_ids: extractResourceShortcutIds(resource_shortcuts),
    } satisfies DashboardCurriculumItem;
  });
}

export async function reorderCurriculumItems(input: { curriculumId: string; itemIds: string[] }): Promise<void> {
  if (input.itemIds.length === 0) {
    return;
  }

  const updates = input.itemIds.map((id, index) => ({
    id,
    curriculum_id: input.curriculumId,
    seq_index: index + 1,
    position: index + 1,
  }));

  const { error } = await supabase
    .from("curriculum_items")
    .upsert(updates, { onConflict: "id" });

  if (error) {
    console.error("Failed to reorder curriculum items", error);
    throw error;
  }
}

export async function seedExampleDashboardData(input: {
  ownerId: string;
}): Promise<{ class: Class; curriculum: Curriculum; items: DashboardCurriculumItem[] }> {
  const { data: createdClass, error: classError } = await supabase
    .from("classes")
    .insert({
      owner_id: input.ownerId,
      title: DASHBOARD_EXAMPLE_CLASS.title,
      stage: DASHBOARD_EXAMPLE_CLASS.stage ?? null,
      subject: DASHBOARD_EXAMPLE_CLASS.subject ?? null,
      start_date: DASHBOARD_EXAMPLE_CLASS.start_date ?? null,
      end_date: DASHBOARD_EXAMPLE_CLASS.end_date ?? null,
    })
    .select("id,title,stage,subject,start_date,end_date")
    .single();

  if (classError) {
    console.error("Failed to copy example class", classError);
    throw classError;
  }

  const { data: createdCurriculum, error: curriculumError } = await supabase
    .from("curricula")
    .insert({
      owner_id: input.ownerId,
      class_id: createdClass.id,
      subject: DASHBOARD_EXAMPLE_CURRICULUM.subject,
      title: DASHBOARD_EXAMPLE_CURRICULUM.title,
      academic_year: DASHBOARD_EXAMPLE_CURRICULUM.academic_year ?? null,
    })
    .select("id,class_id,subject,title,academic_year")
    .single();

  if (curriculumError) {
    console.error("Failed to copy example curriculum", curriculumError);
    throw curriculumError;
  }

  const itemsPayload = DASHBOARD_EXAMPLE_CURRICULUM_ITEMS.map(item => ({
    curriculum_id: createdCurriculum.id,
    position: item.position,
    seq_index: item.seq_index ?? item.position,
    lesson_title: item.lesson_title,
    stage: item.stage ?? null,
    scheduled_on: item.scheduled_on ?? null,
    status: item.status,
  }));

  const { data: createdItems, error: itemsError } = await supabase
    .from("curriculum_items")
    .insert(itemsPayload)
    .select("id,curriculum_id,position,seq_index,lesson_title,stage,scheduled_on,status");

  if (itemsError) {
    console.error("Failed to copy example curriculum items", itemsError);
    throw itemsError;
  }

  return {
    class: createdClass,
    curriculum: createdCurriculum,
    items: (createdItems ?? []).map(item => ({
      ...item,
      lesson_plan_id: null,
      resource_shortcut_ids: [],
    })),
  };
}

export async function createLessonPlanFromItem(input: {
  ownerId: string;
  curriculumItemId: string;
}): Promise<LessonPlan> {
  const { data: item, error: itemError } = await supabase
    .from("curriculum_items")
    .select("id,lesson_title,stage,scheduled_on,curricula(class_id)")
    .eq("id", input.curriculumItemId)
    .single();

  if (itemError) {
    console.error("Failed to load curriculum item", itemError);
    throw itemError;
  }

  if (!item?.curricula) {
    throw new Error("Curriculum item missing parent curriculum");
  }

  const { data: lessonPlan, error } = await supabase
    .from("lesson_plans")
    .insert({
      owner_id: input.ownerId,
      curriculum_item_id: item.id,
      title: item.lesson_title,
      class_id: item.curricula.class_id,
      stage: item.stage ?? null,
      planned_date: item.scheduled_on ?? null,
    })
    .select("id,curriculum_item_id,title,class_id,stage,planned_date,body_md,exported_pdf_url,exported_docx_url")
    .single();

  if (error) {
    console.error("Failed to create lesson plan", error);
    throw error;
  }

  return lessonPlan;
}

export async function fetchLessonPlan(id: string): Promise<LessonPlanWithRelations | null> {
  const { data, error } = await supabase
    .from("lesson_plans")
    .select(
      "id,curriculum_item_id,title,class_id,stage,planned_date,body_md,exported_pdf_url,exported_docx_url," +
        "classes(id,title,stage,subject,start_date,end_date)," +
        "curriculum_items(id,curriculum_id,position,lesson_title,stage,scheduled_on,status,curricula(id,title,class_id,subject,academic_year))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load lesson plan", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    curriculum_item_id: data.curriculum_item_id,
    title: data.title,
    class_id: data.class_id,
    stage: data.stage ?? undefined,
    planned_date: data.planned_date ?? undefined,
    body_md: data.body_md ?? "",
    exported_pdf_url: data.exported_pdf_url ?? undefined,
    exported_docx_url: data.exported_docx_url ?? undefined,
    class: data.classes
      ? {
          id: data.classes.id,
          title: data.classes.title,
          stage: data.classes.stage ?? undefined,
          subject: data.classes.subject ?? undefined,
          start_date: data.classes.start_date ?? undefined,
          end_date: data.classes.end_date ?? undefined,
        }
      : null,
    curriculum_item: data.curriculum_items
      ? {
          id: data.curriculum_items.id,
          curriculum_id: data.curriculum_items.curricula?.id ?? data.curriculum_items.curriculum_id,
          position: data.curriculum_items.position,
          lesson_title: data.curriculum_items.lesson_title,
          stage: data.curriculum_items.stage ?? undefined,
          scheduled_on: data.curriculum_items.scheduled_on ?? undefined,
          status: (data.curriculum_items.status ?? "planned") as CurriculumItem["status"],
          curriculum: data.curriculum_items.curricula
            ? {
                id: data.curriculum_items.curricula.id,
                class_id: data.curriculum_items.curricula.class_id,
                subject: data.curriculum_items.curricula.subject,
                title: data.curriculum_items.curricula.title,
                academic_year: data.curriculum_items.curricula.academic_year ?? undefined,
              }
            : undefined,
        }
      : null,
  };
}

export async function updateLessonPlanBody(id: string, body: string): Promise<void> {
  const { error } = await supabase
    .from("lesson_plans")
    .update({ body_md: body })
    .eq("id", id);

  if (error) {
    console.error("Failed to update lesson plan body", error);
    throw error;
  }
}

export type ResourceSearchFilters = {
  query?: string;
  types?: Resource["type"][];
  subject?: string;
  stage?: string;
  cost?: "free" | "paid" | "both";
  tags?: string[];
};

export async function searchResources(filters: ResourceSearchFilters): Promise<Resource[]> {
  const query = supabase.from("resources").select("id,type,title,instructions,url,file_path,meta");

  if (filters.query) {
    query.ilike("title", `%${filters.query}%`);
  }

  if (filters.types && filters.types.length > 0) {
    query.in("type", filters.types);
  }

  if (filters.subject) {
    query.ilike("meta->>subject", `%${filters.subject}%`);
  }

  if (filters.stage) {
    query.ilike("meta->>stage", `%${filters.stage}%`);
  }

  if (filters.cost && filters.cost !== "both") {
    const isFree = filters.cost === "free";
    query.eq("meta->>cost", isFree ? "free" : "paid");
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error("Failed to search resources", error);
    throw error;
  }

  let resources = data ?? [];

  if (filters.tags && filters.tags.length > 0) {
    const tagMatchers = filters.tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
    if (tagMatchers.length > 0) {
      resources = resources.filter(resource => {
        const meta = resource.meta;
        if (!meta || typeof meta !== "object") {
          return false;
        }
        const record = meta as Record<string, unknown>;
        const rawTags = Array.isArray(record.tags) ? record.tags : [];
        const normalized = rawTags.map(tag => String(tag).toLowerCase());
        return tagMatchers.every(tag => normalized.some(value => value.includes(tag)));
      });
    }
  }

  return resources;
}

export async function attachResourceToLessonPlan(input: {
  lessonPlanId: string;
  resourceId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("lesson_plan_resources")
    .insert({
      lesson_plan_id: input.lessonPlanId,
      resource_id: input.resourceId,
    });

  if (error) {
    console.error("Failed to link resource", error);
    throw error;
  }
}
