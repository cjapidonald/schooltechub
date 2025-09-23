import { describe, expect, it, beforeEach } from "vitest";

import { loadLessonPlanExportData } from "../lesson-plan-export";

type QueryHandler = (args: { filters: Record<string, unknown> }) => {
  data: any;
  error: { message: string } | null;
};

class QueryBuilder {
  private filters: Record<string, unknown> = {};

  constructor(private readonly handler: QueryHandler | null) {}

  select(): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters[column] = value;
    return this;
  }

  async maybeSingle() {
    if (!this.handler) {
      return { data: null, error: null };
    }
    return this.handler({ filters: { ...this.filters } });
  }

  private async execute() {
    if (!this.handler) {
      return { data: null, error: null };
    }
    return this.handler({ filters: { ...this.filters } });
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onFulfilled?: (value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>,
    onRejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
  ) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

class SupabaseStub {
  private handlers: Record<string, QueryHandler | null> = {};

  setTableHandler(table: string, handler: QueryHandler | null) {
    this.handlers[table] = handler;
  }

  from(table: string) {
    const handler = this.handlers[table] ?? null;
    return new QueryBuilder(handler);
  }

  reset() {
    this.handlers = {};
  }
}

describe("loadLessonPlanExportData", () => {
  const stub = new SupabaseStub();

  beforeEach(() => {
    stub.reset();
  });

  it("maps builder plans with associated steps", async () => {
    stub.setTableHandler("lesson_plan_builder_plans", ({ filters }) => {
      expect(filters).toEqual({ id: "plan-1" });
      return {
        data: {
          id: "plan-1",
          title: "My Lesson",
          summary: "Quick overview",
          objective: "Understand fractions",
          success_criteria: "Students solve example problems",
          owner_id: "user-1",
          status: "draft",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
        error: null,
      };
    });

    stub.setTableHandler("lesson_plan_steps", ({ filters }) => {
      expect(filters).toEqual({ lesson_plan_id: "plan-1" });
      return {
        data: [
          {
            id: "step-1",
            title: "Warm up",
            notes: "Discuss prior knowledge",
            duration_minutes: 10,
            position: 0,
            resources: [
              {
                title: "Intro article",
                url: "https://example.com/intro",
              },
            ],
          },
        ],
        error: null,
      };
    });

    stub.setTableHandler("class_lesson_plans", ({ filters }) => {
      expect(filters).toEqual({ lesson_plan_id: "plan-1" });
      return {
        data: [{ class_id: "class-42" }],
        error: null,
      };
    });

    const result = await loadLessonPlanExportData(
      stub as unknown as any,
      "plan-1",
    );

    expect(result).not.toBeNull();
    expect(result?.ownerId).toBe("user-1");
    expect(result?.classIds).toEqual(["class-42"]);
    expect(result?.plan.title).toBe("My Lesson");
    expect(result?.plan.steps).toHaveLength(1);
    expect(result?.plan.steps[0].notes).toBe("Discuss prior knowledge");
    expect(result?.plan.overview?.objectives).toEqual([
      "Understand fractions",
    ]);
    expect(result?.plan.overview?.successCriteria).toEqual([
      "Students solve example problems",
    ]);
  });

  it("falls back to published plans when builder records are missing", async () => {
    stub.setTableHandler("lesson_plan_builder_plans", () => ({
      data: null,
      error: null,
    }));

    stub.setTableHandler("lesson_plans", ({ filters }) => {
      expect(filters).toEqual({ id: "plan-2" });
      return {
        data: {
          id: "plan-2",
          slug: "plan-2",
          title: "Published lesson",
          summary: "Overview",
          status: "published",
          owner_id: "user-2",
          overview: null,
          content: [],
          resources: [],
          created_at: "2024-02-01T00:00:00Z",
          updated_at: "2024-02-02T00:00:00Z",
        },
        error: null,
      };
    });

    stub.setTableHandler("class_lesson_plans", ({ filters }) => {
      expect(filters).toEqual({ lesson_plan_id: "plan-2" });
      return {
        data: [],
        error: null,
      };
    });

    const result = await loadLessonPlanExportData(
      stub as unknown as any,
      "plan-2",
    );

    expect(result).not.toBeNull();
    expect(result?.ownerId).toBe("user-2");
    expect(result?.classIds).toEqual([]);
    expect(result?.plan.title).toBe("Published lesson");
  });
});

