import { mapRecordToBuilderPlan, createDraftInsert } from "../_lib/lesson-builder-helpers";
import { getSupabaseClient } from "../_lib/supabase";
import type { LessonBuilderDraftRequest, LessonBuilderPlanResponse } from "../../types/lesson-builder";
import type { LessonPlanRecord } from "../../types/lesson-plans";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `plan_${Math.random().toString(36).slice(2, 12)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildSlug(title: string, id: string): string {
  const base = slugify(title || "lesson-plan");
  const suffix = id.replace(/[^a-z0-9]+/gi, "").slice(0, 6) || "draft";
  return `${base}-${suffix}`;
}

function parseRequestBody(body: unknown): LessonBuilderDraftRequest {
  if (!body || typeof body !== "object") {
    return {};
  }
  const record = body as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : null,
    stage: typeof record.stage === "string" ? record.stage : null,
    subjects: Array.isArray(record.subjects)
      ? record.subjects.filter((subject): subject is string => typeof subject === "string")
      : [],
  };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method && request.method.toUpperCase() !== "POST") {
    return new Response(null, {
      status: 405,
      headers: {
        Allow: "POST",
      },
    });
  }

  let payload: LessonBuilderDraftRequest = {};
  try {
    payload = parseRequestBody(await request.json());
  } catch {
    payload = {};
  }

  const id = generateId();
  const title = payload.title?.trim() && payload.title.length > 0 ? payload.title.trim() : "Untitled Lesson";
  const slug = buildSlug(title, id);
  const now = new Date().toISOString();

  const draft = createDraftInsert({
    id,
    slug,
    title,
    summary: null,
    stage: payload.stage ?? null,
    stages: payload.stage ? [payload.stage] : [],
    subjects: payload.subjects ?? [],
    deliveryMethods: [],
    technologyTags: [],
    durationMinutes: null,
    status: "draft",
    overview: null,
    steps: [],
    standards: [],
    availableStandards: [],
    resources: [],
    version: 1,
    parts: [
      { id: "overview", label: "Overview", description: null, completed: false },
      { id: "activities", label: "Learning Activities", description: null, completed: false },
      { id: "assessment", label: "Assessment", description: null, completed: false },
      { id: "resources", label: "Resources", description: null, completed: false },
    ],
    history: [
      {
        id: `ver_${id.slice(0, 6)}`,
        label: "Draft v1",
        createdAt: now,
        author: null,
        summary: null,
      },
    ],
  });

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from<LessonPlanRecord>("lesson_plans")
    .insert(draft)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return errorResponse(500, "Failed to create draft");
  }

  const plan = mapRecordToBuilderPlan(data);

  const response: LessonBuilderPlanResponse = { plan };
  return jsonResponse(response, 201);
}
