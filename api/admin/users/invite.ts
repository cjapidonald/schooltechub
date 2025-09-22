import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { getAuditRequestContext, recordAuditLog } from "../../_lib/audit";
import { requireAdmin } from "../../_lib/auth";

interface InvitePayload {
  email?: string;
  metadata?: Record<string, unknown> | null;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const payload = (await parseJsonBody<InvitePayload>(request)) ?? {};
  const email = typeof payload.email === "string" ? payload.email.trim() : "";

  if (email.length === 0) {
    return errorResponse(400, "An email address is required");
  }

  const { supabase, user } = context;
  const auditContext = getAuditRequestContext(request);
  const inviteResult = await supabase.auth.admin.inviteUserByEmail(email, {
    data: payload.metadata ?? undefined,
  });

  if (inviteResult.error) {
    return errorResponse(500, "Failed to send invitation");
  }

  const invitedUserId = inviteResult.data.user?.id ?? null;
  const targetId = invitedUserId ?? email;

  await recordAuditLog(supabase, {
    action: "admin.users.invite",
    actorId: user.id,
    targetType: "user",
    targetId,
    details: {
      email,
      invitedUserId,
      metadata: payload.metadata ?? null,
    },
    ...auditContext,
  });

  return jsonResponse({
    success: true,
    userId: invitedUserId,
  });
}
