import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../../_lib/http";
import { recordAuditLog } from "../../../_lib/audit";
import { requireAdmin } from "../../../_lib/auth";
import { createNotification } from "../../../_lib/notifications";

interface ModerationPayload {
  id?: string;
}

interface ResourceRecord {
  id: string;
  created_by: string | null;
  status: string;
  is_active: boolean | null;
  title?: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const payload = (await parseJsonBody<ModerationPayload>(request)) ?? {};
  const resourceId = typeof payload.id === "string" ? payload.id.trim() : "";

  if (resourceId.length === 0) {
    return errorResponse(400, "A resource id is required");
  }

  const { supabase, user } = context;
  const existingResult = await supabase
    .from<ResourceRecord>("resources")
    .select("id, created_by, status, is_active, title")
    .eq("id", resourceId)
    .maybeSingle();

  if (existingResult.error) {
    return errorResponse(500, "Failed to load resource");
  }

  if (!existingResult.data) {
    return errorResponse(404, "Resource not found");
  }

  const now = new Date().toISOString();
  const updateResult = await supabase
    .from("resources")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: now,
      is_active: true,
    })
    .eq("id", resourceId)
    .select("id, created_by, status, approved_by, approved_at")
    .maybeSingle();

  if (updateResult.error || !updateResult.data) {
    return errorResponse(500, "Failed to approve resource");
  }

  if (existingResult.data.created_by) {
    await createNotification(existingResult.data.created_by, "resource_approved", {
      resourceId,
      title: existingResult.data.title ?? null,
    });
  }

  await recordAuditLog(supabase, {
    action: "admin.moderation.resources.approve",
    actorId: user.id,
    targetId: resourceId,
    metadata: {
      previousStatus: existingResult.data.status,
    },
  });

  return jsonResponse({ success: true, resource: updateResult.data });
}
