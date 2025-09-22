import { jsonResponse, methodNotAllowed, normalizeMethod } from "../_lib/http";
import { requireAdmin } from "../_lib/auth";
import { getAuditRequestContext, recordAuditLog } from "../_lib/audit";

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const { supabase, user } = context;

  const auditContext = getAuditRequestContext(request);

  await recordAuditLog(supabase, {
    action: "admin.guard.check",
    actorId: user.id,
    targetType: "system",
    targetId: "guard",
    details: { method: request.method },
    ...auditContext,
  });

  return jsonResponse({ ok: true });
}
