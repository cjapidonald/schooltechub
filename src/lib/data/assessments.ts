import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssessmentGrade, AssessmentSubmission, AssessmentTemplate, GradeScale } from "@/types/platform";

const randomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

type Client = SupabaseClient;

const toStringOrNull = (value: unknown): string | null => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const DEMO_ASSESSMENTS: AssessmentTemplate[] = [
  {
    id: "demo-assessment-1",
    classId: "demo-class-1",
    title: "Forces and Motion Quiz",
    description: "Short multiple-choice quiz covering Newton's laws.",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    gradingScale: "percentage",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-assessment-2",
    classId: "demo-class-1",
    title: "Narrative Draft",
    description: "Students submit a 500-word story draft for review.",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString(),
    gradingScale: "rubric",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_GRADES: AssessmentGrade[] = [
  {
    id: "demo-grade-1",
    assessmentId: "demo-assessment-1",
    studentId: "demo-student-1",
    gradeValue: "92%",
    gradeNumeric: 92,
    scale: "percentage",
    gradedAt: new Date().toISOString(),
    feedback: "Great job explaining balanced forces.",
    recordedBy: "demo-teacher",
  },
];

const DEMO_SUBMISSIONS: AssessmentSubmission[] = [
  {
    id: "demo-submission-1",
    assessmentId: "demo-assessment-2",
    studentId: "demo-student-1",
    status: "submitted",
    submittedAt: new Date().toISOString(),
    attachments: [
      { id: "demo-attachment-1", name: "Narrative Draft.docx", url: null },
    ],
  },
];

function isTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "42P01" || code === "42703";
}

async function hasActiveSession(client: Client): Promise<boolean> {
  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      console.warn("auth session check failed, falling back to demo assessments", error);
      return false;
    }
    return Boolean(data.session?.user);
  } catch (error) {
    console.warn("auth session lookup threw, falling back to demo assessments", error);
    return false;
  }
}

function mapScale(value: unknown): GradeScale {
  if (value === "letter" || value === "percentage" || value === "points" || value === "rubric") {
    return value;
  }
  return "letter";
}

function mapAssessment(record: Record<string, unknown>): AssessmentTemplate {
  return {
    id: String(record.id ?? randomId()),
    classId: String(record.class_id ?? record.classId ?? ""),
    title: toStringOrNull(record.title) ?? "Untitled assessment",
    description: toStringOrNull(record.description) ?? toStringOrNull(record.summary),
    dueDate: toStringOrNull(record.due_date) ?? toStringOrNull(record.dueDate),
    gradingScale: mapScale(record.grading_scale ?? record.gradingScale),
    createdAt: toStringOrNull(record.created_at) ?? toStringOrNull(record.createdAt),
    updatedAt: toStringOrNull(record.updated_at) ?? toStringOrNull(record.updatedAt),
  } satisfies AssessmentTemplate;
}

function mapGrade(record: Record<string, unknown>): AssessmentGrade {
  return {
    id: String(record.id ?? randomId()),
    assessmentId: String(record.assessment_id ?? record.assessmentId ?? ""),
    studentId: String(record.student_id ?? record.studentId ?? ""),
    gradeValue: toStringOrNull(record.grade_value) ?? toStringOrNull(record.grade),
    gradeNumeric: toNumberOrNull(record.grade_numeric) ?? toNumberOrNull(record.gradeNumeric),
    scale: mapScale(record.scale),
    gradedAt: toStringOrNull(record.graded_at) ?? toStringOrNull(record.gradedAt),
    feedback: toStringOrNull(record.feedback),
    recordedBy: toStringOrNull(record.recorded_by) ?? toStringOrNull(record.recordedBy),
  } satisfies AssessmentGrade;
}

function mapSubmission(record: Record<string, unknown>): AssessmentSubmission {
  const attachments = Array.isArray(record.attachments)
    ? record.attachments.map((attachment: unknown) => {
        const item = (attachment && typeof attachment === "object"
          ? (attachment as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        return {
          id: String(item.id ?? randomId()),
          name: toStringOrNull(item.name) ?? "Attachment",
          url: toStringOrNull(item.url),
        };
      })
    : [];

  return {
    id: String(record.id ?? randomId()),
    assessmentId: String(record.assessment_id ?? record.assessmentId ?? ""),
    studentId: String(record.student_id ?? record.studentId ?? ""),
    status:
      record.status === "in_progress" || record.status === "submitted"
        ? record.status
        : "not_started",
    submittedAt: toStringOrNull(record.submitted_at) ?? toStringOrNull(record.submittedAt),
    attachments,
  } satisfies AssessmentSubmission;
}

export async function listAssessments(client: Client = supabase): Promise<AssessmentTemplate[]> {
  const hasSession = await hasActiveSession(client);
  if (!hasSession) {
    return DEMO_ASSESSMENTS;
  }

  const { data, error } = await client.from("assessments").select("*").order("due_date", { ascending: true });

  if (error) {
    if (isTableMissing(error)) {
      console.warn("assessments table missing, returning demo assessments", error);
      return DEMO_ASSESSMENTS;
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapAssessment);
}

export async function createAssessment(
  input: { classId: string; title: string; description?: string | null; dueDate?: string | null; gradingScale?: GradeScale },
  client: Client = supabase,
): Promise<AssessmentTemplate> {
  const payload = {
    class_id: input.classId,
    title: input.title,
    description: input.description ?? null,
    due_date: input.dueDate ?? null,
    grading_scale: input.gradingScale ?? "letter",
  };

  const { data, error } = await client.from("assessments").insert(payload).select().maybeSingle();

  if (error) {
    if (isTableMissing(error)) {
      console.warn("assessments table missing, returning demo assessment", error);
      return mapAssessment({ ...payload, id: randomId(), created_at: new Date().toISOString() });
    }
    throw error;
  }

  return mapAssessment(data ?? payload);
}

export async function recordAssessmentGrade(
  input: { assessmentId: string; studentId: string; gradeValue: string | null; gradeNumeric?: number | null; scale: GradeScale; feedback?: string | null },
  client: Client = supabase,
): Promise<AssessmentGrade> {
  const payload = {
    assessment_id: input.assessmentId,
    student_id: input.studentId,
    grade_value: input.gradeValue,
    grade_numeric: input.gradeNumeric ?? null,
    scale: input.scale,
    feedback: input.feedback ?? null,
  };

  const { data, error } = await client.from("assessment_grades").insert(payload).select().maybeSingle();

  if (error) {
    if (isTableMissing(error)) {
      console.warn("assessment_grades table missing, returning demo grade", error);
      return mapGrade({ ...payload, id: randomId(), graded_at: new Date().toISOString() });
    }
    throw error;
  }

  return mapGrade(data ?? payload);
}

export async function listAssessmentGrades(
  assessmentId: string,
  client: Client = supabase,
): Promise<AssessmentGrade[]> {
  const hasSession = await hasActiveSession(client);
  if (!hasSession) {
    return DEMO_GRADES.filter(grade => grade.assessmentId === assessmentId);
  }

  const { data, error } = await client
    .from("assessment_grades")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("graded_at", { ascending: false });

  if (error) {
    if (isTableMissing(error)) {
      console.warn("assessment_grades table missing, returning demo grades", error);
      return DEMO_GRADES.filter(grade => grade.assessmentId === assessmentId);
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapGrade);
}

export async function listAssessmentSubmissions(
  assessmentId: string,
  client: Client = supabase,
): Promise<AssessmentSubmission[]> {
  const hasSession = await hasActiveSession(client);
  if (!hasSession) {
    return DEMO_SUBMISSIONS.filter(submission => submission.assessmentId === assessmentId);
  }

  const { data, error } = await client
    .from("assessment_submissions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("submitted_at", { ascending: false });

  if (error) {
    if (isTableMissing(error)) {
      console.warn("assessment_submissions table missing, returning demo submissions", error);
      return DEMO_SUBMISSIONS.filter(submission => submission.assessmentId === assessmentId);
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapSubmission);
}

export function getDemoAssessmentGrades(): AssessmentGrade[] {
  return DEMO_GRADES;
}

export function getDemoAssessmentSubmissions(): AssessmentSubmission[] {
  return DEMO_SUBMISSIONS;
}
