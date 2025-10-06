import { supabase } from "@/integrations/supabase/client";
import type { Class, LessonPlan, Resource } from "../../../types/supabase-tables";

export type LessonPlanWithRelations = LessonPlan & {
  class?: Class | null;
};

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

export async function updateClassDetails(input: {
  id: string;
  ownerId: string;
  title: string;
  stage?: string;
  subject?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Class> {
  const { data, error } = await supabase
    .from("classes")
    .update({
      title: input.title,
      stage: input.stage ?? null,
      subject: input.subject ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
    })
    .eq("id", input.id)
    .eq("owner_id", input.ownerId)
    .select("id,title,stage,subject,start_date,end_date")
    .single();

  if (error) {
    console.error("Failed to update class", error);
    throw error;
  }

  return data;
}

export async function fetchLessonPlan(id: string): Promise<LessonPlanWithRelations | null> {
  const { data, error } = await supabase
    .from("lesson_plans")
    .select(
      "id,curriculum_item_id,title,class_id,stage,planned_date,body_md,exported_pdf_url,exported_docx_url," +
        "classes(id,title,stage,subject,start_date,end_date)",
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
