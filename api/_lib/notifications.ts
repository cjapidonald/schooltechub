import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationEntry {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
}

export async function createNotification(
  supabase: SupabaseClient,
  entry: NotificationEntry
): Promise<void> {
  if (!entry.userId || !entry.type) {
    return;
  }

  try {
    await supabase.from("notifications").insert({
      user_id: entry.userId,
      type: entry.type,
      payload: entry.payload,
    });
  } catch {
    // Ignore failures when notifications table or type is unavailable
  }
}
