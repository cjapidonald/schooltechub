import { supabase } from "@/integrations/supabase/client";
import type { LessonPlanMetaDraft } from "./types";

export interface LessonPlanRecord {
  id: string;
  title: string;
  subject: string | null;
  classId: string | null;
  date: string | null;
  objective: string;
  successCriteria: string;
  updatedAt: string | null;
  lastSavedAt: string | null;
}

interface LessonPlanResponseBody {
  plan?: Record<string, unknown> | null;
}

const LESSON_PLAN_ENDPOINT = "/api/lesson-plans";

function normaliseString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normaliseStringOrEmpty(value: unknown): string {
  return normaliseString(value) ?? "";
}

function normaliseDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normaliseClassId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function normaliseSuccessCriteria(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function mapPlanRecord(record: Record<string, unknown> | null | undefined): LessonPlanRecord {
  if (!record) {
    throw new Error("Lesson plan payload was empty");
  }

  const idValue = record.id ?? record.ID ?? null;
  if (typeof idValue !== "string" && typeof idValue !== "number") {
    throw new Error("Lesson plan response was missing an id");
  }

  const id = String(idValue);
  const subject =
    normaliseString(record.subject) ??
    (Array.isArray(record.subjects) && record.subjects.length > 0
      ? normaliseString(record.subjects[0])
      : null);
  const classId = normaliseClassId((record as Record<string, unknown>).class_id ?? record.classId);
  const lessonDate =
    normaliseDate(record.lesson_date) ??
    normaliseDate(record.lessonDate) ??
    normaliseDate(record.date);
  const objective = normaliseStringOrEmpty(record.objective ?? record.summary ?? "");
  const successCriteria = normaliseSuccessCriteria(
    (record as Record<string, unknown>).success_criteria ?? record.successCriteria ?? record.success_criteria,
  );

  return {
    id,
    title: normaliseStringOrEmpty(record.title),
    subject: subject ?? null,
    classId,
    date: lessonDate,
    objective,
    successCriteria,
    updatedAt: normaliseDate(record.updated_at ?? record.updatedAt),
    lastSavedAt: normaliseDate(record.last_saved_at ?? record.lastSavedAt),
  } satisfies LessonPlanRecord;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const value = (payload as { error?: unknown }).error;
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

async function requestWithAuth(path: string, init: RequestInit): Promise<Response> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error("Failed to verify session.", { cause: error });
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("You must be signed in to continue.");
  }

  const headers: Record<string, string> = {};

  if (init.headers instanceof Headers) {
    for (const [key, value] of init.headers.entries()) {
      headers[key] = value;
    }
  } else if (Array.isArray(init.headers)) {
    for (const [key, value] of init.headers) {
      headers[key] = value;
    }
  } else if (init.headers && typeof init.headers === "object") {
    Object.assign(headers, init.headers);
  }

  headers.Authorization = `Bearer ${accessToken}`;

  return fetch(path, { ...init, headers });
}

function buildPlanUpdate(meta: Partial<LessonPlanMetaDraft>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (meta.title !== undefined) {
    payload.title = meta.title.trim();
  }
  if (meta.subject !== undefined) {
    payload.subject = meta.subject ?? null;
  }
  if (meta.classId !== undefined) {
    payload.class_id = meta.classId && meta.classId.trim().length > 0 ? meta.classId.trim() : null;
  }
  if (meta.date !== undefined) {
    payload.lesson_date = meta.date && meta.date.trim().length > 0 ? meta.date.trim() : null;
  }
  if (meta.objective !== undefined) {
    const objective = meta.objective.trim();
    payload.objective = objective.length > 0 ? objective : null;
    payload.summary = objective.length > 0 ? objective : null;
  }
  if (meta.successCriteria !== undefined) {
    const success = meta.successCriteria.trim();
    payload.success_criteria = success.length > 0 ? success : null;
  }

  return payload;
}

export async function createLessonPlan(meta: LessonPlanMetaDraft): Promise<LessonPlanRecord> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error("Failed to verify authentication state.", { cause: error });
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("You must be signed in to create a lesson plan.");
  }

  let response: Response;
  try {
    response = await fetch(LESSON_PLAN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title: meta.title.trim(),
      }),
    });
  } catch (cause) {
    throw new Error("Failed to create a lesson plan draft.", { cause });
  }

  const payload = await response
    .json()
    .catch(() => ({ error: response.ok ? "" : "Failed to parse server response." }));

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to create a lesson plan draft."));
  }

  const plan = mapPlanRecord((payload as LessonPlanResponseBody).plan ?? undefined);

  return plan;
}

export async function updateLessonPlan(
  id: string,
  changes: Partial<LessonPlanMetaDraft>,
): Promise<LessonPlanRecord> {
  const planPayload = buildPlanUpdate(changes);

  let response: Response;
  try {
    response = await requestWithAuth(`${LESSON_PLAN_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan: planPayload }),
    });
  } catch (cause) {
    throw new Error("Failed to save lesson plan changes.", { cause });
  }

  const payload = await response
    .json()
    .catch(() => ({ error: response.ok ? "" : "Failed to parse server response." }));

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to save lesson plan changes."));
  }

  const plan = mapPlanRecord((payload as LessonPlanResponseBody).plan ?? undefined);

  return plan;
}

export async function getLessonPlan(id: string): Promise<LessonPlanRecord> {
  let response: Response;
  try {
    response = await requestWithAuth(`${LESSON_PLAN_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  } catch (cause) {
    throw new Error("Failed to load lesson plan.", { cause });
  }

  const payload = await response
    .json()
    .catch(() => ({ error: response.ok ? "" : "Failed to parse server response." }));

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to load lesson plan."));
  }

  const plan = mapPlanRecord((payload as LessonPlanResponseBody).plan ?? undefined);

  return plan;
}

