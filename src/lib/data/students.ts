import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AssessmentGrade,
  GradeScale,
  StudentAppraisalEntry,
  StudentAssignmentSummary,
  StudentBehaviorEntry,
  StudentProfile,
  StudentProgressSnapshot,
  StudentReport,
  StudentSummary,
} from "@/types/platform";

const FALLBACK_SCALE: GradeScale = "letter";

type Client = SupabaseClient;

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
};

const randomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

function mapGradeScale(value: unknown): GradeScale {
  if (value === "percentage" || value === "points" || value === "rubric") {
    return value;
  }
  return "letter";
}

function mapBehaviorEntry(record: Record<string, unknown>): StudentBehaviorEntry {
  return {
    id: String(record.id ?? randomId()),
    studentId: String(record.student_id ?? record.studentId ?? ""),
    classId: record.class_id ?? record.classId ?? null,
    note: typeof record.note === "string" ? record.note : "",
    recordedAt: record.recorded_at ?? record.recordedAt ?? new Date().toISOString(),
    recordedBy: record.recorded_by ?? record.recordedBy ?? null,
    sentiment:
      record.sentiment === "positive" || record.sentiment === "needs_support"
        ? record.sentiment
        : "neutral",
  } satisfies StudentBehaviorEntry;
}

function mapAppraisalEntry(record: Record<string, unknown>): StudentAppraisalEntry {
  return {
    id: String(record.id ?? randomId()),
    studentId: String(record.student_id ?? record.studentId ?? ""),
    classId: record.class_id ?? record.classId ?? null,
    highlight: typeof record.highlight === "string" ? record.highlight : "",
    recordedAt: record.recorded_at ?? record.recordedAt ?? new Date().toISOString(),
    recordedBy: record.recorded_by ?? record.recordedBy ?? null,
  } satisfies StudentAppraisalEntry;
}

function mapAssessmentGrade(record: Record<string, unknown>): AssessmentGrade {
  return {
    id: String(record.id ?? randomId()),
    assessmentId: String(record.assessment_id ?? record.assessmentId ?? ""),
    studentId: String(record.student_id ?? record.studentId ?? ""),
    gradeValue: record.grade_value ?? record.gradeValue ?? null,
    gradeNumeric: typeof record.grade_numeric === "number" ? record.grade_numeric : record.gradeNumeric ?? null,
    scale: mapGradeScale(record.scale),
    gradedAt: record.graded_at ?? record.gradedAt ?? null,
    feedback: record.feedback ?? null,
    recordedBy: record.recorded_by ?? record.recordedBy ?? null,
  } satisfies AssessmentGrade;
}

function mapAssignment(record: Record<string, unknown>): StudentAssignmentSummary {
  const scale = mapGradeScale(record.grade_scale ?? record.gradingScale);
  return {
    id: String(record.id ?? randomId()),
    title: typeof record.title === "string" && record.title.length > 0 ? record.title : "Untitled assignment",
    status:
      record.status === "submitted" || record.status === "graded" || record.status === "missing"
        ? record.status
        : "assigned",
    dueDate: record.due_date ?? record.dueDate ?? null,
    grade: record.grade ?? record.grade_value ?? null,
    gradeScale: record.grade === null && record.grade_value === null ? null : scale,
  } satisfies StudentAssignmentSummary;
}

function mapProgressEntry(record: Record<string, unknown>): StudentProgressSnapshot {
  return {
    metric: typeof record.metric === "string" ? record.metric : "Progress",
    value: typeof record.value === "number" ? record.value : Number(record.value ?? 0),
    trend: record.trend === "up" || record.trend === "down" ? record.trend : "steady",
    capturedAt: record.captured_at ?? record.capturedAt ?? new Date().toISOString(),
  } satisfies StudentProgressSnapshot;
}

function mapStudentSummary(record: Record<string, unknown>): StudentSummary {
  const classes = Array.isArray(record.class_students)
    ? record.class_students
        .map((entry: unknown) => {
          const entryRecord = toRecord(entry);
          const classCandidate = entryRecord.classes ?? entryRecord.class ?? entry;
          const classRecord = toRecord(classCandidate);
          if (!classRecord.id && !classRecord.title && !classRecord.name) {
            return null;
          }

          const titleValue =
            typeof classRecord.title === "string" && classRecord.title.length > 0
              ? classRecord.title
              : typeof classRecord.name === "string" && classRecord.name.length > 0
                ? classRecord.name
                : "Untitled class";

          return {
            id: String(classRecord.id ?? ""),
            title: titleValue,
            stage: (classRecord.stage ?? classRecord.level ?? null) as string | null,
            subject: (classRecord.subject ?? null) as string | null,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
    : [];

  const behaviorNotes = Array.isArray(record.student_behavior_logs)
    ? record.student_behavior_logs.map(mapBehaviorEntry)
    : [];
  const appraisalNotes = Array.isArray(record.student_appraisals)
    ? record.student_appraisals.map(mapAppraisalEntry)
    : [];
  const assessments = Array.isArray(record.assessment_grades)
    ? record.assessment_grades.map(mapAssessmentGrade)
    : [];

  const latestBehaviorNote = behaviorNotes.length > 0 ? behaviorNotes[0] : null;
  const latestAppraisalNote = appraisalNotes.length > 0 ? appraisalNotes[0] : null;
  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  const classIds = classes.map(cls => cls!.id);

  return {
    id: String(record.id ?? crypto.randomUUID()),
    firstName: typeof record.first_name === "string" ? record.first_name : "",
    lastName: typeof record.last_name === "string" ? record.last_name : "",
    preferredName:
      typeof record.preferred_name === "string" && record.preferred_name.length > 0
        ? record.preferred_name
        : null,
    email: typeof record.email === "string" ? record.email : null,
    avatarUrl: typeof record.avatar_url === "string" ? record.avatar_url : null,
    classIds,
    createdAt: record.created_at ?? record.createdAt ?? null,
    updatedAt: record.updated_at ?? record.updatedAt ?? null,
    classes: classes as StudentSummary["classes"],
    latestBehaviorNote,
    latestAppraisalNote,
    latestAssessment,
  } satisfies StudentSummary;
}

const DEMO_BEHAVIOR: StudentBehaviorEntry = {
  id: "demo-behavior-1",
  studentId: "demo-student-1",
  classId: "demo-class-1",
  note: "Ava collaborated thoughtfully during group science experiments.",
  recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  recordedBy: "demo-teacher",
  sentiment: "positive",
};

const DEMO_APPRAISAL: StudentAppraisalEntry = {
  id: "demo-appraisal-1",
  studentId: "demo-student-1",
  classId: "demo-class-1",
  highlight: "Consistently submits assignments early with thorough responses.",
  recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  recordedBy: "demo-teacher",
};

const DEMO_ASSESSMENT: AssessmentGrade = {
  id: "demo-grade-1",
  assessmentId: "demo-assessment-1",
  studentId: "demo-student-1",
  gradeValue: "A",
  gradeNumeric: 95,
  scale: "letter",
  gradedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  feedback: "Excellent understanding of the core concepts.",
  recordedBy: "demo-teacher",
};

const DEMO_ASSIGNMENTS: StudentAssignmentSummary[] = [
  {
    id: "demo-assignment-1",
    title: "Solar System Presentation",
    status: "graded",
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    grade: "A",
    gradeScale: FALLBACK_SCALE,
  },
  {
    id: "demo-assignment-2",
    title: "Reading Reflection",
    status: "submitted",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    grade: null,
    gradeScale: null,
  },
];

const DEMO_PROGRESS: StudentProgressSnapshot[] = [
  { metric: "Participation", value: 88, trend: "up", capturedAt: new Date().toISOString() },
  { metric: "Homework", value: 92, trend: "steady", capturedAt: new Date().toISOString() },
  { metric: "Quizzes", value: 85, trend: "up", capturedAt: new Date().toISOString() },
];

const DEMO_REPORT: StudentReport = {
  id: "demo-report-1",
  studentId: "demo-student-1",
  requestedBy: "demo-teacher",
  status: "ready",
  generatedUrl: null,
  requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
};

const FALLBACK_STUDENTS: StudentSummary[] = [
  {
    id: "demo-student-1",
    firstName: "Ava",
    lastName: "Nguyen",
    preferredName: "Ava",
    email: "ava.nguyen@example.com",
    avatarUrl: null,
    classIds: ["demo-class-1"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    classes: [
      { id: "demo-class-1", title: "Year 5 Science", stage: "Primary", subject: "Science" },
    ],
    latestBehaviorNote: DEMO_BEHAVIOR,
    latestAppraisalNote: DEMO_APPRAISAL,
    latestAssessment: DEMO_ASSESSMENT,
  },
];

const FALLBACK_PROFILES: Record<string, StudentProfile> = {
  "demo-student-1": {
    student: {
      id: "demo-student-1",
      firstName: "Ava",
      lastName: "Nguyen",
      preferredName: "Ava",
      email: "ava.nguyen@example.com",
      avatarUrl: null,
      classIds: ["demo-class-1"],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    classes: [{ id: "demo-class-1", title: "Year 5 Science", stage: "Primary", subject: "Science" }],
    assignments: DEMO_ASSIGNMENTS,
    progress: DEMO_PROGRESS,
    behaviorNotes: [DEMO_BEHAVIOR],
    appraisalNotes: [DEMO_APPRAISAL],
    reportStatus: DEMO_REPORT,
  },
};

function isTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "42P01" || code === "42P07" || code === "42703";
}

async function requireUserId(client: Client): Promise<string> {
  const { data, error } = await client.auth.getSession();
  if (error) {
    throw error;
  }
  const userId = data.session?.user?.id;
  if (!userId) {
    throw new Error("You must be signed in to manage students.");
  }
  return userId;
}

export async function listMyStudents(client: Client = supabase): Promise<StudentSummary[]> {
  try {
    await requireUserId(client);
  } catch (error) {
    console.warn("listMyStudents falling back to demo data", error);
    return FALLBACK_STUDENTS;
  }

  const { data, error } = await client
    .from("students")
    .select(
      `
        id,
        first_name,
        last_name,
        preferred_name,
        email,
        avatar_url,
        created_at,
        updated_at,
        class_students:class_students (
          class_id,
          classes (
            id,
            title,
            subject,
            stage
          )
        ),
        student_behavior_logs (
          id,
          student_id,
          class_id,
          note,
          recorded_at,
          recorded_by,
          sentiment
        ),
        student_appraisals (
          id,
          student_id,
          class_id,
          highlight,
          recorded_at,
          recorded_by
        ),
        assessment_grades (
          id,
          assessment_id,
          student_id,
          grade_value,
          grade_numeric,
          scale,
          graded_at,
          feedback,
          recorded_by
        )
      `,
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    if (isTableMissing(error)) {
      console.warn("Students table not available, returning demo data", error);
      return FALLBACK_STUDENTS;
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapStudentSummary);
}

export async function getStudentProfile(
  studentId: string,
  client: Client = supabase,
): Promise<StudentProfile> {
  if (!studentId) {
    throw new Error("Student identifier is required.");
  }

  try {
    await requireUserId(client);
  } catch (error) {
    const fallback = FALLBACK_PROFILES[studentId];
    if (fallback) {
      return fallback;
    }
      console.warn("getStudentProfile falling back to demo data", error);
    return FALLBACK_PROFILES["demo-student-1"];
  }

  const { data, error } = await client
    .from("students")
    .select(
      `
        id,
        first_name,
        last_name,
        preferred_name,
        email,
        avatar_url,
        created_at,
        updated_at,
        class_students:class_students (
          class_id,
          classes (
            id,
            title,
            subject,
            stage
          )
        ),
        student_behavior_logs (
          id,
          student_id,
          class_id,
          note,
          recorded_at,
          recorded_by,
          sentiment
        ),
        student_appraisals (
          id,
          student_id,
          class_id,
          highlight,
          recorded_at,
          recorded_by
        ),
        assessment_grades (
          id,
          assessment_id,
          student_id,
          grade_value,
          grade_numeric,
          scale,
          graded_at,
          feedback,
          recorded_by
        ),
        student_assignments (
          id,
          title,
          status,
          due_date,
          grade,
          grade_scale
        ),
        student_progress_entries (
          metric,
          value,
          trend,
          captured_at
        ),
        student_reports (
          id,
          requested_by,
          status,
          generated_url,
          requested_at,
          completed_at
        )
      `,
    )
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    if (isTableMissing(error)) {
      const fallback = FALLBACK_PROFILES[studentId] ?? FALLBACK_PROFILES["demo-student-1"];
      console.warn("Student profile table not available, returning demo profile", error);
      return fallback;
    }
    throw error;
  }

  if (!data) {
    throw new Error("Student not found");
  }

  const summary = mapStudentSummary(data);

  const assignments = Array.isArray(data.student_assignments)
    ? data.student_assignments.map(mapAssignment)
    : [];
  const progress = Array.isArray(data.student_progress_entries)
    ? data.student_progress_entries.map(mapProgressEntry)
    : [];
  const behaviorNotes = Array.isArray(data.student_behavior_logs)
    ? data.student_behavior_logs.map(mapBehaviorEntry)
    : [];
  const appraisalNotes = Array.isArray(data.student_appraisals)
    ? data.student_appraisals.map(mapAppraisalEntry)
    : [];
  const reportRecord = Array.isArray(data.student_reports) ? data.student_reports[0] : data.student_reports;
  const reportStatus: StudentReport | null = reportRecord
    ? {
        id: String(reportRecord.id ?? randomId()),
        studentId: summary.id,
        requestedBy: reportRecord.requested_by ?? reportRecord.requestedBy ?? "",
        status:
          reportRecord.status === "processing" || reportRecord.status === "ready" || reportRecord.status === "failed"
            ? reportRecord.status
            : "pending",
        generatedUrl: reportRecord.generated_url ?? reportRecord.generatedUrl ?? null,
        requestedAt: reportRecord.requested_at ?? reportRecord.requestedAt ?? new Date().toISOString(),
        completedAt: reportRecord.completed_at ?? reportRecord.completedAt ?? null,
      }
    : null;

  return {
    student: summary,
    classes: summary.classes,
    assignments,
    progress,
    behaviorNotes,
    appraisalNotes,
    reportStatus,
  } satisfies StudentProfile;
}

export async function saveStudentBehaviorNote(
  input: { studentId: string; classId?: string | null; note: string; sentiment?: StudentBehaviorEntry["sentiment"]; },
  client: Client = supabase,
): Promise<StudentBehaviorEntry> {
  const payload = {
    student_id: input.studentId,
    class_id: input.classId ?? null,
    note: input.note,
    sentiment: input.sentiment ?? "neutral",
  };

  const { data, error } = await client
    .from("student_behavior_logs")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    if (isTableMissing(error)) {
      console.warn("student_behavior_logs table missing, returning local entry", error);
      return {
        ...DEMO_BEHAVIOR,
        id: randomId(),
        studentId: input.studentId,
        classId: input.classId ?? null,
        note: input.note,
        recordedAt: new Date().toISOString(),
        sentiment: input.sentiment ?? "neutral",
      } satisfies StudentBehaviorEntry;
    }
    throw error;
  }

  return mapBehaviorEntry(data ?? payload);
}

export async function saveStudentAppraisalNote(
  input: { studentId: string; classId?: string | null; highlight: string },
  client: Client = supabase,
): Promise<StudentAppraisalEntry> {
  const payload = {
    student_id: input.studentId,
    class_id: input.classId ?? null,
    highlight: input.highlight,
  };

  const { data, error } = await client
    .from("student_appraisals")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    if (isTableMissing(error)) {
      console.warn("student_appraisals table missing, returning local entry", error);
      return {
        ...DEMO_APPRAISAL,
        id: randomId(),
        studentId: input.studentId,
        classId: input.classId ?? null,
        highlight: input.highlight,
        recordedAt: new Date().toISOString(),
      } satisfies StudentAppraisalEntry;
    }
    throw error;
  }

  return mapAppraisalEntry(data ?? payload);
}

export async function recordStudentReportRequest(
  input: { studentId: string; requestedBy: string },
  client: Client = supabase,
): Promise<StudentReport> {
  const payload = {
    student_id: input.studentId,
    requested_by: input.requestedBy,
    status: "pending",
  };

  const { data, error } = await client
    .from("student_reports")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    if (isTableMissing(error)) {
      console.warn("student_reports table missing, returning local placeholder", error);
      return {
        id: randomId(),
        studentId: input.studentId,
        requestedBy: input.requestedBy,
        status: "pending",
        generatedUrl: null,
        requestedAt: new Date().toISOString(),
        completedAt: null,
      } satisfies StudentReport;
    }
    throw error;
  }

  return {
    id: String(data?.id ?? randomId()),
    studentId: input.studentId,
    requestedBy: input.requestedBy,
    status:
      data?.status === "processing" || data?.status === "ready" || data?.status === "failed"
        ? data.status
        : "pending",
    generatedUrl: data?.generated_url ?? null,
    requestedAt: data?.requested_at ?? new Date().toISOString(),
    completedAt: data?.completed_at ?? null,
  } satisfies StudentReport;
}
