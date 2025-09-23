import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../../_lib/http";
import { requireAdmin } from "../../../_lib/auth";
import { getApprovalNotificationTypes, getDefaultTemplate } from "../../../_lib/notifications";

interface TemplatePayload {
  type?: string;
  subject?: string;
  html?: string;
}

interface TemplateRecord {
  type: string;
  subject: string;
  html: string;
  updated_at: string | null;
}

const SUPPORTED_TYPES = getApprovalNotificationTypes();

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);

  if (!["GET", "PUT", "DELETE"].includes(method)) {
    return methodNotAllowed(["GET", "PUT", "DELETE"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  if (method === "GET") {
    return handleGet(context.supabase);
  }

  if (method === "PUT") {
    const payload = (await parseJsonBody<TemplatePayload>(request)) ?? {};
    const type = typeof payload.type === "string" ? payload.type.trim() : "";
    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const html = typeof payload.html === "string" ? payload.html.trim() : "";

    if (!type) {
      return errorResponse(400, "A notification type is required");
    }

    if (!isSupportedType(type)) {
      return errorResponse(400, "Unsupported notification type");
    }

    if (!subject) {
      return errorResponse(400, "An email subject is required");
    }

    if (!html) {
      return errorResponse(400, "Email body content is required");
    }

    const { error } = await context.supabase
      .from("notification_templates")
      .upsert({ type, subject, html }, { onConflict: "type" });

    if (error) {
      return errorResponse(500, "Failed to save template");
    }

    return jsonResponse({ success: true });
  }

  if (method === "DELETE") {
    const payload = (await parseJsonBody<TemplatePayload>(request)) ?? {};
    const type = typeof payload.type === "string" ? payload.type.trim() : "";

    if (!type) {
      return errorResponse(400, "A notification type is required");
    }

    if (!isSupportedType(type)) {
      return errorResponse(400, "Unsupported notification type");
    }

    const { error } = await context.supabase
      .from("notification_templates")
      .delete()
      .eq("type", type);

    if (error) {
      return errorResponse(500, "Failed to reset template");
    }

    return jsonResponse({ success: true });
  }

  return methodNotAllowed(["GET", "PUT", "DELETE"]);
}

type SupabaseClientType = typeof requireAdmin extends () => Promise<infer T>
  ? T extends { supabase: infer C }
    ? C
    : never
  : never;

async function handleGet(supabase: SupabaseClientType): Promise<Response> {
  const types = SUPPORTED_TYPES;

  const { data, error } = await supabase
    .from("notification_templates")
    .select<TemplateRecord>("type, subject, html, updated_at")
    .in("type", types);

  if (error) {
    return errorResponse(500, "Failed to load templates");
  }

  const map = new Map<string, TemplateRecord>();
  for (const row of data ?? []) {
    map.set(row.type, row);
  }

  const templates = types.map(type => {
    const record = map.get(type);
    const defaults = getDefaultTemplate(type);

    return {
      type,
      subject: record?.subject ?? defaults.subject,
      html: record?.html ?? defaults.html,
      updatedAt: record?.updated_at ?? null,
      isCustom: Boolean(record),
      defaultSubject: defaults.subject,
      defaultHtml: defaults.html,
    };
  });

  return jsonResponse({ templates });
}

function isSupportedType(type: string): boolean {
  return SUPPORTED_TYPES.includes(type as (typeof SUPPORTED_TYPES)[number]);
}
