import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";
import { sendEmail, type EmailContent } from "./email";

export type NotificationType =
  | "resource_approved"
  | "blogpost_approved"
  | "research_application_approved"
  | "comment_reply";

interface NotificationPrefsRow {
  email_enabled?: boolean | null;
  resource_approved?: boolean | null;
  blogpost_approved?: boolean | null;
  research_application_approved?: boolean | null;
  comment_reply?: boolean | null;
}

interface NotificationInsert {
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}

export interface CreateNotificationOptions {
  sendEmail?: boolean;
  supabase?: SupabaseClient;
}

const PREFS_SELECT =
  "email_enabled, resource_approved, blogpost_approved, research_application_approved, comment_reply";

const TYPE_PREF_KEY: Record<NotificationType, keyof NotificationPrefsRow> = {
  resource_approved: "resource_approved",
  blogpost_approved: "blogpost_approved",
  research_application_approved: "research_application_approved",
  comment_reply: "comment_reply",
};

function getBaseUrl(): string {
  const raw =
    process.env.APP_BASE_URL ??
    process.env.PUBLIC_APP_URL ??
    process.env.SITE_URL ??
    process.env.VITE_SITE_URL ??
    "https://schooltechhub.com";

  return raw.replace(/\/$/, "");
}

function buildNotificationUrl(): string {
  const base = getBaseUrl();
  return `${base}/account?tab=notifications`;
}

function buildEmailContent(
  type: NotificationType,
  payload: Record<string, unknown>
): EmailContent {
  const link = buildNotificationUrl();

  switch (type) {
    case "resource_approved": {
      const title = typeof payload.title === "string" ? payload.title : "your resource";
      return {
        subject: "Your resource was approved",
        text: `Great news! “${title}” is now live on SchoolTech Hub. View the update: ${link}`,
      };
    }
    case "blogpost_approved": {
      const title = typeof payload.title === "string" ? payload.title : "your blog post";
      return {
        subject: "Your blog post was approved",
        text: `Your blog post “${title}” has been approved. See what's next: ${link}`,
      };
    }
    case "research_application_approved": {
      const title =
        typeof payload.projectTitle === "string" ? payload.projectTitle : "your research project";
      return {
        subject: "Your research application was approved",
        text: `You're in! Your application for “${title}” has been approved. View details: ${link}`,
      };
    }
    case "comment_reply": {
      return {
        subject: "Someone replied to your comment",
        text: `There's new activity on your comment. Continue the conversation: ${link}`,
      };
    }
    default: {
      return {
        subject: "You have a new notification",
        text: `You have a new update waiting for you. View it on SchoolTech Hub: ${link}`,
      };
    }
  }
}

async function loadNotificationPrefs(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPrefsRow | null> {
  try {
    const { data, error } = await supabase
      .from<NotificationPrefsRow>("notification_prefs")
      .select(PREFS_SELECT)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data ?? null;
  } catch {
    return null;
  }
}

async function lookupUserEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (!error && data?.user?.email) {
      return data.user.email;
    }
  } catch {
    // Ignore errors from admin client lookup
  }

  return null;
}

function shouldSendEmailForType(
  prefs: NotificationPrefsRow | null,
  type: NotificationType
): boolean {
  if (!prefs) {
    return true;
  }

  const emailEnabled = prefs.email_enabled ?? true;
  if (!emailEnabled) {
    return false;
  }

  const typePrefKey = TYPE_PREF_KEY[type];
  const typePreference = prefs[typePrefKey];

  if (typePreference === false) {
    return false;
  }

  return true;
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
  options: CreateNotificationOptions = {}
): Promise<void> {
  if (!userId || !type) {
    return;
  }

  const supabase = options.supabase ?? getSupabaseClient();
  const entry: NotificationInsert = { user_id: userId, type, payload };

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert(entry)
      .select("id")
      .single();

    if (error || !data?.id) {
      return;
    }

    if (options.sendEmail === false) {
      return;
    }

    const prefs = await loadNotificationPrefs(supabase, userId);
    if (!shouldSendEmailForType(prefs, type)) {
      return;
    }

    const recipient = await lookupUserEmail(supabase, userId);
    if (!recipient) {
      return;
    }

    const emailContent = buildEmailContent(type, payload);
    const sent = await sendEmail({ ...emailContent, to: recipient });

    if (sent) {
      await supabase
        .from("notifications")
        .update({ email_sent: true })
        .eq("id", data.id as string);
    }
  } catch {
    // Ignore failures when notifications table or email provider is unavailable
  }
}

export async function notifyCommentReply(
  userId: string,
  payload: Record<string, unknown>,
  options?: CreateNotificationOptions
): Promise<void> {
  await createNotification(userId, "comment_reply", payload, options);
}
