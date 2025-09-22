import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ResearchApplication,
  ResearchApplicationStatus,
  ResearchDocument,
  ResearchDocumentStatus,
  ResearchProject,
  ResearchProjectStatus,
  ResearchProjectVisibility,
  ResearchSubmission,
  ResearchSubmissionStatus,
} from "@/types/platform";

const PROJECT_SELECT = "*";
const DOCUMENT_SELECT = "*";
const APPLICATION_SELECT = "*";
const PARTICIPANT_SELECT = "id";
const SUBMISSION_SELECT = "*";

const SUBMISSIONS_BUCKET = "research-submissions";

type Client = SupabaseClient;

type ProjectListFilters = {
  q?: string;
  status?: ResearchProjectStatus;
};

type SubmissionFile = File | Blob;

export class ResearchDataError extends Error {
  declare cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ResearchDataError";
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
    throw new ResearchDataError("Unable to verify authentication state.", {
      cause: error,
    });
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new ResearchDataError(`You must be signed in to ${action}.`);
  }

  return userId;
}

function mapProject(record: Record<string, any>): ResearchProject {
  return {
    id: String(record.id ?? ""),
    title: record.title ?? "Untitled project",
    slug: record.slug ?? null,
    summary: record.summary ?? null,
    status: (record.status as ResearchProjectStatus | undefined) ?? "open",
    visibility: (record.visibility as ResearchProjectVisibility | undefined) ?? "list_public",
    createdBy: record.created_by ?? record.createdBy ?? null,
    createdAt: record.created_at ?? new Date().toISOString(),
  } satisfies ResearchProject;
}

function mapDocument(record: Record<string, any>): ResearchDocument {
  return {
    id: String(record.id ?? ""),
    projectId: record.project_id ?? record.projectId ?? "",
    title: record.title ?? null,
    docType: (record.doc_type as ResearchDocument["docType"]) ?? null,
    storagePath: record.storage_path ?? record.storagePath ?? null,
    status: (record.status as ResearchDocumentStatus | undefined) ?? "participant",
    createdAt: record.created_at ?? new Date().toISOString(),
  } satisfies ResearchDocument;
}

function mapApplication(record: Record<string, any>): ResearchApplication {
  return {
    id: String(record.id ?? ""),
    projectId: record.project_id ?? record.projectId ?? "",
    applicantId: record.applicant_id ?? record.applicantId ?? "",
    status: (record.status as ResearchApplicationStatus | undefined) ?? "pending",
    statement: record.statement ?? null,
    submittedAt: record.submitted_at ?? new Date().toISOString(),
    approvedAt: record.approved_at ?? null,
    approvedBy: record.approved_by ?? null,
  } satisfies ResearchApplication;
}

function mapSubmission(record: Record<string, any>): ResearchSubmission {
  return {
    id: String(record.id ?? ""),
    projectId: record.project_id ?? record.projectId ?? "",
    participantId: record.participant_id ?? record.participantId ?? "",
    title: record.title ?? null,
    description: record.description ?? null,
    storagePath: record.storage_path ?? record.storagePath ?? null,
    status: (record.status as ResearchSubmissionStatus | undefined) ?? "submitted",
    reviewedBy: record.reviewed_by ?? null,
    reviewedAt: record.reviewed_at ?? null,
    reviewNote: record.review_note ?? record.reviewNote ?? null,
    submittedAt: record.submitted_at ?? record.created_at ?? null,
  } satisfies ResearchSubmission;
}

export async function listProjects(
  filters: ProjectListFilters = {},
  client: Client = supabase,
): Promise<ResearchProject[]> {
  let query = client
    .from("research_projects")
    .select(PROJECT_SELECT)
    .order("created_at", { ascending: false, nullsLast: true });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    const sanitized = filters.q.replace(/[%_]/g, match => `\\${match}`);
    query = query.ilike("title", `%${sanitized}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new ResearchDataError("Failed to load research projects.", { cause: error });
  }

  return Array.isArray(data) ? data.map(mapProject) : [];
}

export async function getProject(
  slug: string,
  client: Client = supabase,
): Promise<ResearchProject | null> {
  const { data, error } = await client
    .from("research_projects")
    .select(PROJECT_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new ResearchDataError("Failed to load the research project.", { cause: error });
  }

  return data ? mapProject(data) : null;
}

export async function apply(
  projectId: string,
  statement: string,
  client: Client = supabase,
): Promise<ResearchApplication> {
  const userId = await requireUserId(client, "apply to research projects");

  const { data: existing, error: existingError } = await client
    .from("research_applications")
    .select("id,status")
    .eq("project_id", projectId)
    .eq("applicant_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new ResearchDataError("Failed to verify existing applications.", {
      cause: existingError,
    });
  }

  if (existing && existing.status !== "rejected") {
    throw new ResearchDataError("You have already applied to this project.");
  }

  const { data, error } = await client
    .from("research_applications")
    .insert({
      project_id: projectId,
      applicant_id: userId,
      statement,
    })
    .select(APPLICATION_SELECT)
    .single();

  if (error || !data) {
    throw new ResearchDataError("Failed to submit your application.", { cause: error });
  }

  return mapApplication(data);
}

export async function listMyApplications(
  client: Client = supabase,
): Promise<ResearchApplication[]> {
  const userId = await requireUserId(client, "view your research applications");

  const { data, error } = await client
    .from("research_applications")
    .select(APPLICATION_SELECT)
    .eq("applicant_id", userId)
    .order("submitted_at", { ascending: false, nullsLast: true });

  if (error) {
    throw new ResearchDataError("Failed to load your applications.", { cause: error });
  }

  return Array.isArray(data) ? data.map(mapApplication) : [];
}

export async function listParticipantDocs(
  projectId: string,
  client: Client = supabase,
): Promise<ResearchDocument[]> {
  const { data, error } = await client
    .from("research_documents")
    .select(DOCUMENT_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true, nullsLast: false });

  if (error) {
    throw new ResearchDataError("Failed to load project documents.", { cause: error });
  }

  return Array.isArray(data) ? data.map(mapDocument) : [];
}

export interface SubmissionMeta {
  title?: string | null;
  description?: string | null;
  filename?: string;
  contentType?: string;
}

async function ensureParticipant(
  client: Client,
  projectId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await client
    .from("research_participants")
    .select(PARTICIPANT_SELECT)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ResearchDataError("Failed to verify project participation.", {
      cause: error,
    });
  }

  if (!data) {
    throw new ResearchDataError("You must be an approved participant before submitting work.");
  }
}

function inferFilename(file: SubmissionFile, meta?: SubmissionMeta): string {
  if (meta?.filename) {
    return meta.filename;
  }

  if (typeof File !== "undefined" && file instanceof File && file.name) {
    return file.name;
  }

  return `${crypto.randomUUID()}.bin`;
}

function inferContentType(file: SubmissionFile, meta?: SubmissionMeta): string {
  if (meta?.contentType) {
    return meta.contentType;
  }

  if (typeof File !== "undefined" && file instanceof File && file.type) {
    return file.type;
  }

  return "application/octet-stream";
}

export async function uploadSubmission(
  projectId: string,
  file: SubmissionFile,
  meta: SubmissionMeta = {},
  client: Client = supabase,
): Promise<ResearchSubmission> {
  const userId = await requireUserId(client, "upload research submissions");
  await ensureParticipant(client, projectId, userId);

  const filename = inferFilename(file, meta);
  const extensionMatch = filename.match(/\.([^.]+)$/);
  const extension = extensionMatch ? extensionMatch[1] : "dat";
  const storagePath = `${projectId}/${userId}/${crypto.randomUUID()}.${extension}`;

  const contentType = inferContentType(file, meta);

  const { error: uploadError } = await client.storage
    .from(SUBMISSIONS_BUCKET)
    .upload(storagePath, file instanceof Blob ? file : new Blob([file]), {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new ResearchDataError("Failed to upload the submission file.", {
      cause: uploadError,
    });
  }

  const { data, error } = await client
    .from("research_submissions")
    .insert({
      project_id: projectId,
      participant_id: userId,
      title: meta.title ?? (filename ? filename.replace(/\.[^.]+$/, "") : null),
      description: meta.description ?? null,
      storage_path: storagePath,
      status: "submitted",
    })
    .select(SUBMISSION_SELECT)
    .single();

  if (error || !data) {
    throw new ResearchDataError("Failed to record the submission.", { cause: error });
  }

  return mapSubmission(data);
}

export async function listMySubmissions(
  projectId: string,
  client: Client = supabase,
): Promise<ResearchSubmission[]> {
  const userId = await requireUserId(client, "view your submissions");

  const { data, error } = await client
    .from("research_submissions")
    .select(SUBMISSION_SELECT)
    .eq("project_id", projectId)
    .eq("participant_id", userId)
    .order("reviewed_at", { ascending: false, nullsLast: true });

  if (error) {
    throw new ResearchDataError("Failed to load your submissions.", { cause: error });
  }

  return Array.isArray(data) ? data.map(mapSubmission) : [];
}
