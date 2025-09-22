import type { PlanPartTemplate } from "@/contexts/PlanEditorContext";

export interface PlanPartGroup {
  id: string;
  label: string;
  description?: string;
  parts: PlanPartTemplate[];
}

export const PLAN_PART_GROUPS: PlanPartGroup[] = [
  {
    id: "activities",
    label: "Activities",
    description: "Engage students with collaborative or hands-on experiences.",
    parts: [
      {
        id: "collaborative-activity",
        type: "activity",
        title: "Collaborative Activity",
        description: "Group work or partner tasks to reinforce new concepts.",
        defaultDuration: 15,
      },
      {
        id: "guided-practice",
        type: "activity",
        title: "Guided Practice",
        description: "Teacher-led modeling with student participation.",
        defaultDuration: 10,
      },
      {
        id: "independent-practice",
        type: "activity",
        title: "Independent Practice",
        description: "Individual work time for demonstrating mastery.",
        defaultDuration: 12,
      },
    ],
  },
  {
    id: "timers",
    label: "Timers",
    description: "Structure your pacing with countdowns and transitions.",
    parts: [
      {
        id: "warmup-timer",
        type: "timer",
        title: "Warm-up Timer",
        description: "Quick opener to activate prior knowledge.",
        defaultDuration: 5,
      },
      {
        id: "transition-timer",
        type: "timer",
        title: "Transition Timer",
        description: "Prep students to switch activities smoothly.",
        defaultDuration: 3,
      },
      {
        id: "reflection-timer",
        type: "timer",
        title: "Reflection Timer",
        description: "Silent reflection or journaling time.",
        defaultDuration: 7,
      },
    ],
  },
  {
    id: "objectives",
    label: "Objectives",
    description: "Clarify learning outcomes and success criteria.",
    parts: [
      {
        id: "learning-objective",
        type: "objective",
        title: "Learning Objective",
        description: "Define what students should know or do by the end.",
        defaultDuration: 3,
      },
      {
        id: "success-criteria",
        type: "objective",
        title: "Success Criteria",
        description: "List the indicators for demonstrating mastery.",
        defaultDuration: 4,
      },
    ],
  },
  {
    id: "standards",
    label: "Standards",
    description: "Align instruction with curriculum or SEL frameworks.",
    parts: [
      {
        id: "academic-standard",
        type: "standard",
        title: "Academic Standard",
        description: "Reference a curriculum or subject area standard.",
        defaultDuration: 2,
      },
      {
        id: "sel-competency",
        type: "standard",
        title: "SEL Competency",
        description: "Highlight social-emotional learning outcomes.",
        defaultDuration: 2,
      },
    ],
  },
  {
    id: "exports",
    label: "Exports",
    description: "Prepare sharable artifacts for families or colleagues.",
    parts: [
      {
        id: "family-update",
        type: "export",
        title: "Family Update",
        description: "Summary email or newsletter template.",
        defaultDuration: 8,
      },
      {
        id: "team-handout",
        type: "export",
        title: "Team Handout",
        description: "Printable overview for support staff.",
        defaultDuration: 6,
      },
    ],
  },
];
