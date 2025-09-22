import { beforeEach, describe, expect, it, vi } from "vitest";

import handler from "../resources/[id]/download";

type SupabaseAuthResponse = {
  data: { user: { id: string } } | { user: null } | null;
  error: { message: string } | null;
};

type SupabaseQueryResponse = {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
};

type SupabaseSignedUrlResponse = {
  data: { signedUrl: string } | null;
  error: { message: string } | null;
};

const { stub } = vi.hoisted(() => {
  class QueryBuilder {
    constructor(private readonly parent: SupabaseStub) {}

    select(): this {
      return this;
    }

    eq(): this {
      return this;
    }

    async maybeSingle() {
      return this.parent.queryResponse;
    }
  }

  class StorageBucket {
    constructor(private readonly parent: SupabaseStub, private readonly bucket: string) {}

    async createSignedUrl(path: string, expiresIn: number) {
      this.parent.signedUrlCalls.push({ bucket: this.bucket, path, expiresIn });
      return this.parent.signedUrlResponse;
    }
  }

  class SupabaseStub {
    public queryResponse: SupabaseQueryResponse = { data: null, error: null };
    public signedUrlResponse: SupabaseSignedUrlResponse = { data: null, error: null };
    public authResponse: SupabaseAuthResponse = {
      data: { user: { id: "user-1" } },
      error: null,
    };
    public authCalls: string[] = [];
    public signedUrlCalls: Array<{ bucket: string; path: string; expiresIn: number }> = [];

    public from(): QueryBuilder {
      return new QueryBuilder(this);
    }

    public storage = {
      from: (bucket: string) => new StorageBucket(this, bucket),
    };

    public auth = {
      getUser: async (token: string) => {
        this.authCalls.push(token);
        return this.authResponse;
      },
    };

    reset() {
      this.queryResponse = { data: null, error: null };
      this.signedUrlResponse = { data: null, error: null };
      this.authResponse = { data: { user: { id: "user-1" } }, error: null };
      this.authCalls = [];
      this.signedUrlCalls = [];
    }
  }

  const stub = new SupabaseStub();

  return { stub };
});

vi.mock("../_lib/supabase", () => ({
  getSupabaseClient: () => stub,
}));

describe("resource download handler", () => {
  beforeEach(() => {
    stub.reset();
  });

  it("returns 401 when not authenticated", async () => {
    const request = new Request("https://example.com/api/resources/resource-1/download");
    const response = await handler(request);

    expect(response.status).toBe(401);
    const payload = await response.json();
    expect(payload.error).toMatch(/authentication/i);
  });

  it("returns 404 for resources that are not approved or active", async () => {
    stub.queryResponse = {
      data: {
        id: "resource-1",
        status: "pending",
        is_active: true,
        storage_path: "resources/resource-1.pdf",
        url: null,
      },
      error: null,
    };

    const request = new Request("https://example.com/api/resources/resource-1/download", {
      headers: { Authorization: "Bearer valid-token" },
    });

    const response = await handler(request);

    expect(stub.authCalls).toEqual(["valid-token"]);
    expect(response.status).toBe(404);
  });

  it("redirects to a signed url when a storage path is present", async () => {
    stub.queryResponse = {
      data: {
        id: "resource-1",
        status: "approved",
        is_active: true,
        storage_path: "resources/resource-1.pdf",
        url: null,
      },
      error: null,
    };

    stub.signedUrlResponse = {
      data: { signedUrl: "https://cdn.example.com/signed/resource-1" },
      error: null,
    };

    const request = new Request("https://example.com/api/resources/resource-1/download", {
      headers: { Authorization: "Bearer valid-token" },
    });

    const response = await handler(request);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://cdn.example.com/signed/resource-1");
    expect(stub.signedUrlCalls).toEqual([
      { bucket: "resources", path: "resources/resource-1.pdf", expiresIn: 600 },
    ]);
  });

  it("redirects to the external url when no storage path is defined", async () => {
    stub.queryResponse = {
      data: {
        id: "resource-2",
        status: "approved",
        is_active: true,
        storage_path: null,
        url: "https://videos.example.com/resource-2",
      },
      error: null,
    };

    const request = new Request("https://example.com/api/resources/resource-2/download", {
      headers: { Authorization: "Bearer valid-token" },
    });

    const response = await handler(request);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://videos.example.com/resource-2");
  });
});
