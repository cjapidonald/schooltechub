import type { User } from "@supabase/supabase-js";
import { errorResponse, jsonResponse, methodNotAllowed, normalizeMethod } from "../_lib/http";
import { getSupabaseClient } from "../_lib/supabase";

const ALLOWED_BUCKETS = new Set(["lesson-plans", "research"]);
const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes

interface MaybeSingleBuilder<T> {
  maybeSingle(): Promise<{ data: T | null; error: { message: string } | null }>;
}

interface SignedUrlBuilder {
  createSignedUrl(path: string, expiresIn: number): Promise<{
    data: { signedUrl: string | null } | null;
    error: { message: string } | null;
  }>;
}

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);

  if (method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const url = new URL(request.url);
  const bucket = url.searchParams.get("bucket");
  const path = url.searchParams.get("path");

  if (!bucket || !bucket.trim()) {
    return errorResponse(400, "A storage bucket is required");
  }

  if (!path || !path.trim()) {
    return errorResponse(400, "A file path is required");
  }

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return errorResponse(400, "Unsupported storage bucket requested");
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(401, "Authentication required");
  }

  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !authData?.user) {
    return errorResponse(401, "Authentication required");
  }

  const user = authData.user;
  const userId = user.id;
  const isAdminUser = await isAdmin(supabase, user);

  if (bucket === "lesson-plans") {
    return handleLessonPlanFile(supabase, userId, path, isAdminUser);
  }

  return handleResearchFile(supabase, userId, path, isAdminUser);
}

async function handleLessonPlanFile(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  path: string,
  isAdminUser: boolean,
): Promise<Response> {
  const planResult = await selectSingle(
    supabase
      .from<{ id: string; owner_id: string | null }>("lesson_plan_builder_plans")
      .select("id, owner_id")
      .eq("latest_export_path", path)
  );

  if (planResult.error) {
    return errorResponse(500, "Failed to verify lesson plan export access");
  }

  const plan = planResult.data;
  if (!plan) {
    return errorResponse(404, "File not found");
  }

  const ownerId = plan.owner_id;
  if (!isAdminUser && (!ownerId || ownerId !== userId)) {
    return errorResponse(403, "You do not have permission to access this file");
  }

  return createSignedUrlResponse(
    supabase.storage.from("lesson-plans").createSignedUrl(path, SIGNED_URL_TTL_SECONDS),
  );
}

async function handleResearchFile(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  path: string,
  isAdminUser: boolean,
): Promise<Response> {
  const documentResult = await selectSingle(
    supabase
      .from<{ id: string; project_id: string }>("research_documents")
      .select("id, project_id")
      .eq("storage_path", path)
  );

  if (documentResult.error) {
    return errorResponse(500, "Failed to verify research document access");
  }

  const document = documentResult.data;
  if (document) {
    const projectAccess = await resolveProjectAccess(supabase, document.project_id, userId);
    if (!projectAccess.ok) {
      return projectAccess.error;
    }

    if (!isAdminUser && !projectAccess.canAccessDocuments) {
      return errorResponse(403, "You do not have permission to access this file");
    }

    return createSignedUrlResponse(
      supabase.storage.from("research").createSignedUrl(path, SIGNED_URL_TTL_SECONDS),
    );
  }

  const submissionResult = await selectSingle(
    supabase
      .from<{ id: string; project_id: string; participant_id: string | null }>("research_submissions")
      .select("id, project_id, participant_id")
      .eq("storage_path", path)
  );

  if (submissionResult.error) {
    return errorResponse(500, "Failed to verify research submission access");
  }

  const submission = submissionResult.data;
  if (!submission) {
    return errorResponse(404, "File not found");
  }

  if (isAdminUser || submission.participant_id === userId) {
    return createSignedUrlResponse(
      supabase.storage.from("research").createSignedUrl(path, SIGNED_URL_TTL_SECONDS),
    );
  }

  const projectAccess = await resolveProjectAccess(supabase, submission.project_id, userId);
  if (!projectAccess.ok) {
    return projectAccess.error;
  }

  if (!projectAccess.canAccessSubmissions) {
    return errorResponse(403, "You do not have permission to access this file");
  }

  return createSignedUrlResponse(
    supabase.storage.from("research").createSignedUrl(path, SIGNED_URL_TTL_SECONDS),
  );
}

async function resolveProjectAccess(
  supabase: ReturnType<typeof getSupabaseClient>,
  projectId: string,
  userId: string,
): Promise<
  | { ok: true; canAccessDocuments: boolean; canAccessSubmissions: boolean }
  | { ok: false; error: Response }
> {
  const projectResult = await selectSingle(
    supabase
      .from<{ created_by: string | null }>("research_projects")
      .select("created_by")
      .eq("id", projectId)
  );

  if (projectResult.error) {
    return { ok: false, error: errorResponse(500, "Failed to verify research project access") };
  }

  const createdBy = projectResult.data?.created_by ?? null;
  if (createdBy === userId) {
    return { ok: true, canAccessDocuments: true, canAccessSubmissions: true };
  }

  const participantResult = await selectSingle(
    supabase
      .from<{ id: string }>("research_participants")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
  );

  if (participantResult.error) {
    return { ok: false, error: errorResponse(500, "Failed to verify research project access") };
  }

  const isParticipant = Boolean(participantResult.data);
  return {
    ok: true,
    canAccessDocuments: isParticipant,
    canAccessSubmissions: false,
  };
}

async function selectSingle<T>(builder: MaybeSingleBuilder<T>): Promise<{
  data: T | null;
  error: { message: string } | null;
}> {
  return builder.maybeSingle();
}

async function createSignedUrlResponse(resultPromise: ReturnType<SignedUrlBuilder["createSignedUrl"]>): Promise<Response> {
  const { data, error } = await resultPromise;

  if (error || !data?.signedUrl) {
    return errorResponse(500, "Failed to generate a signed download link");
  }

  return jsonResponse({ url: data.signedUrl });
}

function extractAccessToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (header) {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const cookieHeader = request.headers.get("cookie") ?? request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";");
    for (const rawCookie of cookies) {
      const [name, ...rest] = rawCookie.trim().split("=");
      if (name === "sb-access-token") {
        return decodeURIComponent(rest.join("="));
      }
    }
  }

  return null;
}

async function isAdmin(supabase: ReturnType<typeof getSupabaseClient>, user: User): Promise<boolean> {
  const role = typeof user.app_metadata?.role === "string" ? user.app_metadata.role.toLowerCase() : "";
  if (role === "admin") {
    return true;
  }

  try {
    const { data, error } = await supabase
      .from<{ user_id: string }>("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data?.user_id === user.id) {
      return true;
    }
  } catch {
    // Ignore lookup failures and continue with non-admin access.
  }

  return false;
}
