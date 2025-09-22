import { beforeEach, describe, expect, it, vi } from "vitest";

import listHandler from "../../activities";
import createHandler from "../../activities/create";
import ogHandler from "../../og-scrape";
import { SupabaseStub } from "./supabase-stub";

const stub = new SupabaseStub();

vi.mock("../../_lib/supabase", () => ({
  getSupabaseClient: () => stub,
}));

beforeEach(() => {
  stub.reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("activities list", () => {
  it("applies filters and pagination", async () => {
    stub.setResponses([
      {
        data: [{ id: "activity-1", title: "Robotics Warmup" }],
        count: 30,
      },
    ]);

    const response = await listHandler(
      new Request(
        "http://localhost/api/activities?q=robot&subjects=STEM&types=warmup&page=2&limit=5"
      )
    );

    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.nextCursor).toBe(10);

    expect(stub.calls.find((call) => call.method === "ilike")).toBeDefined();
    expect(stub.calls.find((call) => call.method === "overlaps")).toBeDefined();
    expect(stub.calls.find((call) => call.method === "range")).toBeDefined();
  });
});

describe("activity creation", () => {
  it("creates activity records", async () => {
    stub.setResponses([{ data: { id: "activity-1", title: "Robotics" } }]);

    const response = await createHandler(
      new Request("http://localhost/api/activities/create", {
        method: "POST",
        body: JSON.stringify({
          userId: "teacher-1",
          title: "Robotics",
          url: "https://example.com",
        }),
      })
    );

    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.activity.id).toBe("activity-1");

    const insertCall = stub.calls.find((call) => call.method === "insert");
    expect(insertCall?.args[0]).toMatchObject({
      title: "Robotics",
      created_by: "teacher-1",
    });
  });

  it("requires a title", async () => {
    const response = await createHandler(
      new Request("http://localhost/api/activities/create", {
        method: "POST",
        body: JSON.stringify({ userId: "teacher-1" }),
      })
    );
    expect(response.status).toBe(400);
  });
});

describe("og scrape", () => {
  it("normalizes url, loads metadata, and sanitizes embed", async () => {
    const html = `
      <html>
        <head>
          <title>Sample</title>
          <meta property="og:title" content="OG Title" />
          <meta property="og:description" content="OG Description" />
          <meta property="og:image" content="https://cdn.example/image.jpg" />
          <link rel="alternate" type="application/json+oembed" href="https://example.com/oembed.json" />
        </head>
      </html>
    `;
    const oEmbed = {
      title: "Embed Title",
      provider_name: "Provider",
      thumbnail_url: "https://cdn.example/thumb.jpg",
      html: '<iframe src="https://player.example/embed"></iframe>',
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(html, { status: 200, headers: { "Content-Type": "text/html" } })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(oEmbed), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await ogHandler(
      new Request("http://localhost/api/og-scrape", {
        method: "POST",
        body: JSON.stringify({ url: "example.com/watch" }),
      })
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.url).toBe("https://example.com/watch");
    expect(body.metadata.embedHtml).toContain("iframe");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.com/watch");
  });

  it("rejects unsupported embed markup", async () => {
    const html = `
      <html>
        <head>
          <link rel="alternate" type="application/json+oembed" href="https://example.com/oembed.json" />
        </head>
      </html>
    `;
    const oEmbed = {
      html: "<div>Not allowed</div>",
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(html, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(oEmbed), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await ogHandler(
      new Request("http://localhost/api/og-scrape", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/watch" }),
      })
    );

    expect(response.status).toBe(422);
  });
});
