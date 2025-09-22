import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationEntry {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
}

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  email_sent: boolean;
}

interface NotificationTemplate {
  subject: string;
  html: string;
  source: "default" | "custom";
}

interface TemplateRecord {
  type: string;
  subject: string;
  html: string;
  updated_at: string;
}

const APPROVAL_NOTIFICATION_TYPES = [
  "resource_approved",
  "blogpost_approved",
  "research_application_approved",
] as const;

type ApprovalNotificationType = (typeof APPROVAL_NOTIFICATION_TYPES)[number];

const DEFAULT_TEMPLATE_CONTENT: Record<ApprovalNotificationType, { subject: string; html: string }> = {
  resource_approved: {
    subject: "Your resource has been approved",
    html: `
      <p>Hi {{userName}},</p>
      <p>Great news! Your resource submission is now approved and available to the SchoolTech Hub community.</p>
      <p><strong>Resource ID:</strong> {{payload.resourceId}}</p>
      <p>You can make additional edits or upload supporting files from your dashboard: <a href="{{resourcesUrl}}">Manage resources</a>.</p>
      <p>Thank you for contributing to the community.<br/>— The SchoolTech Hub Team</p>
    `,
  },
  blogpost_approved: {
    subject: "Your blog post is ready to publish",
    html: `
      <p>Hi {{userName}},</p>
      <p>Your blog submission was reviewed and approved. It will appear on the site shortly.</p>
      <p><strong>Post ID:</strong> {{payload.postId}}</p>
      <p>You can review final details or add imagery from the editorial workspace: <a href="{{blogUrl}}">Open blog workspace</a>.</p>
      <p>Thank you for sharing your expertise.<br/>— The SchoolTech Hub Team</p>
    `,
  },
  research_application_approved: {
    subject: "Your research application was approved",
    html: `
      <p>Hi {{userName}},</p>
      <p>Your application to participate in a research project has been approved.</p>
      <p><strong>Project ID:</strong> {{payload.projectId}}</p>
      <p>You can review onboarding materials and next steps here: <a href="{{researchUrl}}">Research projects</a>.</p>
      <p>We're excited to collaborate with you.<br/>— The SchoolTech Hub Team</p>
    `,
  },
};

const SITE_URL =
  process.env.PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  process.env.VITE_SITE_URL ??
  "https://schooltechub.local";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@schooltechub.local";

const FROM_EMAIL =
  process.env.NOTIFICATION_FROM_EMAIL ??
  `SchoolTech Hub <${process.env.NOTIFICATION_FROM_ADDRESS ?? `no-reply@${new URL(SITE_URL).hostname}`}>`;

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? process.env.RESEND_API_TOKEN ?? null;

export async function createNotification(
  supabase: SupabaseClient,
  entry: NotificationEntry,
): Promise<void> {
  if (!entry.userId || !entry.type) {
    return;
  }

  try {
    const insertResult = await supabase
      .from("notifications")
      .insert({
        user_id: entry.userId,
        type: entry.type,
        payload: entry.payload,
      })
      .select("id, user_id, type, payload, email_sent")
      .single();

    if (insertResult.error || !insertResult.data) {
      return;
    }

    await dispatchNotificationEmail(supabase, {
      id: insertResult.data.id,
      user_id: insertResult.data.user_id,
      type: insertResult.data.type,
      payload:
        (insertResult.data.payload && typeof insertResult.data.payload === "object"
          ? (insertResult.data.payload as Record<string, unknown>)
          : {}),
      email_sent: Boolean(insertResult.data.email_sent),
    });
  } catch {
    // Ignore failures when notifications table or type is unavailable
  }
}

export async function resendNotificationEmail(
  supabase: SupabaseClient,
  notificationId: string,
): Promise<{ sent: boolean; reason?: string }> {
  if (!notificationId) {
    return { sent: false, reason: "invalid_id" };
  }

  try {
    const existing = await supabase
      .from("notifications")
      .select("id, user_id, type, payload, email_sent")
      .eq("id", notificationId)
      .maybeSingle();

    if (existing.error) {
      return { sent: false, reason: "load_failed" };
    }

    if (!existing.data) {
      return { sent: false, reason: "not_found" };
    }

    const record: NotificationRecord = {
      id: existing.data.id,
      user_id: existing.data.user_id,
      type: existing.data.type,
      payload:
        existing.data.payload && typeof existing.data.payload === "object"
          ? (existing.data.payload as Record<string, unknown>)
          : {},
      email_sent: Boolean(existing.data.email_sent),
    };

    const result = await dispatchNotificationEmail(supabase, record);
    return result;
  } catch (error) {
    console.error("Failed to resend notification email", error);
    return { sent: false, reason: "unexpected" };
  }
}

async function dispatchNotificationEmail(
  supabase: SupabaseClient,
  notification: NotificationRecord,
): Promise<{ sent: boolean; reason?: string }> {
  if (!APPROVAL_NOTIFICATION_TYPES.includes(notification.type as ApprovalNotificationType)) {
    return { sent: false, reason: "unsupported_type" };
  }

  const prefs = await loadNotificationPrefs(supabase, notification.user_id);
  if (!isEmailAllowed(prefs, notification.type as ApprovalNotificationType)) {
    return { sent: false, reason: "email_disabled" };
  }

  const userProfile = await loadUserProfile(supabase, notification.user_id);
  if (!userProfile?.email) {
    return { sent: false, reason: "missing_email" };
  }

  const template = await resolveTemplate(supabase, notification.type as ApprovalNotificationType);
  const context = buildTemplateContext(notification, userProfile);
  const subject = renderTemplate(template.subject, context).trim();
  const html = renderTemplate(template.html, context);

  const delivery = await deliverEmail({
    to: userProfile.email,
    subject: subject || template.subject,
    html,
  });

  if (delivery.sent) {
    await markEmailDelivery(supabase, notification.id, true);
    return { sent: true };
  }

  return { sent: false, reason: delivery.reason ?? "delivery_failed" };
}

async function markEmailDelivery(
  supabase: SupabaseClient,
  notificationId: string,
  sent: boolean,
): Promise<void> {
  if (!sent) {
    return;
  }

  try {
    await supabase.from("notifications").update({ email_sent: true }).eq("id", notificationId);
  } catch {
    // Ignore update failures
  }
}

async function loadNotificationPrefs(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  email_enabled: boolean;
  resource_approved: boolean;
  blogpost_approved: boolean;
  research_application_approved: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from("notification_prefs")
      .select(
        "email_enabled, resource_approved, blogpost_approved, research_application_approved",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return {
        email_enabled: true,
        resource_approved: true,
        blogpost_approved: true,
        research_application_approved: true,
      };
    }

    if (!data) {
      return {
        email_enabled: true,
        resource_approved: true,
        blogpost_approved: true,
        research_application_approved: true,
      };
    }

    return {
      email_enabled: data.email_enabled ?? true,
      resource_approved: data.resource_approved ?? true,
      blogpost_approved: data.blogpost_approved ?? true,
      research_application_approved: data.research_application_approved ?? true,
    };
  } catch {
    return {
      email_enabled: true,
      resource_approved: true,
      blogpost_approved: true,
      research_application_approved: true,
    };
  }
}

function isEmailAllowed(
  prefs: {
    email_enabled: boolean;
    resource_approved: boolean;
    blogpost_approved: boolean;
    research_application_approved: boolean;
  },
  type: ApprovalNotificationType,
): boolean {
  if (!prefs.email_enabled) {
    return false;
  }

  switch (type) {
    case "resource_approved":
      return prefs.resource_approved;
    case "blogpost_approved":
      return prefs.blogpost_approved;
    case "research_application_approved":
      return prefs.research_application_approved;
    default:
      return false;
  }
}

async function resolveTemplate(
  supabase: SupabaseClient,
  type: ApprovalNotificationType,
): Promise<NotificationTemplate> {
  const defaultTemplate = DEFAULT_TEMPLATE_CONTENT[type];

  try {
    const { data, error } = await supabase
      .from("notification_templates")
      .select("type, subject, html, updated_at")
      .eq("type", type)
      .maybeSingle<TemplateRecord>();

    if (error || !data) {
      return { ...defaultTemplate, source: "default" };
    }

    return {
      subject: data.subject || defaultTemplate.subject,
      html: data.html || defaultTemplate.html,
      source: "custom",
    };
  } catch {
    return { ...defaultTemplate, source: "default" };
  }
}

async function loadUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ email: string | null; fullName: string | null }> {
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    const authEmail = data?.user?.email ?? null;
    const metadataName =
      (typeof data?.user?.user_metadata?.full_name === "string"
        ? data?.user?.user_metadata?.full_name
        : undefined) ??
      (typeof data?.user?.user_metadata?.name === "string"
        ? data?.user?.user_metadata?.name
        : undefined);

    const profileResult = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const profileName = profileResult.data?.full_name ?? null;
    const profileEmail = profileResult.data?.email ?? null;

    return {
      email: profileEmail ?? authEmail,
      fullName: profileName ?? metadataName ?? null,
    };
  } catch {
    return { email: null, fullName: null };
  }
}

function buildTemplateContext(
  notification: NotificationRecord,
  user: { email: string | null; fullName: string | null },
): Record<string, unknown> {
  const payload = notification.payload ?? {};
  const safePayload = { ...payload } as Record<string, unknown>;

  if (notification.type === "resource_approved" && !safePayload.resourceId) {
    safePayload.resourceId = notification.payload?.resourceId ?? notification.id;
  }
  if (notification.type === "blogpost_approved" && !safePayload.postId) {
    safePayload.postId = notification.payload?.postId ?? notification.id;
  }
  if (notification.type === "research_application_approved") {
    if (!safePayload.projectId) {
      safePayload.projectId = notification.payload?.projectId ?? notification.id;
    }
    if (!safePayload.applicationId) {
      safePayload.applicationId = notification.payload?.applicationId ?? notification.id;
    }
  }

  return {
    userName: user.fullName?.trim() || "there",
    userEmail: user.email,
    payload: safePayload,
    siteUrl: SITE_URL,
    dashboardUrl: `${SITE_URL}/account`,
    resourcesUrl: `${SITE_URL}/account/resources`,
    blogUrl: `${SITE_URL}/account/posts`,
    researchUrl: `${SITE_URL}/account/research`,
    supportEmail: SUPPORT_EMAIL,
  };
}

function renderTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawKey) => {
    const key = String(rawKey);
    const parts = key.split(".");
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === "object" && part in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined || value === null) {
      return "";
    }

    return String(value);
  });
}

async function deliverEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!RESEND_API_KEY) {
    return { sent: false, reason: "missing_api_key" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const message = await safeReadText(response);
      console.error("Failed to deliver email", response.status, message);
      return { sent: false, reason: "provider_error" };
    }

    return { sent: true };
  } catch (error) {
    console.error("Email delivery threw", error);
    return { sent: false, reason: "network_error" };
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

export function getDefaultTemplate(type: ApprovalNotificationType): {
  subject: string;
  html: string;
} {
  return DEFAULT_TEMPLATE_CONTENT[type];
}

export function getApprovalNotificationTypes(): ApprovalNotificationType[] {
  return [...APPROVAL_NOTIFICATION_TYPES];
}
