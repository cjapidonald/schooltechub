import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { recordAuditLog } from "../../_lib/audit";
import { requireAdmin } from "../../_lib/auth";

interface UndeletePayload {
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

  const payload = (await parseJsonBody<UndeletePayload>(request)) ?? {};
  const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";

  if (userId.length === 0) {
    return errorResponse(400, "A user id is required");
  }

  const { supabase, user } = context;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("deleted_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return errorResponse(500, "Failed to load the user profile");
  }

  if (!profile) {
    return errorResponse(404, "User profile not found");
  }

  if (!profile.deleted_at) {
    return jsonResponse({ success: true, alreadyRestored: true });
  }

  const { error: restoreError } = await supabase.from("profiles").update({ deleted_at: null }).eq("id", userId);
  if (restoreError) {
    return errorResponse(500, "Failed to restore the profile");
  }

  const unbanResult = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });

  if (unbanResult.error) {
    await supabase.from("profiles").update({ deleted_at: profile.deleted_at }).eq("id", userId);
    return errorResponse(500, "Failed to re-enable the user session");
  }

  await recordAuditLog(supabase, {
    action: "admin.users.undelete",
    actorId: user.id,
    targetId: userId,
    metadata: { restored_at: new Date().toISOString() },
  });

  return jsonResponse({ success: true });
}
