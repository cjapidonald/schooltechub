import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { getAuditRequestContext, recordAuditLog } from "../../_lib/audit";
import { requireAdmin } from "../../_lib/auth";

interface ResetPayload {
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

  const payload = (await parseJsonBody<ResetPayload>(request)) ?? {};
  const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";

  if (userId.length === 0) {
    return errorResponse(400, "A user id is required");
  }

  const { supabase, user } = context;
  const auditContext = getAuditRequestContext(request);
  const userResult = await supabase.auth.admin.getUserById(userId);

  if (userResult.error || !userResult.data?.user) {
    return errorResponse(404, "User not found");
  }

  const email = userResult.data.user.email;
  if (!email) {
    return errorResponse(422, "The selected user does not have an email address");
  }

  const resetResult = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (resetResult.error) {
    return errorResponse(500, "Failed to send reset instructions");
  }

  await recordAuditLog(supabase, {
    action: "admin.users.reset_password",
    actorId: user.id,
    targetType: "user",
    targetId: userId,
    details: { email },
    ...auditContext,
  });

  return jsonResponse({ success: true });
}
