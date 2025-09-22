import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../../_lib/http";
import { getAuditRequestContext, recordAuditLog } from "../../../_lib/audit";
import { requireAdmin } from "../../../_lib/auth";
import { createNotification } from "../../../_lib/notifications";

interface ModerationPayload {
  id?: string;
}

interface ResearchApplicationRecord {
  id: string;
  applicant_id: string;
  project_id: string;
  status: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const payload = (await parseJsonBody<ModerationPayload>(request)) ?? {};
  const applicationId = typeof payload.id === "string" ? payload.id.trim() : "";

  if (applicationId.length === 0) {
    return errorResponse(400, "An application id is required");
  }

  const { supabase, user } = context;
  const auditContext = getAuditRequestContext(request);
  const existingResult = await supabase
    .from<ResearchApplicationRecord>("research_applications")
    .select("id, applicant_id, project_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (existingResult.error) {
    return errorResponse(500, "Failed to load research application");
  }

  if (!existingResult.data) {
    return errorResponse(404, "Research application not found");
  }

  const now = new Date().toISOString();
  const updateResult = await supabase
    .from("research_applications")
    .update({
      status: "rejected",
      approved_by: user.id,
      approved_at: now,
    })
    .eq("id", applicationId)
    .select("id, applicant_id, project_id, status, approved_by, approved_at")
    .maybeSingle();

  if (updateResult.error || !updateResult.data) {
    return errorResponse(500, "Failed to reject research application");
  }

  await createNotification(supabase, {
    userId: updateResult.data.applicant_id,
    type: "research_application_approved",
    payload: {
      applicationId,
      projectId: updateResult.data.project_id,
      status: "rejected",
      previousStatus: existingResult.data.status,
    },
  });

  await recordAuditLog(supabase, {
    action: "admin.research.applications.reject",
    actorId: user.id,
    targetType: "research_application",
    targetId: applicationId,
    details: {
      projectId: updateResult.data.project_id,
      previousStatus: existingResult.data.status,
      rejectedAt: now,
    },
    ...auditContext,
  });

  return jsonResponse({ success: true, application: updateResult.data });
}
