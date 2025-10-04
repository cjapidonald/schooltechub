import { create } from "zustand";
import { nanoid } from "nanoid";

import { DASHBOARD_EXAMPLE_SKILLS, DASHBOARD_EXAMPLE_STUDENTS } from "@/features/students/examples";
import type { SkillDefinition, StudentRecord } from "@/features/students/types";

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

type RecordScoreInput = {
  studentId: string;
  skillId: string;
  month: string;
  score: number;
};

type StudentsStore = {
  students: StudentRecord[];
  skills: SkillDefinition[];
  addStudents: (classId: string, names: string[]) => void;
  addSkill: (input: { classId: string; title: string; description?: string }) => SkillDefinition;
  updateBehaviorComment: (studentId: string, comment: string) => void;
  updateAcademicComment: (studentId: string, comment: string) => void;
  recordSkillScore: (input: RecordScoreInput) => void;
};

export const useStudentsStore = create<StudentsStore>((set, get) => ({
  students: DASHBOARD_EXAMPLE_STUDENTS,
  skills: DASHBOARD_EXAMPLE_SKILLS,
  addStudents: (classId, names) => {
    const trimmed = names.map(name => name.trim()).filter(Boolean);
    if (trimmed.length === 0) {
      return;
    }

    const classSkills = get().skills.filter(skill => skill.classId === classId);
    const month = currentMonth();

    const newStudents: StudentRecord[] = trimmed.map(name => ({
      id: nanoid(),
      classId,
      fullName: name,
      skills: classSkills.map(skill => ({
        skillId: skill.id,
        skillName: skill.title,
        scores: [
          {
            id: nanoid(),
            month,
            score: 0,
          },
        ],
      })),
    }));

    set(state => ({
      students: [...state.students, ...newStudents],
    }));
  },
  addSkill: input => {
    const skill: SkillDefinition = {
      id: nanoid(),
      classId: input.classId,
      title: input.title,
      description: input.description,
    };

    const month = currentMonth();

    set(state => ({
      skills: [...state.skills, skill],
      students: state.students.map(student => {
        if (student.classId !== input.classId) {
          return student;
        }

        const alreadyHasSkill = student.skills.some(item => item.skillId === skill.id);
        if (alreadyHasSkill) {
          return student;
        }

        return {
          ...student,
          skills: [
            ...student.skills,
            {
              skillId: skill.id,
              skillName: skill.title,
              scores: [
                {
                  id: nanoid(),
                  month,
                  score: 0,
                },
              ],
            },
          ],
        };
      }),
    }));

    return skill;
  },
  updateBehaviorComment: (studentId, comment) => {
    set(state => ({
      students: state.students.map(student =>
        student.id === studentId ? { ...student, behaviorComment: comment } : student,
      ),
    }));
  },
  updateAcademicComment: (studentId, comment) => {
    set(state => ({
      students: state.students.map(student =>
        student.id === studentId ? { ...student, academicComment: comment } : student,
      ),
    }));
  },
  recordSkillScore: ({ studentId, skillId, month, score }) => {
    set(state => ({
      students: state.students.map(student => {
        if (student.id !== studentId) {
          return student;
        }

        return {
          ...student,
          skills: student.skills.map(skill => {
            if (skill.skillId !== skillId) {
              return skill;
            }

            const existingIndex = skill.scores.findIndex(entry => entry.month === month);
            const updatedScores =
              existingIndex >= 0
                ? skill.scores.map((entry, index) =>
                    index === existingIndex ? { ...entry, score } : entry,
                  )
                : [...skill.scores, { id: nanoid(), month, score }];

            updatedScores.sort((a, b) => a.month.localeCompare(b.month));

            return {
              ...skill,
              skillName: skill.skillName,
              scores: updatedScores,
            };
          }),
        };
      }),
    }));
  },
}));
