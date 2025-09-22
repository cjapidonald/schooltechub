import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { recordAuditLog } from "../../_lib/audit";
import { requireAdmin } from "../../_lib/auth";

interface RolePayload {
  userId?: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const payload = (await parseJsonBody<RolePayload>(request)) ?? {};
  const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";

  if (userId.length === 0) {
    return errorResponse(400, "A user id is required");
  }

  const { supabase, user } = context;
  const deleteResult = await supabase.from("app_admins").delete().eq("user_id", userId);

  if (deleteResult.error) {
    return errorResponse(500, "Failed to revoke admin role");
  }

  await recordAuditLog(supabase, {
    action: "admin.roles.revoke",
    actorId: user.id,
    targetId: userId,
  });

  return jsonResponse({ success: true });
}
