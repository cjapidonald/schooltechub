import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createLessonPlan as createLessonPlanApi,
  getLessonPlan as getLessonPlanApi,
  updateLessonPlan as updateLessonPlanApi,
  type LessonPlanRecord,
} from "@/pages/lesson-builder/api";
import type { LessonPlanMetaDraft } from "@/pages/lesson-builder/types";
import { downloadPlanExport as downloadPlanExportImpl } from "@/lib/downloadPlanExport";

export interface LessonPlanSummary {
  id: string;
  title: string;
  subject: string | null;
  date: string | null;
  objective: string;
  successCriteria: string;
  updatedAt: string | null;
  lastSavedAt: string | null;
}

export interface UpcomingLessonPlanListItem {
  date: string | null;
  classTitle: string;
  lessonId: string;
  lessonTitle: string;
}

class LessonPlanDataError extends Error {
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

type Client = SupabaseClient;

function mapLessonPlanSummary(record: LessonPlanRecord): LessonPlanSummary {
  return {
    id: record.id,
    title: record.title,
    subject: record.subject,
    date: record.date,
    objective: record.objective,
    successCriteria: record.successCriteria,
    updatedAt: record.updatedAt,
    lastSavedAt: record.lastSavedAt,
  } satisfies LessonPlanSummary;
}

async function requireUserId(client: Client, action: string): Promise<string> {
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw new LessonPlanDataError("Unable to verify authentication state.", { cause: error });
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new LessonPlanDataError(`You must be signed in to ${action}.`);
  }

  return userId;
}

export async function createLessonPlan(meta: LessonPlanMetaDraft): Promise<LessonPlanSummary> {
  const record = await createLessonPlanApi(meta);
  return mapLessonPlanSummary(record);
}

export async function updateLessonPlan(
  id: string,
  changes: Partial<LessonPlanMetaDraft>,
): Promise<LessonPlanSummary> {
  const record = await updateLessonPlanApi(id, changes);
  return mapLessonPlanSummary(record);
}

export async function getLessonPlan(id: string): Promise<LessonPlanSummary> {
  const record = await getLessonPlanApi(id);
  return mapLessonPlanSummary(record);
}

export function downloadPlanExport(
  planId: string,
  format: "pdf" | "docx",
  title: string,
): Promise<void> {
  return downloadPlanExportImpl(planId, format, title);
}

export async function listUpcomingLessonPlans(
  limit = 5,
  client: Client = supabase,
): Promise<UpcomingLessonPlanListItem[]> {
  await requireUserId(client, "view upcoming lesson plans");

  const today = new Date().toISOString().slice(0, 10);
  const requestedLimit = Number.isFinite(limit) ? Math.floor(limit) : 5;
  const safeLimit = Math.min(Math.max(requestedLimit, 1), 20);

  const { data, error } = await client
    .from("class_lesson_plans")
    .select(
      `
        lesson_plan_id,
        added_at,
        lesson_plans!inner (
          id,
          title,
          date
        ),
        classes!inner (
          id,
          title
        )
      `,
    )
    .gte("lesson_plans.date", today)
    .order("date", { ascending: true, nullsFirst: false, foreignTable: "lesson_plans" });

  if (error) {
    throw new LessonPlanDataError("Failed to load upcoming lesson plans.", { cause: error });
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .slice() // create a shallow copy before sorting
    .sort((a, b) => {
      const lessonA = (a as Record<string, any>).lesson_plans ?? null;
      const lessonB = (b as Record<string, any>).lesson_plans ?? null;

      const dateA = typeof lessonA?.date === "string" ? lessonA.date : "";
      const dateB = typeof lessonB?.date === "string" ? lessonB.date : "";

      if (dateA !== dateB) {
        return dateA < dateB ? -1 : 1;
      }

      const addedA = typeof (a as Record<string, any>).added_at === "string" ? (a as Record<string, any>).added_at : "";
      const addedB = typeof (b as Record<string, any>).added_at === "string" ? (b as Record<string, any>).added_at : "";
      return addedA < addedB ? -1 : addedA > addedB ? 1 : 0;
    })
    .slice(0, safeLimit)
    .map(record => {
      const lessonPlan = (record as Record<string, any>).lesson_plans ?? null;
      const classRecord = (record as Record<string, any>).classes ?? null;

      const lessonTitle =
        lessonPlan && typeof lessonPlan.title === "string" && lessonPlan.title.trim().length > 0
          ? lessonPlan.title.trim()
          : "Untitled lesson";
      const classTitle =
        classRecord && typeof classRecord.title === "string" && classRecord.title.trim().length > 0
          ? classRecord.title.trim()
          : "Untitled class";

      const rawDate = lessonPlan?.date;
      const formattedDate =
        typeof rawDate === "string" && rawDate.trim().length > 0 ? rawDate.trim() : null;

      const lessonPlanId =
        record.lesson_plan_id ?? (lessonPlan ? lessonPlan.id ?? null : null);

      return {
        date: formattedDate,
        classTitle,
        lessonId: lessonPlanId ? String(lessonPlanId) : "",
        lessonTitle,
      } satisfies UpcomingLessonPlanListItem;
    });
}
