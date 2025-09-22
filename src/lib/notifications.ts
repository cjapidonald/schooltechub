import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification, NotificationPrefs, NotificationType } from "@/types/platform";

const NOTIFICATION_SELECT = "*";
const PREFS_SELECT = "*";

type Client = SupabaseClient;

export class NotificationDataError extends Error {
  declare cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "NotificationDataError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
    if (options?.cause instanceof Error && options.cause.message) {
      this.message = `${message} (${options.cause.message})`;
    }
  }
}

async function requireUserId(client: Client, action: string): Promise<string> {
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw new NotificationDataError("Unable to verify authentication state.", {
      cause: error,
    });
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new NotificationDataError(`You must be signed in to ${action}.`);
  }

  return userId;
}

function mapNotification(record: Record<string, any>): Notification {
  const payload =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : {};

  return {
    id: String(record.id ?? ""),
    userId: record.user_id ?? record.userId ?? "",
    type: (record.type as NotificationType | undefined) ?? "resource_approved",
    payload,
    isRead: Boolean(record.is_read ?? record.isRead ?? false),
    emailSent: Boolean(record.email_sent ?? record.emailSent ?? false),
    createdAt: record.created_at ?? new Date().toISOString(),
  } satisfies Notification;
}

function mapPrefs(record: Record<string, any>, userId: string): NotificationPrefs {
  return {
    userId,
    emailEnabled: record.email_enabled ?? true,
    resourceApproved: record.resource_approved ?? true,
    blogpostApproved: record.blogpost_approved ?? true,
    researchApplicationApproved: record.research_application_approved ?? true,
    researchSubmissionReviewed: record.research_submission_reviewed ?? true,
    commentReply: record.comment_reply ?? true,
    updatedAt: record.updated_at ?? new Date().toISOString(),
  } satisfies NotificationPrefs;
}

export async function getMyNotifications(
  client: Client = supabase,
): Promise<Notification[]> {
  const userId = await requireUserId(client, "view notifications");

  const { data, error } = await client
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false, nullsLast: true });

  if (error) {
    throw new NotificationDataError("Failed to load notifications.", { cause: error });
  }

  return Array.isArray(data) ? data.map(mapNotification) : [];
}

export async function markRead(
  id: string,
  client: Client = supabase,
): Promise<void> {
  const userId = await requireUserId(client, "update notifications");

  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new NotificationDataError("Failed to mark notification as read.", {
      cause: error,
    });
  }
}

export async function getPrefs(
  client: Client = supabase,
): Promise<NotificationPrefs> {
  const userId = await requireUserId(client, "view notification preferences");

  const { data, error } = await client
    .from("notification_prefs")
    .select(PREFS_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new NotificationDataError("Failed to load notification preferences.", {
      cause: error,
    });
  }

  if (!data) {
    return mapPrefs({}, userId);
  }

  return mapPrefs(data, userId);
}

export interface NotificationPrefsPatch {
  emailEnabled?: boolean;
  resourceApproved?: boolean;
  blogpostApproved?: boolean;
  researchApplicationApproved?: boolean;
  researchSubmissionReviewed?: boolean;
  commentReply?: boolean;
}

export async function updatePrefs(
  patch: NotificationPrefsPatch,
  client: Client = supabase,
): Promise<NotificationPrefs> {
  const userId = await requireUserId(client, "update notification preferences");

  const payload: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (patch.emailEnabled !== undefined) {
    payload.email_enabled = patch.emailEnabled;
  }
  if (patch.resourceApproved !== undefined) {
    payload.resource_approved = patch.resourceApproved;
  }
  if (patch.blogpostApproved !== undefined) {
    payload.blogpost_approved = patch.blogpostApproved;
  }
  if (patch.researchApplicationApproved !== undefined) {
    payload.research_application_approved = patch.researchApplicationApproved;
  }
  if (patch.researchSubmissionReviewed !== undefined) {
    payload.research_submission_reviewed = patch.researchSubmissionReviewed;
  }
  if (patch.commentReply !== undefined) {
    payload.comment_reply = patch.commentReply;
  }

  const { data, error } = await client
    .from("notification_prefs")
    .upsert(payload, { onConflict: "user_id" })
    .select(PREFS_SELECT)
    .single();

  if (error || !data) {
    throw new NotificationDataError("Failed to update notification preferences.", {
      cause: error,
    });
  }

  return mapPrefs(data, userId);
}
