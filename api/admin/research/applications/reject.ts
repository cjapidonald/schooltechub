import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../../_lib/http";
import { recordAuditLog } from "../../../_lib/audit";
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
  project?: { id: string; title?: string | null } | null;
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
  const existingResult = await supabase
    .from<ResearchApplicationRecord>("research_applications")
    .select("id, applicant_id, project_id, status, project:research_projects ( id, title )")
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

  let projectTitle = existingResult.data.project?.title ?? null;
  if (!projectTitle) {
    const projectResult = await supabase
      .from<{ title?: string | null }>("research_projects")
      .select("title")
      .eq("id", updateResult.data.project_id)
      .maybeSingle();

    if (!projectResult.error) {
      projectTitle = projectResult.data?.title ?? null;
    }
  }

  await createNotification(
    updateResult.data.applicant_id,
    "research_application_approved",
    {
      applicationId,
      projectId: updateResult.data.project_id,
      projectTitle,
      status: "rejected",
      previousStatus: existingResult.data.status,
    },
    { sendEmail: false }
  );

  await recordAuditLog(supabase, {
    action: "admin.research.applications.reject",
    actorId: user.id,
    targetId: applicationId,
    metadata: {
      projectId: updateResult.data.project_id,
      previousStatus: existingResult.data.status,
    },
  });

  return jsonResponse({ success: true, application: updateResult.data });
}
