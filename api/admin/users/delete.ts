import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { recordAuditLog } from "../../_lib/audit";
import { requireAdmin } from "../../_lib/auth";

interface DeletePayload {
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

  const payload = (await parseJsonBody<DeletePayload>(request)) ?? {};
  const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";

  if (userId.length === 0) {
    return errorResponse(400, "A user id is required");
  }

  const { supabase, user } = context;

  const { data: targetProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    return errorResponse(500, "Failed to locate the user profile");
  }

  if (!targetProfile) {
    return errorResponse(404, "User profile not found");
  }

  if (targetProfile.deleted_at) {
    return jsonResponse({ success: true, alreadyDeleted: true });
  }

  const deletedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ deleted_at: deletedAt })
    .eq("id", userId);

  if (updateError) {
    return errorResponse(500, "Failed to mark the profile as deleted");
  }

  const banResult = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });

  if (banResult.error) {
    await supabase.from("profiles").update({ deleted_at: null }).eq("id", userId);
    return errorResponse(500, "Failed to disable the account");
  }

  await recordAuditLog(supabase, {
    action: "admin.users.delete",
    actorId: user.id,
    targetId: userId,
    metadata: { deleted_at: deletedAt },
  });

  return jsonResponse({ success: true });
}
