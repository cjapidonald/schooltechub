import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../_lib/http";
import { recordAuditLog } from "../../_lib/audit";
import { requireAdmin } from "../../_lib/auth";

interface DisablePayload {
  userId?: string;
}

const BAN_DURATION = "8760h"; // 1 year ban to effectively disable the account

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const payload = (await parseJsonBody<DisablePayload>(request)) ?? {};
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

  if (profile.deleted_at) {
    return errorResponse(409, "The user has been deleted and cannot be disabled");
  }
  const updateResult = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: BAN_DURATION,
  });

  if (updateResult.error) {
    return errorResponse(500, "Failed to disable the account");
  }

  await recordAuditLog(supabase, {
    action: "admin.users.disable",
    actorId: user.id,
    targetId: userId,
  });

  return jsonResponse({ success: true });
}
