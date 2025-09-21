import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import listHandler from "../lesson-plans";
import slugHandler from "../lesson-plans/[slug]";
import pdfHandler from "../lesson-plans/[id]-pdf";
import type { LessonPlanRecord } from "../../types/lesson-plans";
import { decodeCursor } from "../_lib/lesson-plan-helpers";

interface SupabaseResponse {
  data: unknown;
  error?: { message: string } | null;
}

const { SupabaseStub, createStub } = vi.hoisted(() => {
  class StubQueryBuilder {
    public readonly calls: Array<{ method: string; args: unknown[] }> = [];

    constructor(private readonly response: SupabaseResponse) {}

    select(field: string): this {
      this.calls.push({ method: "select", args: [field] });
      return this;
    }

    eq(column: string, value: unknown): this {
      this.calls.push({ method: "eq", args: [column, value] });
      return this;
    }

    in(column: string, values: unknown[]): this {
      this.calls.push({ method: "in", args: [column, values] });
      return this;
    }

    ilike(column: string, value: unknown): this {
      this.calls.push({ method: "ilike", args: [column, value] });
      return this;
    }

    overlaps(column: string, values: unknown[]): this {
      this.calls.push({ method: "overlaps", args: [column, values] });
      return this;
    }

    textSearch(column: string, query: string, options?: unknown): this {
      this.calls.push({ method: "textSearch", args: [column, query, options] });
      return this;
    }

    or(condition: string): this {
      this.calls.push({ method: "or", args: [condition] });
      return this;
    }

    order(column: string, options?: unknown): this {
      this.calls.push({ method: "order", args: [column, options] });
      return this;
    }

    range(from: number, to: number): this {
      this.calls.push({ method: "range", args: [from, to] });
      return this;
    }

    limit(value: number): this {
      this.calls.push({ method: "limit", args: [value] });
      return this;
    }

    maybeSingle() {
      this.calls.push({ method: "maybeSingle", args: [] });
      return Promise.resolve({
        data: this.response.data,
        error: this.response.error ?? null,
      });
    }

    single() {
      this.calls.push({ method: "single", args: [] });
      return Promise.resolve({
        data: this.response.data,
        error: this.response.error ?? null,
      });
    }

    then<T>(
      onFulfilled: (value: { data: unknown; error: { message: string } | null }) => T
    ): Promise<T> {
      this.calls.push({ method: "then", args: [] });
      return Promise.resolve(
        onFulfilled({
          data: this.response.data,
          error: this.response.error ?? null,
        })
      );
    }
  }

  class SupabaseStub {
    public builders: StubQueryBuilder[] = [];
    private responses: SupabaseResponse[] = [];

    from() {
      const response = this.responses.shift() ?? { data: null, error: null };
      const builder = new StubQueryBuilder(response);
      builder.calls.push({ method: "from", args: [] });
      this.builders.push(builder);
      return builder;
    }

    setResponses(responses: SupabaseResponse[]) {
      this.responses = responses.map((response) => ({
        data: response.data,
        error: response.error ?? null,
      }));
      this.builders = [];
    }
  }

  return {
    SupabaseStub,
    createStub: () => new SupabaseStub(),
  };
});

vi.mock("../_lib/supabase", () => {
  const stub = createStub();
  return {
    getSupabaseClient: () => stub,
    __setResponses: (responses: SupabaseResponse[]) => stub.setResponses(responses),
    __getStub: () => stub,
  };
});

let setResponses: (responses: SupabaseResponse[]) => void;
let getStub: () => InstanceType<typeof SupabaseStub>;

beforeAll(async () => {
  const supabaseModule = (await import("../_lib/supabase")) as unknown as {
    __setResponses: (responses: SupabaseResponse[]) => void;
    __getStub: () => InstanceType<typeof SupabaseStub>;
  };
  setResponses = supabaseModule.__setResponses;
  getStub = supabaseModule.__getStub;
});

beforeEach(() => {
  setResponses([]);
});

function createRecord(overrides: Partial<LessonPlanRecord> = {}): LessonPlanRecord {
  const base: LessonPlanRecord = {
    id: "plan-1",
    slug: "plan-1",
    title: "AI Lesson",
    status: "published",
    summary: "Engaging AI lesson",
    stage: "Middle",
    stages: ["Middle"],
    subjects: ["Math"],
    delivery_methods: ["in-person"],
    technology_tags: ["ai"],
    duration_minutes: 45,
    pdf_url: null,
    content: [
      {
        title: "Introduction",
        description: "Warm-up",
        blocks: [
          {
            type: "paragraph",
            text: "Discuss prior knowledge",
          },
        ],
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  } as LessonPlanRecord;
  return {
    ...base,
    ...overrides,
  };
}

describe("lesson plan list handler", () => {
  it("returns paginated lesson plans and next cursor", async () => {
    const records = [
      createRecord({ id: "1", slug: "one" }),
      createRecord({ id: "2", slug: "two" }),
      createRecord({ id: "3", slug: "three" }),
    ];
    setResponses([{ data: records }]);

    const response = await listHandler(
      new Request("http://localhost/api/lesson-plans?limit=2")
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      items: Array<{ slug: string }>;
      nextCursor: string | null;
    };
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0].slug).toBe("one");
    expect(payload.items[1].slug).toBe("two");
    expect(payload.nextCursor).not.toBeNull();
    expect(decodeCursor(payload.nextCursor)).toBe(2);

    const builder = getStub().builders[0];
    expect(builder.calls.find((call) => call.method === "order")).toBeDefined();
    expect(builder.calls.find((call) => call.method === "range")).toBeDefined();
    expect(
      builder.calls.find((call) => call.method === "textSearch")
    ).toBeUndefined();
  });

  it("applies filters and full-text search", async () => {
    setResponses([{ data: [] }]);

    const response = await listHandler(
      new Request(
        "http://localhost/api/lesson-plans?q=ai&stage=middle,high&subjects=Math,Science&delivery=virtual&tech=vr"
      )
    );
    expect(response.status).toBe(200);

    const builder = getStub().builders[0];
    expect(
      builder.calls.find(
        (call) => call.method === "textSearch" && call.args[1] === "ai"
      )
    ).toBeDefined();
    expect(
      builder.calls.find(
        (call) => call.method === "in" && Array.isArray(call.args[1])
      )
    ).toBeDefined();
    expect(
      builder.calls.filter((call) => call.method === "overlaps").length
    ).toBeGreaterThanOrEqual(2);
  });

  it("falls back to ilike search when full-text fails", async () => {
    setResponses([
      { data: null, error: { message: "missing column" } },
      { data: [] },
    ]);

    const response = await listHandler(
      new Request("http://localhost/api/lesson-plans?q=robots")
    );
    expect(response.status).toBe(200);

    const builders = getStub().builders;
    expect(
      builders[0].calls.some((call) => call.method === "textSearch")
    ).toBe(true);
    expect(
      builders[1].calls.some((call) => call.method === "or")
    ).toBe(true);
  });
});

describe("lesson plan detail handler", () => {
  it("returns 404 when slug missing", async () => {
    const response = await slugHandler(
      new Request("http://localhost/api/lesson-plans/")
    );
    expect(response.status).toBe(404);
  });

  it("returns lesson plan detail", async () => {
    const record = createRecord({ slug: "differentiation" });
    setResponses([{ data: record }]);

    const response = await slugHandler(
      new Request("http://localhost/api/lesson-plans/differentiation")
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { slug: string; content: unknown[] };
    expect(payload.slug).toBe("differentiation");
    expect(Array.isArray(payload.content)).toBe(true);
    const builder = getStub().builders[0];
    expect(
      builder.calls.find(
        (call) => call.method === "eq" && call.args[0] === "slug"
      )
    ).toBeDefined();
  });
});

describe("lesson plan pdf handler", () => {
  it("redirects to hosted pdf when available", async () => {
    const record = createRecord({ pdf_url: "https://example.com/plan.pdf" });
    setResponses([{ data: record }]);

    const response = await pdfHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/pdf")
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://example.com/plan.pdf");
  });

  it("streams a generated pdf when pdf_url missing", async () => {
    const record = createRecord({ pdf_url: null });
    setResponses([{ data: record }]);

    const response = await pdfHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/pdf")
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
