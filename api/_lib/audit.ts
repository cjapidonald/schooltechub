import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogEntry {
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export function getAuditRequestContext(
  request: Request | null | undefined
): Pick<AuditLogEntry, "ip" | "userAgent"> {
  if (!request) {
    return { ip: null, userAgent: null };
  }

  const headers = request.headers;

  const ipCandidates = [
    headers.get("x-forwarded-for"),
    headers.get("X-Forwarded-For"),
    headers.get("cf-connecting-ip"),
    headers.get("CF-Connecting-IP"),
    headers.get("x-real-ip"),
    headers.get("X-Real-IP"),
    headers.get("remote-addr"),
    headers.get("Remote-Addr"),
  ];

  const ip = ipCandidates
    .map(value => (value ? value.split(",")[0]?.trim() ?? null : null))
    .find(value => value && value.length > 0) ?? null;

  const userAgent =
    headers.get("user-agent") ?? headers.get("User-Agent") ?? null;

  return { ip, userAgent };
}

export async function recordAuditLog(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  const {
    action,
    actorId,
    targetType,
    targetId,
    details = {},
    ip = null,
    userAgent = null,
  } = entry;

  const logDetails = details ?? {};

  if (!action || !actorId || !targetType || !targetId) {
    return;
  }

  try {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      actor_id: actorId,
      target_type: targetType,
      target_id: targetId,
      details: logDetails,
      ip,
      user_agent: userAgent,
    });

    if (error) {
      // Silently ignore insert errors until the audit_logs table is available
      return;
    }
  } catch {
    // Ignore unexpected failures writing audit logs
  }
}
