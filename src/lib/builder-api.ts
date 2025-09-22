import type {
  LessonBuilderActivity,
  LessonBuilderPlan,
  LessonBuilderPlanResponse,
  LessonBuilderHistoryResponse,
  LessonBuilderActivitySearchResponse,
  LessonBuilderDraftRequest,
} from "@/types/lesson-builder";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function createLessonBuilderDraft(
  payload: LessonBuilderDraftRequest = {}
): Promise<LessonBuilderPlan> {
  const response = await fetch("/api/builder/lesson-plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<LessonBuilderPlanResponse>(response);
  return result.plan;
}

export async function fetchLessonBuilderPlan(
  identifier: string,
  options: { lookup?: "id" | "slug" } = {}
): Promise<LessonBuilderPlan> {
  const lookup = options.lookup ?? "id";
  const response = await fetch(`/api/builder/lesson-plans/${identifier}?lookup=${lookup}`);
  const result = await handleResponse<LessonBuilderPlanResponse>(response);
  return result.plan;
}

export async function autosaveLessonBuilderPlan(
  id: string,
  plan: LessonBuilderPlan
): Promise<LessonBuilderPlan> {
  const response = await fetch(`/api/builder/lesson-plans/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });
  const result = await handleResponse<LessonBuilderPlanResponse>(response);
  return result.plan;
}

export async function fetchLessonBuilderHistory(id: string): Promise<LessonBuilderHistoryResponse["versions"]> {
  const response = await fetch(`/api/builder/lesson-plans/${id}/history`);
  const result = await handleResponse<LessonBuilderHistoryResponse>(response);
  return result.versions;
}

export async function searchLessonBuilderActivities(
  id: string,
  query: string
): Promise<LessonBuilderActivity[]> {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(`/api/builder/lesson-plans/${id}/activities`, origin);
  if (query.trim()) {
    url.searchParams.set("q", query.trim());
  }
  const path = `${url.pathname}${url.search}`;
  const response = await fetch(path);
  const result = await handleResponse<LessonBuilderActivitySearchResponse>(response);
  return result.results;
}
