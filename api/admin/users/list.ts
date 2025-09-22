import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../../_lib/http";
import { requireAdmin } from "../../_lib/auth";

type ProfileRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  deleted_at: string | null;
  mfa_verified_at: string | null;
};

type AdminAssignment = {
  user_id: string;
  deleted_at: string | null;
};

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const { supabase } = context;

  const { data: profiles, error: profileError } = await supabase
    .from<ProfileRecord>("profiles")
    .select("id,email,full_name,created_at,deleted_at,mfa_verified_at")
    .order("full_name", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true, nullsLast: true });

  if (profileError) {
    return errorResponse(500, "Failed to load user directory");
  }

  const { data: adminAssignments, error: adminError } = await supabase
    .from<AdminAssignment>("app_admins")
    .select("user_id,deleted_at");

  if (adminError) {
    return errorResponse(500, "Failed to load admin assignments");
  }

  const adminMap = new Map<string, { active: boolean; revokedAt: string | null }>();
  for (const assignment of adminAssignments ?? []) {
    adminMap.set(assignment.user_id, {
      active: assignment.deleted_at === null,
      revokedAt: assignment.deleted_at,
    });
  }

  const users = (profiles ?? []).map(profile => ({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    createdAt: profile.created_at,
    deletedAt: profile.deleted_at,
    mfaVerifiedAt: profile.mfa_verified_at,
    isAdmin: adminMap.get(profile.id)?.active ?? false,
    adminRevokedAt: adminMap.get(profile.id)?.revokedAt ?? null,
  }));

  return jsonResponse({ users });
}
