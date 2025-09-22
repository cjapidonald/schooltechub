import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogEntry {
  action: string;
  actorId: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordAuditLog(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  const { action, actorId, targetId = null, metadata = null } = entry;

  if (!action || !actorId) {
    return;
  }

  try {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      actor_id: actorId,
      target_id: targetId,
      metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Silently ignore insert errors until the audit_logs table is available
      return;
    }
  } catch {
    // Ignore unexpected failures writing audit logs
  }
}
