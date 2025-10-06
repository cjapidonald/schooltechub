import { nanoid } from "nanoid";

import { supabase } from "@/integrations/supabase/client";
import { DASHBOARD_EXAMPLE_SKILLS, DASHBOARD_EXAMPLE_STUDENTS } from "./examples";
import type { SkillDefinition, StudentRecord, StudentSkillProgress, StudentSkillScore } from "./types";

const EXAMPLE_FLAG = (import.meta.env.VITE_ENABLE_STUDENT_EXAMPLES ?? "true").toString().toLowerCase();

const cloneDeep = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const exampleState = {
  students: cloneDeep(DASHBOARD_EXAMPLE_STUDENTS),
  skills: cloneDeep(DASHBOARD_EXAMPLE_SKILLS),
};

type SupabaseSkillRow = {
  id: string;
  owner_id?: string | null;
  title: string;
  description: string | null;
};

type SupabaseClassSkillRow = {
  id?: string;
  class_id: string;
  skill_id: string;
  skills?: SupabaseSkillRow | null;
};

type SupabaseStudentRow = {
  id: string;
  owner_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  preferred_name?: string | null;
  guardian_name?: string | null;
  guardian_contact?: string | null;
  behavior_comment?: string | null;
  academic_comment?: string | null;
  avatar_url?: string | null;
};

type SupabaseClassStudentRow = {
  id?: string;
  class_id: string;
  student_id: string;
  students?: SupabaseStudentRow | null;
};

type SupabaseStudentSkillScoreRow = {
  id: string;
  student_id: string;
  skill_id: string;
  month: string;
  score: number | null;
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const toMonthDisplay = (value: string | null | undefined): string => {
  if (!value) {
    return getCurrentMonth();
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.slice(0, 7);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
  }

  return value;
};

const toDatabaseMonth = (value: string): string => {
  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }
  return value;
};

const shouldUseExamplesInternal = (ownerId?: string | null) => {
  if (EXAMPLE_FLAG === "false") {
    return !ownerId;
  }

  if (EXAMPLE_FLAG === "true" || EXAMPLE_FLAG === "1") {
    return true;
  }

  return !ownerId;
};

const getExampleSkills = (classIds?: string[]): SkillDefinition[] => {
  const list = cloneDeep(exampleState.skills);
  if (!classIds || classIds.length === 0) {
    return list;
  }
  const set = new Set(classIds);
  return list.filter(skill => set.has(skill.classId));
};

const getExampleStudents = (classIds?: string[]): StudentRecord[] => {
  const list = cloneDeep(exampleState.students);
  if (!classIds || classIds.length === 0) {
    return list;
  }
  const set = new Set(classIds);
  return list.filter(student => set.has(student.classId));
};

const pushExampleSkillToStudents = (skill: SkillDefinition) => {
  const month = getCurrentMonth();
  exampleState.students = exampleState.students.map(student => {
    if (student.classId !== skill.classId) {
      return student;
    }

    const exists = student.skills.some(entry => entry.skillId === skill.id);
    if (exists) {
      return student;
    }

    const nextSkill: StudentSkillProgress = {
      skillId: skill.id,
      skillName: skill.title,
      scores: [
        {
          id: nanoid(),
          month,
          score: 0,
        },
      ],
    };

    return {
      ...student,
      skills: [...student.skills, nextSkill],
    };
  });
};

const applyExampleScore = (input: { studentId: string; skillId: string; month: string; score: number }) => {
  exampleState.students = exampleState.students.map(student => {
    if (student.id !== input.studentId) {
      return student;
    }

    return {
      ...student,
      skills: student.skills.map(skill => {
        if (skill.skillId !== input.skillId) {
          return skill;
        }

        const month = toMonthDisplay(input.month);
        const existingIndex = skill.scores.findIndex(score => score.month === month);
        if (existingIndex >= 0) {
          const updated = [...skill.scores];
          updated[existingIndex] = { ...updated[existingIndex], score: input.score };
          return {
            ...skill,
            scores: updated,
          };
        }

        const nextScores = [...skill.scores, { id: nanoid(), month, score: input.score }];
        nextScores.sort((a, b) => a.month.localeCompare(b.month));
        return {
          ...skill,
          scores: nextScores,
        };
      }),
    };
  });
};

const parseFullName = (name: string): { firstName: string; lastName: string } => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

const mapStudentRowToRecord = (
  row: SupabaseStudentRow,
  classId: string,
  classSkills: SkillDefinition[],
  scores: SupabaseStudentSkillScoreRow[],
): StudentRecord => {
  const fullName =
    row.full_name?.trim() && row.full_name.trim() !== ""
      ? row.full_name.trim()
      : `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Student";

  const skillProgress: StudentSkillProgress[] = classSkills.map(skill => {
    const skillScores: StudentSkillScore[] = scores
      .filter(entry => entry.skill_id === skill.id)
      .map(entry => ({
        id: entry.id,
        month: toMonthDisplay(entry.month),
        score: typeof entry.score === "number" ? entry.score : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      skillId: skill.id,
      skillName: skill.title,
      scores: skillScores,
    };
  });

  return {
    id: row.id,
    classId,
    fullName,
    preferredName: row.preferred_name ?? undefined,
    guardianName: row.guardian_name ?? undefined,
    guardianContact: row.guardian_contact ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    behaviorComment: row.behavior_comment ?? undefined,
    academicComment: row.academic_comment ?? undefined,
    skills: skillProgress,
  };
};

export const getStudentsQueryKey = (ownerId: string | null | undefined, classIds: string[]) => [
  "dashboard-students",
  ownerId ?? "guest",
  [...classIds].sort().join(","),
];

export const getSkillsQueryKey = (ownerId: string | null | undefined, classIds: string[]) => [
  "dashboard-skills",
  ownerId ?? "guest",
  [...classIds].sort().join(","),
];

export const shouldUseStudentExamples = (ownerId?: string | null) => shouldUseExamplesInternal(ownerId);

export async function fetchClassSkills(input: { ownerId?: string | null; classIds: string[] }): Promise<SkillDefinition[]> {
  const { ownerId, classIds } = input;
  if (shouldUseExamplesInternal(ownerId)) {
    return getExampleSkills(classIds);
  }

  if (!ownerId || classIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from<SupabaseClassSkillRow>("class_skills")
      .select("class_id,skill_id,skills(id,title,description)")
      .in("class_id", classIds);

    if (error) {
      throw error;
    }

    const mapped: SkillDefinition[] = (data ?? []).map(row => ({
      id: row.skills?.id ?? row.skill_id,
      classId: row.class_id,
      title: row.skills?.title ?? "Untitled skill",
      description: row.skills?.description ?? undefined,
    }));

    return mapped;
  } catch (error) {
    console.error("Failed to fetch class skills", error);
    return getExampleSkills(classIds);
  }
}

export async function fetchStudents(input: {
  ownerId?: string | null;
  classIds: string[];
}): Promise<StudentRecord[]> {
  const { ownerId, classIds } = input;

  if (shouldUseExamplesInternal(ownerId)) {
    const exampleSkills = getExampleSkills(classIds);
    const exampleStudents = getExampleStudents(classIds);
    return exampleStudents.map(student => ({
      ...student,
      skills: student.skills.map(skill => ({
        ...skill,
        scores: [...skill.scores],
      })),
    }));
  }

  if (!ownerId || classIds.length === 0) {
    return [];
  }

  try {
    const { data: classStudents, error: classStudentsError } = await supabase
      .from<SupabaseClassStudentRow>("class_students")
      .select(
        "class_id,student_id,students(id,first_name,last_name,full_name,preferred_name,guardian_name,guardian_contact,behavior_comment,academic_comment,avatar_url)"
      )
      .in("class_id", classIds);

    if (classStudentsError) {
      throw classStudentsError;
    }

    const uniqueStudents = new Map<string, { classId: string; student: SupabaseStudentRow }>();
    (classStudents ?? []).forEach(entry => {
      if (entry.students) {
        uniqueStudents.set(entry.student_id, { classId: entry.class_id, student: entry.students });
      }
    });

    if (uniqueStudents.size === 0) {
      return [];
    }

    const studentIds = Array.from(uniqueStudents.keys());
    const { data: scoreRows, error: scoresError } = await supabase
      .from<SupabaseStudentSkillScoreRow>("student_skill_scores")
      .select("id,student_id,skill_id,month,score")
      .in("student_id", studentIds);

    if (scoresError) {
      throw scoresError;
    }

    const skills = await fetchClassSkills({ ownerId, classIds });
    const skillsByClass = new Map<string, SkillDefinition[]>();
    skills.forEach(skill => {
      const existing = skillsByClass.get(skill.classId) ?? [];
      skillsByClass.set(skill.classId, [...existing, skill]);
    });

    const scoresByStudent = new Map<string, SupabaseStudentSkillScoreRow[]>();
    (scoreRows ?? []).forEach(score => {
      const existing = scoresByStudent.get(score.student_id) ?? [];
      scoresByStudent.set(score.student_id, [...existing, score]);
    });

    const students: StudentRecord[] = Array.from(uniqueStudents.entries()).map(([studentId, value]) => {
      const classSkills = skillsByClass.get(value.classId) ?? [];
      const studentScores = scoresByStudent.get(studentId) ?? [];
      return mapStudentRowToRecord(value.student, value.classId, classSkills, studentScores);
    });

    return students;
  } catch (error) {
    console.error("Failed to fetch students", error);
    const exampleSkills = getExampleSkills(classIds);
    const exampleStudents = getExampleStudents(classIds);
    return exampleStudents.map(student => ({
      ...student,
      skills: student.skills.map(skill => ({
        ...skill,
        scores: [...skill.scores],
      })),
    }));
  }
}

export async function bulkAddStudents(input: {
  ownerId?: string | null;
  classId: string;
  names: string[];
}): Promise<void> {
  const { ownerId, classId, names } = input;
  const filteredNames = names.map(name => name.trim()).filter(Boolean);
  if (filteredNames.length === 0) {
    return;
  }

  if (shouldUseExamplesInternal(ownerId)) {
    const month = getCurrentMonth();
    const classSkills = getExampleSkills([classId]);
    const newStudents: StudentRecord[] = filteredNames.map(name => {
      const id = nanoid();
      const skillProgress: StudentSkillProgress[] = classSkills.map(skill => ({
        skillId: skill.id,
        skillName: skill.title,
        scores: [
          {
            id: nanoid(),
            month,
            score: 0,
          },
        ],
      }));
      return {
        id,
        classId,
        fullName: name,
        skills: skillProgress,
      };
    });

    exampleState.students = [...exampleState.students, ...newStudents];
    return;
  }

  if (!ownerId) {
    throw new Error("Owner ID is required to add students");
  }

  try {
    const studentPayload = filteredNames.map(name => {
      const parsed = parseFullName(name);
      return {
        owner_id: ownerId,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        full_name: name,
      };
    });

    const { data: insertedStudents, error: insertError } = await supabase
      .from<Omit<SupabaseStudentRow, "id"> & { id: string }>("students")
      .insert(studentPayload)
      .select("id");

    if (insertError) {
      throw insertError;
    }

    const enrollmentPayload = (insertedStudents ?? []).map(student => ({
      class_id: classId,
      student_id: student.id,
    }));

    if (enrollmentPayload.length > 0) {
      const { error: enrollmentError } = await supabase
        .from<SupabaseClassStudentRow>("class_students")
        .insert(enrollmentPayload);

      if (enrollmentError) {
        throw enrollmentError;
      }
    }
  } catch (error) {
    console.error("Failed to add students", error);
    throw error;
  }
}

export async function createSkillForClass(input: {
  ownerId?: string | null;
  classId: string;
  title: string;
  description?: string;
}): Promise<SkillDefinition> {
  const { ownerId, classId, title, description } = input;
  if (!title.trim()) {
    throw new Error("Skill title is required");
  }

  if (shouldUseExamplesInternal(ownerId)) {
    const skill: SkillDefinition = {
      id: nanoid(),
      classId,
      title: title.trim(),
      description: description?.trim() || undefined,
    };
    exampleState.skills = [...exampleState.skills, skill];
    pushExampleSkillToStudents(skill);
    return skill;
  }

  if (!ownerId) {
    throw new Error("Owner ID is required to create skills");
  }

  try {
    const { data: skillRow, error: skillError } = await supabase
      .from<SupabaseSkillRow>("skills")
      .insert({
        owner_id: ownerId,
        title: title.trim(),
        description: description?.trim() || null,
      })
      .select("id,title,description")
      .single();

    if (skillError) {
      throw skillError;
    }

    const { error: linkError } = await supabase
      .from<SupabaseClassSkillRow>("class_skills")
      .insert({ class_id: classId, skill_id: skillRow.id });

    if (linkError) {
      throw linkError;
    }

    const skill: SkillDefinition = {
      id: skillRow.id,
      classId,
      title: skillRow.title,
      description: skillRow.description ?? undefined,
    };

    return skill;
  } catch (error) {
    console.error("Failed to create skill", error);
    throw error;
  }
}

export async function updateStudentComments(input: {
  ownerId?: string | null;
  studentId: string;
  behaviorComment?: string;
  academicComment?: string;
}): Promise<void> {
  const { ownerId, studentId, behaviorComment, academicComment } = input;

  if (shouldUseExamplesInternal(ownerId)) {
    exampleState.students = exampleState.students.map(student => {
      if (student.id !== studentId) {
        return student;
      }
      return {
        ...student,
        behaviorComment: behaviorComment ?? student.behaviorComment,
        academicComment: academicComment ?? student.academicComment,
      };
    });
    return;
  }

  try {
    const updates: Record<string, string | null | undefined> = {};
    if (behaviorComment !== undefined) {
      updates.behavior_comment = behaviorComment.trim() ? behaviorComment.trim() : null;
    }
    if (academicComment !== undefined) {
      updates.academic_comment = academicComment.trim() ? academicComment.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    const { error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", studentId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Failed to update student comments", error);
    throw error;
  }
}

export async function upsertStudentSkillScore(input: {
  ownerId?: string | null;
  studentId: string;
  skillId: string;
  month: string;
  score: number;
}): Promise<void> {
  const { ownerId, studentId, skillId, month, score } = input;

  if (shouldUseExamplesInternal(ownerId)) {
    applyExampleScore({ studentId, skillId, month, score });
    return;
  }

  try {
    const payload = {
      student_id: studentId,
      skill_id: skillId,
      month: toDatabaseMonth(month),
      score,
    };

    const { error } = await supabase
      .from("student_skill_scores")
      .upsert(payload, { onConflict: "student_id,skill_id,month" });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Failed to record student skill score", error);
    throw error;
  }
}
