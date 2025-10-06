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
    id: "example-student-linh-san",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Linh San",
    preferredName: "Linh",
    email: "linhsan@gmail.com",
    guardianName: "Mai San",
    guardianContact: "mai.san@example.com",
    behaviorComment:
      "Leads morning reflection circles with poise and encourages quieter peers to share their thinking.",
    academicComment:
      "Drafts vivid narratives and is experimenting with audio reflections to extend her stories beyond the page.",
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
    id: "example-student-amelia",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Amelia Johnson",
    preferredName: "Millie",
    email: "amelia.johnson@example.com",
    guardianName: "Sarah Johnson",
    guardianContact: "sarah.johnson@example.com",
    behaviorComment:
      "Jumps in to coach peers during workshop time and documents class norms on the board.",
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
    id: "example-student-oliver",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Oliver Chen",
    email: "oliver.chen@example.com",
    guardianName: "David Chen",
    guardianContact: "david.chen@example.com",
    behaviorComment:
      "Sets up media equipment for peer presentations and offers thoughtful feedback questions.",
    academicComment:
      "Curating stronger evidence in reflective journals and experimenting with multimedia storytelling.",
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
  {
    id: "example-student-ravi",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Ravi Singh",
    preferredName: "Ravi",
    email: "ravi.singh@example.com",
    guardianName: "Priya Singh",
    guardianContact: "priya.singh@example.com",
    behaviorComment: "Builds community by pairing classmates for peer review and checking in on new arrivals.",
    academicComment: "Experimenting with stronger evidence in persuasive writing and reflecting confidently on feedback.",
    skills: [
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[0]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[0]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 58 },
          { month: "2024-10", score: 63 },
          { month: "2024-11", score: 68 },
          { month: "2024-12", score: 73 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[1]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[1]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 56 },
          { month: "2024-10", score: 61 },
          { month: "2024-11", score: 66 },
          { month: "2024-12", score: 71 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[2]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[2]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 60 },
          { month: "2024-10", score: 65 },
          { month: "2024-11", score: 70 },
          { month: "2024-12", score: 75 },
        ]),
      },
    ],
    isExample: true,
  },
  {
    id: "example-student-maya",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Maya Lopez",
    preferredName: "Maya",
    email: "maya.lopez@example.com",
    guardianName: "Elena Lopez",
    guardianContact: "elena.lopez@example.com",
    behaviorComment: "Keeps group projects organized with shared checklists and celebrates teammates' wins on the class board.",
    academicComment: "Applying new vocabulary intentionally in daily writing warm-ups and reading discussions.",
    skills: [
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[0]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[0]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 61 },
          { month: "2024-10", score: 66 },
          { month: "2024-11", score: 71 },
          { month: "2024-12", score: 75 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[1]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[1]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 59 },
          { month: "2024-10", score: 64 },
          { month: "2024-11", score: 69 },
          { month: "2024-12", score: 73 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[2]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[2]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 63 },
          { month: "2024-10", score: 68 },
          { month: "2024-11", score: 72 },
          { month: "2024-12", score: 77 },
        ]),
      },
    ],
    isExample: true,
  },
  {
    id: "example-student-harper",
    classId: DASHBOARD_EXAMPLE_CLASS_ID,
    fullName: "Harper Lee",
    email: "harper.lee@example.com",
    guardianName: "Jordan Lee",
    guardianContact: "jordan.lee@example.com",
    behaviorComment: "Leads tech setup for storytelling stations and offers encouraging peer feedback during share-outs.",
    academicComment: "Growing confidence with inferencing and experimenting with multimodal storytelling drafts.",
    skills: [
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[0]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[0]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 54 },
          { month: "2024-10", score: 59 },
          { month: "2024-11", score: 64 },
          { month: "2024-12", score: 69 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[1]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[1]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 55 },
          { month: "2024-10", score: 60 },
          { month: "2024-11", score: 65 },
          { month: "2024-12", score: 70 },
        ]),
      },
      {
        skillId: DASHBOARD_EXAMPLE_SKILLS[2]!.id,
        skillName: DASHBOARD_EXAMPLE_SKILLS[2]!.title,
        scores: createScoreSeries([
          { month: "2024-09", score: 57 },
          { month: "2024-10", score: 62 },
          { month: "2024-11", score: 66 },
          { month: "2024-12", score: 71 },
        ]),
      },
    ],
    isExample: true,
  },
];

export const DASHBOARD_EXAMPLE_STUDENT_CLASSES = [DASHBOARD_EXAMPLE_CLASS];
