import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../../_lib/http";
import { requireAdmin } from "../../_lib/auth";

interface AdminRecord {
  user_id: string;
  granted_at: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const { supabase } = context;
  const adminsResult = await supabase
    .from<AdminRecord>("app_admins")
    .select("user_id, granted_at")
    .order("granted_at", { ascending: false, nullsLast: true });

  if (adminsResult.error) {
    return errorResponse(500, "Failed to load admin roster");
  }

  const records = adminsResult.data ?? [];
  const lookups = await Promise.all(
    records.map(async record => {
      const lookup = await supabase.auth.admin.getUserById(record.user_id);
      if (lookup.error || !lookup.data?.user) {
        return {
          userId: record.user_id,
          email: null as string | null,
          grantedAt: record.granted_at,
        };
      }

      return {
        userId: record.user_id,
        email: lookup.data.user.email ?? null,
        grantedAt: record.granted_at,
      };
    }),
  );

  return jsonResponse({ admins: lookups });
}
