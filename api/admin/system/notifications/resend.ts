import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../../_lib/http";
import { requireAdmin } from "../../../_lib/auth";
import { resendNotificationEmail } from "../../../_lib/notifications";

interface ResendPayload {
  id?: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const payload = (await parseJsonBody<ResendPayload>(request)) ?? {};
  const id = typeof payload.id === "string" ? payload.id.trim() : "";

  if (!id) {
    return errorResponse(400, "A notification id is required");
  }

  const result = await resendNotificationEmail(context.supabase, id);

  if (!result.sent) {
    return jsonResponse({ success: false, reason: result.reason ?? "delivery_failed" });
  }

  return jsonResponse({ success: true });
}
