import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../../../_lib/http";
import { recordAuditLog } from "../../../_lib/audit";
import { requireAdmin } from "../../../_lib/auth";

const VALID_DOC_TYPES = new Set(["protocol", "consent", "dataset", "report", "misc"]);
const VALID_STATUSES = new Set(["internal", "participant", "public"]);

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function resolveExtension(file: File): string {
  const parts = file.name?.split?.(".") ?? [];
  const ext = parts.length > 1 ? parts.pop() : null;
  if (ext && ext.length <= 8) {
    return ext.toLowerCase();
  }
  if (file.type && file.type.includes("/")) {
    return file.type.split("/").pop() ?? "bin";
  }
  return "bin";
}

function parseOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "Invalid form data");
  }

  const file = formData.get("file");
  const projectIdRaw = formData.get("projectId");

  if (!(file instanceof File)) {
    return errorResponse(400, "A file upload is required");
  }

  if (typeof projectIdRaw !== "string" || projectIdRaw.trim().length === 0) {
    return errorResponse(400, "A project id is required");
  }

  const projectId = projectIdRaw.trim();
  const title = parseOptionalString(formData.get("title")) ?? file.name ?? "Untitled Document";
  const docTypeRaw = parseOptionalString(formData.get("docType"));
  const statusRaw = parseOptionalString(formData.get("status"));

  const docType = docTypeRaw && VALID_DOC_TYPES.has(docTypeRaw) ? docTypeRaw : null;
  const status = statusRaw && VALID_STATUSES.has(statusRaw) ? statusRaw : "internal";

  const { supabase, user } = context;
  const extension = resolveExtension(file);
  const safeName = sanitizeFileName(file.name || "document");
  const timestamp = Date.now();
  const path = `${projectId}/${timestamp}-${safeName}.${extension}`;

  const uploadResult = await supabase.storage.from("research").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });

  if (uploadResult.error) {
    return errorResponse(500, "Failed to upload document");
  }

  const insertResult = await supabase
    .from("research_documents")
    .insert({
      project_id: projectId,
      title,
      doc_type: docType,
      storage_path: path,
      status,
    })
    .select("id, project_id, title, doc_type, storage_path, status, created_at")
    .maybeSingle();

  if (insertResult.error || !insertResult.data) {
    return errorResponse(500, "Failed to register research document");
  }

  await recordAuditLog(supabase, {
    action: "admin.research.documents.upload",
    actorId: user.id,
    targetId: insertResult.data.id,
    metadata: {
      projectId,
      path,
      docType,
      status,
    },
  });

  return jsonResponse({
    success: true,
    document: insertResult.data,
  });
}
