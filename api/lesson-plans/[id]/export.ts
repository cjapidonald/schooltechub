import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { getSupabaseClient } from "../../_lib/supabase";

const LESSON_PLAN_TABLE = "lesson_plan_builder_plans";

interface ExportPayload {
  userId?: string;
  exportType?: string | null;
  exportPath?: string | null;
  bucket?: string | null;
  expiresIn?: number | null;
}

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  const id = extractIdFromRequest(request);

  if (!id) {
    return errorResponse(400, "A lesson plan id is required");
  }

  if (method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  return handleExport(request, id);
}

async function handleExport(request: Request, id: string): Promise<Response> {
  const payload = (await parseJsonBody<ExportPayload>(request)) ?? {};
  if (!payload.userId) {
    return errorResponse(400, "A userId is required to export a lesson plan");
  }

  const supabase = getSupabaseClient();
  const accessResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .select("id, share_access")
    .eq("id", id)
    .maybeSingle();

  if (accessResult.error) {
    return errorResponse(500, "Failed to verify lesson plan access");
  }

  if (!accessResult.data) {
    return errorResponse(404, "Lesson plan not found");
  }

  if (!canExport(accessResult.data.share_access)) {
    return errorResponse(403, "You do not have permission to export this plan");
  }

  const updates: Record<string, unknown> = {
    last_exported_at: new Date().toISOString(),
  };

  if (payload.exportType !== undefined) {
    updates.selected_export_type = payload.exportType;
  }

  if (payload.exportPath) {
    updates.latest_export_path = payload.exportPath;
  }

  const updateResult = await supabase
    .from(LESSON_PLAN_TABLE)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateResult.error || !updateResult.data) {
    return errorResponse(500, "Failed to update export selection");
  }

  let signedUrl: string | null = null;
  if (payload.exportPath && payload.bucket) {
    const expiresIn = payload.expiresIn ?? 3600;
    const storageResponse = await supabase.storage
      .from(payload.bucket)
      .createSignedUrl(payload.exportPath, expiresIn);

    if (storageResponse.error) {
      return errorResponse(500, "Failed to generate signed export link");
    }

    signedUrl = storageResponse.data?.signedUrl ?? null;
  }

  return jsonResponse({
    plan: {
      ...updateResult.data,
      shareAccess: updateResult.data.share_access ?? "owner",
      readOnly: false,
    },
    signedUrl,
  });
}

function extractIdFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 2];
    return id ? decodeURIComponent(id) : null;
  } catch {
    return null;
  }
}

function canExport(shareAccess: string | null | undefined): boolean {
  return shareAccess === "owner" || shareAccess === "editor";
}
