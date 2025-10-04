import { DASHBOARD_EXAMPLE_CLASS, DASHBOARD_EXAMPLE_CLASS_ID } from "@/features/dashboard/examples";
import { nanoid } from "nanoid";

import type { SkillDefinition, StudentRecord, StudentSkillScore } from "./types";

const createScoreSeries = (entries: Array<{ month: string; score: number }>): StudentSkillScore[] =>
  entries.map(entry => ({ id: nanoid(), month: entry.month, score: entry.score }));

export const DASHBOARD_EXAMPLE_SKILLS: SkillDefinition[] = [
  {
    id: "example-skill-literacy",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    title: "Reading comprehension",
    description: "Tracks how well the student can interpret complex texts over time.",
    isExample: true,
  },
  {
    id: "example-skill-writing",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    title: "Narrative writing",
    description: "Measures structure, creativity, and grammar in extended writing tasks.",
    isExample: true,
  },
  {
    id: "example-skill-collaboration",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    title: "Collaboration",
    description: "Captures participation and teamwork during group projects.",
    isExample: true,
  },
];

export const DASHBOARD_EXAMPLE_STUDENTS: StudentRecord[] = [
  {
    id: "example-student-amelia",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Amelia Johnson",
    preferredName: "Millie",
    guardianName: "Sarah Johnson",
    guardianContact: "sarah.johnson@example.com",
    behaviorComment:
      "Consistently supportive of classmates and contributes thoughtful ideas during class discussions.",
    academicComment:
      "Showing strong progress in reading comprehension with increasing confidence in writing tasks.",
    skills: [
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[0]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[0]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 62 },
          { month: "2024-10", score: 68 },
          { month: "2024-11", score: 74 },
          { month: "2024-12", score: 81 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[1]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[1]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 58 },
          { month: "2024-10", score: 61 },
          { month: "2024-11", score: 70 },
          { month: "2024-12", score: 76 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[2]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[2]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 65 },
          { month: "2024-10", score: 72 },
          { month: "2024-11", score: 78 },
          { month: "2024-12", score: 84 },
        ]),
      },
    ],
    isExample: true,
  },
  {
    id: "example-student-oliver",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Oliver Chen",
    guardianName: "David Chen",
    guardianContact: "david.chen@example.com",
    behaviorComment:
      "Friendly and collaborative, often volunteers to support peers during project work.",
    academicComment:
      "Improving narrative structure and developing a more confident writing voice.",
    skills: [
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[0]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[0]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 55 },
          { month: "2024-10", score: 60 },
          { month: "2024-11", score: 64 },
          { month: "2024-12", score: 70 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[1]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[1]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 52 },
          { month: "2024-10", score: 58 },
          { month: "2024-11", score: 66 },
          { month: "2024-12", score: 72 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[2]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[2]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 60 },
          { month: "2024-10", score: 63 },
          { month: "2024-11", score: 69 },
          { month: "2024-12", score: 75 },
        ]),
      },
    ],
    isExample: true,
  },
  {
    id: "example-student-lina",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Lina Ahmed",
    guardianName: "Amina Ahmed",
    guardianContact: "amina.ahmed@example.com",
    behaviorComment:
      "Highly engaged during group work and responds well to constructive feedback.",
    academicComment:
      "Demonstrating rapid growth in both comprehension and creative writing tasks.",
    skills: [
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[0]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[0]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 64 },
          { month: "2024-10", score: 70 },
          { month: "2024-11", score: 77 },
          { month: "2024-12", score: 83 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[1]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[1]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 60 },
          { month: "2024-10", score: 66 },
          { month: "2024-11", score: 71 },
          { month: "2024-12", score: 79 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[2]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[2]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 58 },
          { month: "2024-10", score: 64 },
          { month: "2024-11", score: 71 },
          { month: "2024-12", score: 80 },
        ]),
      },
    ],
    isExample: true,
  },
];

export const DASHBOARD_EXAMPLE_STUDENT_CLASSES = [DASHBOARD_EXAMPLE_CLASS];
