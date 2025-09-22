import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../../_lib/http";
import { requireUser } from "../../_lib/auth";

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  if (method !== "POST" && method !== "DELETE") {
    return methodNotAllowed(["POST", "DELETE"]);
  }

  const context = await requireUser(request);
  if (context instanceof Response) {
    return context;
  }

  const { supabase, user } = context;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return errorResponse(500, "Failed to load your profile");
  }

  if (!profile) {
    return errorResponse(404, "Profile not found");
  }

  if (profile.deleted_at) {
    return errorResponse(403, "Your profile is disabled. Contact support for assistance.");
  }

  if (method === "DELETE") {
    const { error } = await supabase
      .from("profiles")
      .update({ mfa_verified_at: null })
      .eq("id", user.id);

    if (error) {
      return errorResponse(500, "Failed to clear MFA verification");
    }

    return jsonResponse({ success: true, verifiedAt: null });
  }

  const verifiedAt = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ mfa_verified_at: verifiedAt })
    .eq("id", user.id);

  if (error) {
    return errorResponse(500, "Failed to mark MFA as verified");
  }

  return jsonResponse({ success: true, verifiedAt });
}
