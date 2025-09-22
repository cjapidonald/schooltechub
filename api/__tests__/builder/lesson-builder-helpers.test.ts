import { describe, expect, it } from "vitest";

import {
  buildUpdatePayload,
  createDraftInsert,
  mapRecordToBuilderPlan,
} from "../../_lib/lesson-builder-helpers";
import { mergeStepValues } from "../../../types/lesson-builder";
import type { LessonPlanRecord } from "../../../types/lesson-plans";

function createRecord(overrides: Partial<LessonPlanRecord> = {}): LessonPlanRecord {
  const base: LessonPlanRecord = {
    id: "plan-1",
    slug: "plan-1",
    title: "Sample",
    status: "draft",
    summary: "Summary",
    stage: null,
    stages: [],
    subjects: [],
    delivery_methods: [],
    technology_tags: [],
    duration_minutes: null,
    pdf_url: null,
    overview: null,
    resources: [],
    content: [
      {
        id: "step-1",
        title: "Launch",
        description: "Introduce topic",
        blocks: [
          { type: "paragraph", text: "Welcome" },
          {
            type: "builderStepMetadata",
            learning_goals: ["Goal"],
            grouping: "Pairs",
            delivery_mode: "in-person",
            instructional_note: "Be encouraging",
            resources: [
              {
                id: "activity-1",
                media_type: "activity",
                source_id: "activity-1",
                title: "Launch",
                url: "https://example.com",
              },
            ],
          },
        ],
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null,
    lesson_date: "2024-05-01",
    school_logo_url: "https://example.com/logo.png",
  } as LessonPlanRecord;

  return { ...base, ...overrides };
}

describe("lesson builder helpers", () => {
  it("maps record metadata and step extensions", () => {
    const record = createRecord({
      metadata: {
        builder: {
          version: 3,
          lastSavedAt: "2024-05-02T12:00:00Z",
          steps: [
            {
              id: "step-1",
              title: "Launch",
              description: "Introduce topic",
              learning_goals: ["Understand"],
              grouping: "Whole class",
              delivery_mode: "online",
              instructional_note: "Provide visuals",
              resources: [
                {
                  id: "resource-1",
                  media_type: "activity",
                  source_id: "activity-1",
                  title: "Video",
                  url: "https://example.com/video",
                },
              ],
            },
          ],
          history: [],
          parts: [],
          standards: [],
          availableStandards: [],
          school_logo_url: "https://example.com/logo-from-metadata.png",
          lesson_date: "2024-05-03",
        },
      },
    });

    const plan = mapRecordToBuilderPlan(record);

    expect(plan.school_logo_url).toBe("https://example.com/logo.png");
    expect(plan.lesson_date).toBe("2024-05-01");
    expect(plan.steps[0].learning_goals).toEqual(["Understand"]);
    expect(plan.steps[0].grouping).toBe("Whole class");
    expect(plan.steps[0].delivery_mode).toBe("online");
    expect(plan.steps[0].instructional_note).toBe("Provide visuals");
    expect(plan.steps[0].resources[0]).toMatchObject({
      media_type: "activity",
      source_id: "activity-1",
      title: "Video",
    });
    expect(plan.version).toBe(3);
    expect(plan.lastSavedAt).toBe("2024-05-02T12:00:00Z");
  });

  it("derives extended step fields from content when metadata missing", () => {
    const record = createRecord({ metadata: null });
    const plan = mapRecordToBuilderPlan(record);

    expect(plan.steps[0].learning_goals).toEqual(["Goal"]);
    expect(plan.steps[0].grouping).toBe("Pairs");
    expect(plan.steps[0].delivery_mode).toBe("in-person");
    expect(plan.steps[0].instructional_note).toBe("Be encouraging");
    expect(plan.steps[0].resources[0]).toMatchObject({
      media_type: "activity",
      title: "Launch",
    });
  });

  it("builds update payload with extended plan fields", () => {
    const plan = {
      id: "plan-1",
      slug: "plan-1",
      title: "Sample",
      summary: "Summary",
      status: "draft" as const,
      stage: null,
      stages: [],
      subjects: [],
      deliveryMethods: [],
      technologyTags: [],
      durationMinutes: null,
      overview: null,
      steps: [
        mergeStepValues({
          title: "Launch",
          learning_goals: ["Understand"],
          grouping: "Pairs",
          delivery_mode: "in-person",
          instructional_note: "Encourage discussion",
          resources: [
            {
              id: "resource-1",
              media_type: "activity",
              source_id: "activity-1",
              title: "Launch",
              url: "https://example.com",
            },
          ],
        }),
      ],
      standards: [],
      availableStandards: [],
      resources: [],
      lastSavedAt: "2024-05-02T12:00:00Z",
      version: 2,
      parts: [
        { id: "overview", label: "Overview", description: null, completed: true },
      ],
      history: [],
      createdAt: "2024-05-01T12:00:00Z",
      updatedAt: "2024-05-02T12:00:00Z",
      school_logo_url: "https://example.com/logo.png",
      lesson_date: "2024-05-05",
    };

    const payload = buildUpdatePayload(plan);

    expect(payload.lesson_date).toBe("2024-05-05");
    expect(payload.school_logo_url).toBe("https://example.com/logo.png");
    expect(payload.metadata?.builder?.lesson_date).toBe("2024-05-05");
    expect(payload.metadata?.builder?.school_logo_url).toBe("https://example.com/logo.png");
    const steps = payload.metadata?.builder?.steps as Array<{ learning_goals: string[] }>;
    expect(steps[0].learning_goals).toEqual(["Understand"]);
  });

  it("normalizes steps when creating draft inserts", () => {
    const plan = {
      id: "plan-1",
      slug: "plan-1",
      title: "Sample",
      summary: null,
      stage: null,
      stages: [],
      subjects: [],
      deliveryMethods: [],
      technologyTags: [],
      durationMinutes: null,
      status: "draft" as const,
      overview: null,
      steps: [mergeStepValues({ title: "Launch" })],
      standards: [],
      availableStandards: [],
      resources: [],
      version: 1,
      parts: [],
      history: [],
      lesson_date: "2024-05-05",
      school_logo_url: "https://example.com/logo.png",
    };

    const insert = createDraftInsert(plan);
    expect(insert.lesson_date).toBe("2024-05-05");
    expect(insert.school_logo_url).toBe("https://example.com/logo.png");
    const builder = (insert.metadata as { builder: { steps: unknown[] } }).builder;
    expect(builder.steps[0]).toHaveProperty("learning_goals");
    expect(builder.steps[0]).toHaveProperty("resources");
  });
});
