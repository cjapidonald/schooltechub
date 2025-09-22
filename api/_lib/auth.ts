import type { SupabaseClient, User } from "@supabase/supabase-js";
import { errorResponse } from "./http";
import { getSupabaseClient } from "./supabase";

export interface AdminRequestContext {
  supabase: SupabaseClient;
  user: User;
}

export async function requireAdmin(
  request: Request
): Promise<AdminRequestContext | Response> {
  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(401, "Authentication required");
  }

  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !authData?.user) {
    return errorResponse(401, "Authentication required");
  }

  const isAdminUser = await isAdmin(supabase, authData.user.id);
  if (!isAdminUser) {
    return errorResponse(403, "You do not have permission to perform this action");
  }

  return { supabase, user: authData.user };
}

function extractAccessToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (header) {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const cookieHeader = request.headers.get("cookie") ?? request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";");
    for (const rawCookie of cookies) {
      const [name, ...rest] = rawCookie.trim().split("=");
      if (name === "sb-access-token") {
        return decodeURIComponent(rest.join("="));
      }
    }
  }

  return null;
}

async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc<boolean>("is_admin", { user_id: userId });
    if (!error && typeof data === "boolean") {
      return data;
    }
  } catch {
    // Ignore RPC errors and fall back to other checks
  }

  try {
    const { data, error } = await supabase.rpc<boolean>("is_admin");
    if (!error && typeof data === "boolean") {
      return data;
    }
  } catch {
    // Ignore RPC errors and fall back to table lookup
  }

  try {
    const { data, error } = await supabase
      .from<{ user_id: string }>("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return false;
    }

    return Boolean(data?.user_id);
  } catch {
    return false;
  }
}
