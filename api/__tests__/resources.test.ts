import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import listHandler from "../resources";
import updateHandler from "../resources/[id]/index";
import type { ResourceCard, ResourceListResponse, ResourceRecord } from "../../types/resources";

interface SupabaseResponse {
  data: unknown;
  error?: { message: string } | null;
  count?: number | null;
}

const { SupabaseStub, createStub } = vi.hoisted(() => {
  interface CallRecord {
    table: string;
    method: string;
    args: unknown[];
  }

  class QueryBuilder {
    public readonly calls: CallRecord[] = [];

    constructor(
      private readonly parent: SupabaseStub,
      private readonly table: string,
      private response: SupabaseResponse
    ) {
      this.record("from", []);
    }

    private record(method: string, args: unknown[]): this {
      const entry: CallRecord = { table: this.table, method, args };
      this.calls.push(entry);
      this.parent.calls.push(entry);
      return this;
    }

    select(field: string, options?: unknown): this {
      return this.record("select", [field, options]);
    }

    eq(column: string, value: unknown): this {
      return this.record("eq", [column, value]);
    }

    order(column: string, options?: unknown): this {
      return this.record("order", [column, options]);
    }

    or(condition: string): this {
      return this.record("or", [condition]);
    }

    overlaps(column: string, values: unknown[]): this {
      return this.record("overlaps", [column, values]);
    }

    in(column: string, values: unknown[]): this {
      return this.record("in", [column, values]);
    }

    range(from: number, to: number): this {
      return this.record("range", [from, to]);
    }

    insert(values: unknown): this {
      return this.record("insert", [values]);
    }

    update(values: unknown): this {
      return this.record("update", [values]);
    }

    maybeSingle() {
      this.record("maybeSingle", []);
      return Promise.resolve({
        data: this.response.data,
        error: this.response.error ?? null,
      });
    }

    single() {
      this.record("single", []);
      return Promise.resolve({
        data: this.response.data,
        error: this.response.error ?? null,
      });
    }

    then<TResult1 = any, TResult2 = never>(
      onfulfilled?:
        | ((value: { data: unknown; error: { message: string } | null; count?: number | null }) =>
            | TResult1
            | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
      this.record("then", []);
      const payload = {
        data: this.response.data,
        error: this.response.error ?? null,
        count: this.response.count ?? null,
      };
      if (onfulfilled) {
        try {
          return Promise.resolve(onfulfilled(payload));
        } catch (error) {
          if (onrejected) {
            return Promise.resolve(onrejected(error));
          }
          return Promise.reject(error);
        }
      }
      return Promise.resolve(payload as unknown as TResult1);
    }
  }

  class SupabaseStub {
    public calls: CallRecord[] = [];
    private responses: SupabaseResponse[] = [];

    from(table: string): QueryBuilder {
      const response = this.responses.shift() ?? { data: null, error: null, count: null };
      return new QueryBuilder(this, table, response);
    }

    setResponses(responses: SupabaseResponse[]) {
      this.responses = responses.map((response) => ({
        data: response.data,
        error: response.error ?? null,
        count: response.count ?? null,
      }));
      this.calls = [];
    }
  }

  return { SupabaseStub, createStub: () => new SupabaseStub() };
});

vi.mock("../_lib/supabase", () => {
  const stub = createStub();
  return {
    getSupabaseClient: () => stub,
    __setResponses: (responses: SupabaseResponse[]) => stub.setResponses(responses),
    __getStub: () => stub,
  };
});

vi.mock("../_lib/open-graph", async () => {
  const actual = await vi.importActual<typeof import("../_lib/open-graph")>("../_lib/open-graph");
  return {
    ...actual,
    loadOpenGraphMetadata: vi.fn(async (url: string) => ({
      metadata: {
        title: "OG Title",
        description: "OG Description",
        siteName: "Example",
        image: "https://cdn.example.com/thumb.jpg",
        url,
        providerName: "Example",
        embedHtml: null,
      },
      embedSrc: null,
    })),
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

function createRecord(overrides: Partial<ResourceRecord> = {}): ResourceRecord {
  const base: ResourceRecord = {
    id: "resource-1",
    owner_id: "user-1",
    title: "Example resource",
    description: "Helpful description",
    url: "https://example.com/",
    normalized_url: "https://example.com/",
    domain: "example.com",
    favicon_url: "https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fexample.com",
    thumbnail_url: "https://cdn.example.com/thumb.jpg",
    resource_type: "Video",
    subjects: ["Math"],
    topics: ["STEM"],
    tags: ["assessment"],
    instructional_notes: null,
    status: "draft",
    visibility: "private",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

describe("resources API", () => {
  it("applies search filters when listing resources", async () => {
    const record = createRecord({ status: "published", visibility: "public" });
    setResponses([
      { data: [record], count: 25 },
    ]);

    const request = new Request(
      "http://localhost/api/resources?q=Math&subjects=Math,Science&topics=STEM&tags=Project&types=Video&status=published&visibility=public&page=2&limit=5",
      { method: "GET" }
    );

    const response = await listHandler(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as ResourceListResponse;
    expect(body.items).toHaveLength(1);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(5);
    expect(body.total).toBe(25);

    const calls = getStub().calls;
    expect(calls.some((call) => call.method === "or")).toBe(true);
    expect(
      calls.filter((call) => call.method === "overlaps" && call.args[0] === "subjects").length
    ).toBe(1);
    expect(
      calls.filter((call) => call.method === "overlaps" && call.args[0] === "topics").length
    ).toBe(1);
    expect(
      calls.filter((call) => call.method === "overlaps" && call.args[0] === "tags").length
    ).toBe(1);
    expect(
      calls.some((call) => call.method === "in" && call.args[0] === "resource_type")
    ).toBe(true);
  });

  it("creates a resource with normalized url and metadata", async () => {
    const inserted = createRecord({
      id: "resource-new",
      owner_id: "user-1",
      status: "draft",
      visibility: "private",
      subjects: ["Math"],
      tags: ["ai"],
    });

    setResponses([
      { data: null },
      { data: inserted },
    ]);

    const request = new Request("http://localhost/api/resources", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        url: "https://example.com/?utm_source=newsletter",
        subjects: ["Math"],
        tags: ["ai"],
      }),
    });

    const response = await listHandler(request);
    expect(response.status).toBe(201);
    const body = (await response.json()) as { resource: ResourceCard };
    expect(body.resource.url).toBe("https://example.com/");
    expect(body.resource.domain).toBe("example.com");
    expect(body.resource.subjects).toEqual(["Math"]);

    const insertCall = getStub().calls.find((call) => call.method === "insert");
    expect(insertCall).toBeTruthy();
    const insertedPayload = insertCall?.args[0] as Record<string, unknown>;
    expect(insertedPayload.owner_id).toBe("user-1");
    expect(insertedPayload.normalized_url).toBe("https://example.com/");
    expect(insertedPayload.subjects).toEqual(["Math"]);
  });

  it("updates a resource and refreshes metadata", async () => {
    const existing = createRecord({
      id: "resource-1",
      owner_id: "user-1",
      url: "https://old.example.com/",
      normalized_url: "https://old.example.com/",
      domain: "old.example.com",
      status: "draft",
      visibility: "private",
    });
    const updated = createRecord({
      id: "resource-1",
      owner_id: "user-1",
      url: "https://new.example.com/",
      normalized_url: "https://new.example.com/",
      domain: "new.example.com",
      status: "published",
      visibility: "public",
      subjects: ["Math", "Science"],
    });

    setResponses([
      { data: existing },
      { data: null },
      { data: updated },
    ]);

    const request = new Request("http://localhost/api/resources/resource-1", {
      method: "PUT",
      body: JSON.stringify({
        userId: "user-1",
        url: "https://new.example.com/?utm_campaign=test",
        status: "published",
        visibility: "public",
        subjects: ["Math", "Science"],
        refreshMetadata: true,
      }),
    });

    const response = await updateHandler(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { resource: ResourceCard };
    expect(body.resource.url).toBe("https://new.example.com/");
    expect(body.resource.status).toBe("published");
    expect(body.resource.visibility).toBe("public");
    expect(body.resource.subjects).toEqual(["Math", "Science"]);

    const updateCall = getStub().calls.find((call) => call.method === "update");
    expect(updateCall).toBeTruthy();
    const updatePayload = updateCall?.args[0] as Record<string, unknown>;
    expect(updatePayload.normalized_url).toBe("https://new.example.com/");
    expect(updatePayload.status).toBe("published");
  });
});
