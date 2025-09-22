import { beforeEach, describe, expect, it, vi } from "vitest";

import handler from "../files/signed";

type QueryHandler = (args: { filters: Record<string, unknown> }) => {
  data: any | null;
  error: { message: string } | null;
};

type SignedUrlCall = { bucket: string; path: string; expiresIn: number };

type AuthResponse = {
  data: { user: { id: string; app_metadata?: Record<string, unknown> } } | { user: null } | null;
  error: { message: string } | null;
};

const { stub } = vi.hoisted(() => {
  class QueryBuilder {
    private filters: Record<string, unknown> = {};

    constructor(
      private readonly handler: QueryHandler | null,
    ) {}

    select(): this {
      return this;
    }

    eq(column: string, value: unknown): this {
      this.filters[column] = value;
      return this;
    }

    maybeSingle() {
      if (!this.handler) {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve(this.handler({ filters: { ...this.filters } }));
    }
  }

  class StorageBucket {
    constructor(
      private readonly parent: SupabaseStub,
      private readonly bucket: string,
    ) {}

    async createSignedUrl(path: string, expiresIn: number) {
      this.parent.storageCalls.push({ bucket: this.bucket, path, expiresIn });
      return this.parent.storageResponse;
    }
  }

  class SupabaseStub {
    public tableHandlers: Record<string, QueryHandler | null> = {};
    public storageResponse = { data: { signedUrl: "https://cdn.example.com/signed" }, error: null };
    public storageCalls: SignedUrlCall[] = [];
    public authResponse: AuthResponse = {
      data: { user: { id: "user-1" } },
      error: null,
    };

    setTableHandler(table: string, handler: QueryHandler | null) {
      this.tableHandlers[table] = handler;
    }

    setStorageResponse(url: string) {
      this.storageResponse = { data: { signedUrl: url }, error: null };
    }

    setAuthResponse(response: AuthResponse) {
      this.authResponse = response;
    }

    reset() {
      this.tableHandlers = {};
      this.storageCalls = [];
      this.storageResponse = { data: { signedUrl: "https://cdn.example.com/signed" }, error: null };
      this.authResponse = {
        data: { user: { id: "user-1" } },
        error: null,
      };
    }

    from(table: string) {
      const handler = this.tableHandlers[table] ?? null;
      return new QueryBuilder(handler);
    }

    storage = {
      from: (bucket: string) => new StorageBucket(this, bucket),
    };

    auth = {
      getUser: async (token: string) => {
        this.lastAuthToken = token;
        return this.authResponse;
      },
    };

    public lastAuthToken: string | null = null;
  }

  const stub = new SupabaseStub();

  return { stub };
});

vi.mock("../_lib/supabase", () => ({
  getSupabaseClient: () => stub,
}));

describe("files signed endpoint", () => {
  beforeEach(() => {
    stub.reset();
  });

  it("returns 401 when authentication is missing", async () => {
    const response = await handler(new Request("https://example.com/api/files/signed?bucket=research&path=test"));
    expect(response.status).toBe(401);
    const payload = await response.json();
    expect(payload.error).toMatch(/authentication/i);
  });

  it("validates required query parameters", async () => {
    const withBucket = await handler(
      new Request("https://example.com/api/files/signed?bucket=&path=abc", {
        headers: { Authorization: "Bearer token" },
      }),
    );
    expect(withBucket.status).toBe(400);

    const withPath = await handler(
      new Request("https://example.com/api/files/signed?bucket=research", {
        headers: { Authorization: "Bearer token" },
      }),
    );
    expect(withPath.status).toBe(400);
  });

  it("rejects unsupported buckets", async () => {
    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=public&path=file.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns a signed url for lesson plan exports when owned by the user", async () => {
    stub.setTableHandler("lesson_plan_builder_plans", ({ filters }) => {
      return filters.latest_export_path === "exports/plan.pdf"
        ? { data: { id: "plan-1", owner_id: "user-1" }, error: null }
        : { data: null, error: null };
    });

    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=lesson-plans&path=exports/plan.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.url).toBe("https://cdn.example.com/signed");
    expect(stub.storageCalls).toEqual([
      { bucket: "lesson-plans", path: "exports/plan.pdf", expiresIn: 600 },
    ]);
  });

  it("returns 403 when requesting another user's lesson plan export", async () => {
    stub.setTableHandler("lesson_plan_builder_plans", () => ({
      data: { id: "plan-1", owner_id: "other-user" },
      error: null,
    }));

    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=lesson-plans&path=exports/plan.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(403);
  });

  it("allows participants to download research documents", async () => {
    stub.setTableHandler("research_documents", ({ filters }) => {
      return filters.storage_path === "proj/file.pdf"
        ? { data: { id: "doc-1", project_id: "project-1" }, error: null }
        : { data: null, error: null };
    });
    stub.setTableHandler("research_projects", ({ filters }) => {
      return filters.id === "project-1"
        ? { data: { created_by: "owner" }, error: null }
        : { data: null, error: null };
    });
    stub.setTableHandler("research_participants", ({ filters }) => {
      return filters.project_id === "project-1" && filters.user_id === "user-1"
        ? { data: { id: "participant" }, error: null }
        : { data: null, error: null };
    });

    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=research&path=proj/file.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.url).toBe("https://cdn.example.com/signed");
  });

  it("blocks access to research documents for non-participants", async () => {
    stub.setTableHandler("research_documents", () => ({
      data: { id: "doc-1", project_id: "project-1" },
      error: null,
    }));
    stub.setTableHandler("research_projects", () => ({
      data: { created_by: "someone-else" },
      error: null,
    }));
    stub.setTableHandler("research_participants", () => ({ data: null, error: null }));

    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=research&path=proj/file.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(403);
  });

  it("allows participants to download their submissions", async () => {
    stub.setTableHandler("research_documents", () => ({ data: null, error: null }));
    stub.setTableHandler("research_submissions", ({ filters }) => {
      return filters.storage_path === "project/submission.pdf"
        ? { data: { id: "sub-1", project_id: "project-1", participant_id: "user-1" }, error: null }
        : { data: null, error: null };
    });

    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=research&path=project/submission.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(200);
  });

  it("allows project owners to download submissions", async () => {
    stub.setTableHandler("research_submissions", () => ({
      data: { id: "sub-1", project_id: "project-1", participant_id: "user-2" },
      error: null,
    }));
    stub.setTableHandler("research_projects", () => ({
      data: { created_by: "user-1" },
      error: null,
    }));

    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=research&path=project/submission.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(200);
  });

  it("returns 403 when viewing another participant's submission", async () => {
    stub.setTableHandler("research_submissions", () => ({
      data: { id: "sub-1", project_id: "project-1", participant_id: "user-2" },
      error: null,
    }));
    stub.setTableHandler("research_projects", () => ({
      data: { created_by: "owner" },
      error: null,
    }));
    stub.setTableHandler("research_participants", () => ({ data: null, error: null }));

    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=research&path=project/submission.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 when no file matches the path", async () => {
    stub.setTableHandler("research_documents", () => ({ data: null, error: null }));
    stub.setTableHandler("research_submissions", () => ({ data: null, error: null }));

    const response = await handler(
      new Request("https://example.com/api/files/signed?bucket=research&path=missing.pdf", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(404);
  });
});
