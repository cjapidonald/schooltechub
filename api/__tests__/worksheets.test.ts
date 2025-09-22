import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import listHandler from "../worksheets";
import slugHandler from "../worksheets/[slug]";
import downloadHandler from "../worksheets/[id]-download";
import answersHandler from "../worksheets/[id]-answers";
import type { WorksheetRecord } from "../../types/worksheets";
import {
  decodeCursor,
  encodeCursor,
  parseBooleanParam,
  parseListFilters,
} from "../_lib/worksheet-helpers";

vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: unknown }) => children,
  Page: ({ children }: { children: unknown }) => children,
  Text: ({ children }: { children: unknown }) => children,
  View: ({ children }: { children: unknown }) => children,
  Image: ({ children }: { children: unknown }) => children,
  Link: ({ children }: { children: unknown }) => children,
  StyleSheet: { create: () => ({}) },
  renderToBuffer: async () => new Uint8Array([1]),
}));

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

    maybeSingle() {
      this.calls.push({ method: "maybeSingle", args: [] });
      return Promise.resolve({
        data: this.response.data,
        error: this.response.error ?? null,
      });
    }

    then<T>(
      onFulfilled: (value: { data: unknown; error: { message: string } | null }) => T,
    ): Promise<T> {
      this.calls.push({ method: "then", args: [] });
      return Promise.resolve(
        onFulfilled({
          data: this.response.data,
          error: this.response.error ?? null,
        }),
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

function createRecord(overrides: Partial<WorksheetRecord> = {}): WorksheetRecord {
  const base: WorksheetRecord = {
    id: "worksheet-1",
    title: "Phonics OR Sound Hunt",
    slug: "phonics-or-sound-hunt",
    overview: "Practice decoding the ''or'' sound",
    stage: "1",
    subjects: ["English"],
    skills: ["phonics-or"],
    worksheet_type: "practice",
    difficulty: "easy",
    format: "pdf",
    tech_integrated: false,
    thumbnail_url: null,
    page_images: ["https://example.com/page-1.png"],
    pdf_url: "https://example.com/worksheet.pdf",
    answer_key_url: null,
    language: "en",
    tags: ["literacy"],
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    has_answer_key: false,
  };
  return {
    ...base,
    ...overrides,
  };
}

describe("worksheet helpers", () => {
  it("parses filters from the request url", () => {
    const url = new URL(
      "http://localhost/api/worksheets?q=fractions&stage=4,5&type=quiz&difficulty=medium&format=pdf&tech=true&answers=1",
    );
    url.searchParams.append("subjects", "math,science");
    url.searchParams.append("skills", "fractions");

    const filters = parseListFilters(url);
    expect(filters.q).toBe("fractions");
    expect(filters.stage).toEqual(["4", "5"]);
    expect(filters.worksheetTypes).toEqual(["quiz"]);
    expect(filters.difficulties).toEqual(["medium"]);
    expect(filters.formats).toEqual(["pdf"]);
    expect(filters.techIntegratedOnly).toBe(true);
    expect(filters.answersOnly).toBe(true);
    expect(filters.subjects).toEqual(["math", "science"]);
    expect(filters.skills).toEqual(["fractions"]);
  });

  it("round-trips cursor encoding", () => {
    const cursor = encodeCursor(40);
    expect(cursor).toBeTypeOf("string");
    expect(decodeCursor(cursor)).toBe(40);
  });

  it("parses boolean params", () => {
    const params = new URLSearchParams("tech=yes&answers=false");
    expect(parseBooleanParam(params, "tech")).toBe(true);
    expect(parseBooleanParam(params, "answers")).toBe(false);
  });
});

describe("worksheet api handlers", () => {
  it("returns paginated worksheets and next cursor", async () => {
    const records = [
      createRecord({ id: "1", slug: "one" }),
      createRecord({ id: "2", slug: "two" }),
      createRecord({ id: "3", slug: "three" }),
    ];
    setResponses([{ data: records }]);

    const response = await listHandler(
      new Request("http://localhost/api/worksheets?limit=2"),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      items: WorksheetRecord[];
      nextCursor: string | null;
    };
    expect(payload.items).toHaveLength(2);
    expect(payload.nextCursor).not.toBeNull();
  });

  it("applies filters to the supabase query", async () => {
    const records = [createRecord()];
    setResponses([{ data: records }]);

    await listHandler(
      new Request(
        "http://localhost/api/worksheets?q=fractions&stage=4,5&subjects=Math&skills=fractions&type=practice&difficulty=easy&format=pdf&tech=true&answers=true",
      ),
    );

    const builder = getStub().builders[0];
    const methods = builder.calls.map((call) => call.method);
    expect(methods).toContain("textSearch");
    expect(methods).toContain("overlaps");
    expect(methods).toContain("in");
    expect(methods).toContain("eq");
  });

  it("falls back to basic search when full-text fails", async () => {
    const records = [createRecord({ title: "Fallback" })];
    setResponses([
      { data: null, error: { message: "fts failed" } },
      { data: records, error: null },
    ]);

    const response = await listHandler(
      new Request("http://localhost/api/worksheets?q=fractions"),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { items: { title: string }[] };
    expect(payload.items[0]?.title).toBe("Fallback");
    expect(getStub().builders).toHaveLength(2);
  });

  it("returns worksheet details by slug", async () => {
    setResponses([{ data: createRecord() }]);

    const response = await slugHandler(
      new Request("http://localhost/api/worksheets/phonics-or-sound-hunt"),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { slug: string };
    expect(payload.slug).toBe("phonics-or-sound-hunt");
  });

  it("returns 404 when worksheet missing", async () => {
    setResponses([{ data: null, error: null }]);

    const response = await slugHandler(
      new Request("http://localhost/api/worksheets/missing"),
    );
    expect(response.status).toBe(404);
  });

  it("redirects to hosted pdf when available", async () => {
    setResponses([
      {
        data: createRecord({ pdf_url: "https://example.com/direct.pdf" }),
        error: null,
      },
    ]);

    const response = await downloadHandler(
      new Request("http://localhost/api/worksheets/worksheet-1/download"),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://example.com/direct.pdf",
    );
  });

  it("generates a pdf when hosted asset missing", async () => {
    const pdfSpy = vi.spyOn(
      await import("../_lib/worksheet-helpers"),
      "renderWorksheetToPdf",
    );
    pdfSpy.mockResolvedValue(new Uint8Array([1, 2, 3]));
    setResponses([
      {
        data: createRecord({ pdf_url: null }),
        error: null,
      },
    ]);

    const response = await downloadHandler(
      new Request("http://localhost/api/worksheets/worksheet-1/download"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    pdfSpy.mockRestore();
  });

  it("redirects to answer key when available", async () => {
    setResponses([
      {
        data: createRecord({ answer_key_url: "https://example.com/answers.pdf" }),
        error: null,
      },
    ]);

    const response = await answersHandler(
      new Request("http://localhost/api/worksheets/worksheet-1/answers"),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://example.com/answers.pdf",
    );
  });

  it("returns 404 when answer key missing", async () => {
    setResponses([{ data: createRecord({ answer_key_url: null }), error: null }]);

    const response = await answersHandler(
      new Request("http://localhost/api/worksheets/worksheet-1/answers"),
    );
    expect(response.status).toBe(404);
  });
});
