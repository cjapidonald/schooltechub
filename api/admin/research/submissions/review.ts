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

interface ReviewPayload {
  id?: string;
  status?: string;
  note?: string | null;
}

interface SubmissionRecord {
  id: string;
  project_id: string;
  participant_id: string;
  status: string;
}

const ALLOWED_STATUSES = new Set<"accepted" | "needs_changes">([
  "accepted",
  "needs_changes",
]);

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const payload = (await parseJsonBody<ReviewPayload>(request)) ?? {};
  const submissionId = typeof payload.id === "string" ? payload.id.trim() : "";
  const status = typeof payload.status === "string" ? payload.status.trim() : "";
  const note = typeof payload.note === "string" ? payload.note.trim() : null;

  if (!submissionId) {
    return errorResponse(400, "A submission id is required");
  }

  if (!ALLOWED_STATUSES.has(status as "accepted" | "needs_changes")) {
    return errorResponse(400, "A valid status is required");
  }

  const { supabase, user } = context;

  const existingResult = await supabase
    .from<SubmissionRecord>("research_submissions")
    .select("id, project_id, participant_id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (existingResult.error) {
    return errorResponse(500, "Failed to load submission");
  }

  if (!existingResult.data) {
    return errorResponse(404, "Submission not found");
  }

  const now = new Date().toISOString();

  const updateResult = await supabase
    .from("research_submissions")
    .update({
      status,
      review_note: note,
      reviewed_by: user.id,
      reviewed_at: now,
    })
    .eq("id", submissionId)
    .select("id, project_id, participant_id, status, review_note, reviewed_by, reviewed_at")
    .maybeSingle();

  if (updateResult.error || !updateResult.data) {
    return errorResponse(500, "Failed to update submission");
  }

  await createNotification(supabase, {
    userId: updateResult.data.participant_id,
    type: "research_submission_reviewed",
    payload: {
      submissionId,
      projectId: updateResult.data.project_id,
      status,
      previousStatus: existingResult.data.status,
      note,
    },
  });

  await recordAuditLog(supabase, {
    action: "admin.research.submissions.review",
    actorId: user.id,
    targetId: submissionId,
    metadata: {
      projectId: updateResult.data.project_id,
      previousStatus: existingResult.data.status,
      status,
      note,
    },
  });

  return jsonResponse({ success: true, submission: updateResult.data });
}
