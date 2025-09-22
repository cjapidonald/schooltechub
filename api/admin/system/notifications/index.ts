import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../../../_lib/http";
import { requireAdmin } from "../../../_lib/auth";
import { getApprovalNotificationTypes } from "../../../_lib/notifications";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  payload: unknown;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
  const url = new URL(request.url);
  const typeFilter = (url.searchParams.get("type") ?? "").trim();
  const userFilter = (url.searchParams.get("user") ?? "").trim();
  const limitParam = url.searchParams.get("limit");
  const limit = Number.isFinite(limitParam ? Number.parseInt(limitParam, 10) : NaN)
    ? Number.parseInt(limitParam ?? "50", 10)
    : 50;
  const cappedLimit = Math.min(Math.max(limit || 50, 1), 200);

  let userIds: string[] | undefined;
  if (userFilter) {
    if (isUuid(userFilter)) {
      userIds = [userFilter];
    } else {
      const profileMatches = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", `%${userFilter}%`)
        .limit(50);

      if (profileMatches.error) {
        return errorResponse(500, "Failed to search for user");
      }

      const matches = (profileMatches.data ?? []).map(record => record.id).filter(Boolean);
      if (matches.length === 0) {
        return jsonResponse({ notifications: [], availableTypes: buildTypeOptions() });
      }

      userIds = matches;
    }
  }

  let query = supabase
    .from("notifications")
    .select<NotificationRow>("id, user_id, type, payload, is_read, email_sent, created_at")
    .order("created_at", { ascending: false, nullsLast: true })
    .limit(cappedLimit);

  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }

  if (userIds && userIds.length > 0) {
    query = query.in("user_id", userIds);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(500, "Failed to load notifications");
  }

  const notifications = Array.isArray(data) ? data : [];
  const uniqueUserIds = Array.from(new Set(notifications.map(item => item.user_id).filter(Boolean)));

  const profileMap = await loadProfiles(supabase, uniqueUserIds);
  const authMap = await loadAuthEmails(supabase, uniqueUserIds);

  const result = notifications.map(item => {
    const payload =
      item.payload && typeof item.payload === "object"
        ? (item.payload as Record<string, unknown>)
        : {};
    const profile = profileMap.get(item.user_id);
    const authEmail = authMap.get(item.user_id) ?? null;

    return {
      id: item.id,
      type: item.type,
      createdAt: item.created_at,
      isRead: Boolean(item.is_read),
      emailSent: Boolean(item.email_sent),
      payload,
      user: {
        id: item.user_id,
        email: profile?.email ?? authEmail,
        name: profile?.full_name ?? null,
      },
    };
  });

  return jsonResponse({ notifications: result, availableTypes: buildTypeOptions() });
}

function buildTypeOptions(): string[] {
  const base = new Set<string>([...getApprovalNotificationTypes(), "comment_reply"]);
  return Array.from(base.values());
}

type SupabaseClientType = Awaited<ReturnType<typeof requireAdmin>> extends { supabase: infer C }
  ? C
  : never;

async function loadProfiles(
  supabase: SupabaseClientType,
  userIds: string[],
): Promise<Map<string, { email: string | null; full_name: string | null }>> {
  const map = new Map<string, { email: string | null; full_name: string | null }>();
  if (userIds.length === 0) {
    return map;
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    for (const row of data ?? []) {
      map.set(row.id, { email: row.email ?? null, full_name: row.full_name ?? null });
    }
  } catch (error) {
    console.error("Failed to load profiles", error);
  }

  return map;
}

async function loadAuthEmails(
  supabase: SupabaseClientType,
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) {
    return map;
  }

  await Promise.all(
    userIds.map(async id => {
      try {
        const { data } = await supabase.auth.admin.getUserById(id);
        const email = data?.user?.email;
        if (email) {
          map.set(id, email);
        }
      } catch (error) {
        console.error("Failed to load auth user", error);
      }
    }),
  );

  return map;
}
