import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { getAuditRequestContext, recordAuditLog } from "../../_lib/audit";
import { requireAdmin } from "../../_lib/auth";
import { findUserByEmail } from "../../_lib/users";

interface RolePayload {
  userId?: string;
  email?: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const { supabase, user } = context;
  const payload = (await parseJsonBody<RolePayload>(request)) ?? {};
  const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";

  if (userId.length === 0 && email.length === 0) {
    return errorResponse(400, "A user id or email address is required");
  }

  let targetId = userId;
  let resolvedEmail = email || null;

  if (!targetId) {
    try {
      const lookup = await findUserByEmail(supabase, email);
      if (!lookup) {
        return errorResponse(404, "No user with that email address was found");
      }
      targetId = lookup.id;
      resolvedEmail = lookup.email ?? resolvedEmail;
    } catch {
      return errorResponse(500, "Failed to resolve the requested user");
    }
  }

  const auditContext = getAuditRequestContext(request);

  const deleteResult = await supabase.from("app_admins").delete().eq("user_id", targetId);
  if (deleteResult.error) {
    return errorResponse(500, "Failed to revoke admin role");
  }

  await recordAuditLog(supabase, {
    action: "admin.roles.revoke",
    actorId: user.id,
    targetType: "user",
    targetId: targetId,
    details: {
      role: "admin",
      ...(resolvedEmail ? { email: resolvedEmail } : {}),
    },
    ...auditContext,
  });

  return jsonResponse({ success: true });
}
