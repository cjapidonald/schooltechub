import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import listHandler from "../../lesson-plans";
import detailHandler from "../../lesson-plans/[id]";
import duplicateHandler from "../../lesson-plans/[id]/duplicate";
import versionsHandler from "../../lesson-plans/[id]/versions";
import exportHandler from "../../lesson-plans/[id]/export";
import { SupabaseStub, type SupabaseResponse } from "./supabase-stub";

const stub = new SupabaseStub();

vi.mock("../../_lib/supabase", () => ({
  getSupabaseClient: () => stub,
}));

beforeAll(() => {
  // ensure fetch is available in tests that rely on it
  if (!(global as any).fetch) {
    (global as any).fetch = vi.fn();
  }
});

beforeEach(() => {
  stub.reset();
});

describe("lesson plan creation", () => {
  it("creates a plan using teacher profile defaults", async () => {
    stub.setResponses([
      {
        data: {
          default_stage: "middle",
          default_duration_minutes: 50,
          default_subject: "Science",
          default_summary: "Base summary",
        },
      },
      {
        data: {
          id: "plan-123",
          title: "Untitled lesson plan",
          share_access: "owner",
        },
      },
    ]);

    const response = await listHandler(
      new Request("http://localhost/api/lesson-plans", {
        method: "POST",
        body: JSON.stringify({ userId: "teacher-1" }),
      })
    );

    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.plan.title).toBe("Untitled lesson plan");
    expect(body.plan.shareAccess).toBe("owner");

    const insertCall = stub.calls.find((call) => call.method === "insert");
    expect(insertCall).toBeDefined();
    expect(insertCall?.args[0]).toMatchObject({
      owner_id: "teacher-1",
      stage: "middle",
      duration_minutes: 50,
      subject: "Science",
    });
  });

  it("requires a user id", async () => {
    const response = await listHandler(
      new Request("http://localhost/api/lesson-plans", { method: "POST" })
    );
    expect(response.status).toBe(400);
  });
});

describe("lesson plan detail", () => {
  it("returns read-only plan when share access is viewer", async () => {
    stub.setResponses([
      {
        data: {
          id: "plan-1",
          title: "Plan",
          share_access: "viewer",
          owner_id: "owner-1",
        },
      },
      { data: [{ id: "step-1", title: "Intro" }] },
    ]);

    const response = await detailHandler(
      new Request("http://localhost/api/lesson-plans/plan-1", {
        headers: { Authorization: "Bearer token" },
      })
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.plan.readOnly).toBe(true);
    expect(body.steps).toHaveLength(1);
  });

  it("requires authentication to view a plan", async () => {
    const response = await detailHandler(
      new Request("http://localhost/api/lesson-plans/plan-1")
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when requesting a private plan owned by another user", async () => {
    stub.setAuthResponses([
      { data: { user: { id: "viewer-1" } }, error: null },
    ]);
    stub.setResponses([
      { data: { id: "plan-1", share_access: "owner", owner_id: "owner-1" } },
    ]);

    const response = await detailHandler(
      new Request("http://localhost/api/lesson-plans/plan-1", {
        headers: { Authorization: "Bearer token" },
      })
    );

    expect(response.status).toBe(403);
  });

  it("updates plan and snapshots activity resources", async () => {
    const responses: SupabaseResponse[] = [
      { data: { id: "plan-1", share_access: "owner", owner_id: "teacher-1" } },
      {
        data: {
          id: "plan-1",
          title: "Updated title",
          share_access: "owner",
          owner_id: "teacher-1",
        },
      },
      { data: [] },
      {
        data: {
          id: "plan-1",
          title: "Updated title",
          share_access: "owner",
          owner_id: "teacher-1",
        },
      },
      {
        data: [
          {
            id: "step-1",
            title: "Activity Title",
            position: 0,
            resources: [
              {
                type: "activity",
                activityId: "activity-1",
                title: "Activity Title",
                url: "https://example.com",
              },
            ],
          },
        ],
      },
    ];
    stub.setAuthResponses([
      { data: { user: { id: "teacher-1" } }, error: null },
    ]);
    stub.setResponses(responses);

    const response = await detailHandler(
      new Request("http://localhost/api/lesson-plans/plan-1", {
        method: "PATCH",
        headers: { Authorization: "Bearer token" },
        body: JSON.stringify({
          plan: { title: "Updated title" },
          steps: [
            {
              id: "step-1",
              activity: {
                id: "activity-1",
                title: "Activity Title",
                url: "https://example.com",
                durationMinutes: 15,
              },
            },
          ],
        }),
      })
    );

    const body = await response.json();
    expect(body.plan.title).toBe("Updated title");
    expect(body.steps[0].resources[0]).toMatchObject({
      activityId: "activity-1",
      title: "Activity Title",
    });

    const upsertCall = stub.calls.find((call) => call.method === "upsert");
    expect(upsertCall).toBeDefined();
    const stepPayload = (upsertCall?.args[0] as any[])[0];
    expect(stepPayload.resources[0]).toMatchObject({
      activityId: "activity-1",
      title: "Activity Title",
      url: "https://example.com",
    });
    expect(stepPayload.title).toBe("Activity Title");
    expect(stepPayload.duration_minutes).toBe(15);
  });

  it("requires authentication to update a lesson plan", async () => {
    const response = await detailHandler(
      new Request("http://localhost/api/lesson-plans/plan-1", {
        method: "PATCH",
        body: JSON.stringify({ plan: { title: "Updated" } }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when updating a plan without edit access", async () => {
    stub.setAuthResponses([
      { data: { user: { id: "teacher-1" } }, error: null },
    ]);
    stub.setResponses([
      { data: { id: "plan-1", share_access: "viewer", owner_id: "teacher-2" } },
    ]);

    const response = await detailHandler(
      new Request("http://localhost/api/lesson-plans/plan-1", {
        method: "PATCH",
        headers: { Authorization: "Bearer token" },
        body: JSON.stringify({ plan: { title: "Updated" } }),
      })
    );

    expect(response.status).toBe(403);
  });
});

describe("lesson plan duplication", () => {
  it("duplicates plan and steps", async () => {
    stub.setAuthResponses([
      { data: { user: { id: "teacher-1" } }, error: null },
    ]);
    stub.setResponses([
      {
        data: {
          id: "plan-1",
          title: "Original",
          share_access: "owner",
          summary: "Summary",
          owner_id: "teacher-1",
        },
      },
      {
        data: [
          {
            id: "step-1",
            title: "Intro",
            position: 0,
            resources: [],
          },
        ],
      },
      {
        data: {
          id: "plan-2",
          title: "Original (Copy)",
          share_access: "owner",
          owner_id: "teacher-1",
        },
      },
      { data: [] },
    ]);

    const response = await duplicateHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/duplicate", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
        body: JSON.stringify({}),
      })
    );

    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.plan.id).toBe("plan-2");

    const stepInsert = stub.calls.filter((call) => call.method === "insert");
    expect(stepInsert[1]?.args[0][0]).toMatchObject({
      lesson_plan_id: "plan-2",
      title: "Intro",
    });
  });

  it("requires authentication to duplicate a lesson plan", async () => {
    const response = await duplicateHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/duplicate", {
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when duplicating a plan without editor access", async () => {
    stub.setAuthResponses([
      { data: { user: { id: "viewer-1" } }, error: null },
    ]);
    stub.setResponses([
      { data: { id: "plan-1", share_access: "viewer", owner_id: "owner-1" } },
    ]);

    const response = await duplicateHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/duplicate", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(403);
  });
});

describe("lesson plan versions", () => {
  it("lists versions", async () => {
    stub.setResponses([
      { data: [{ id: "version-1", label: "Snapshot" }], count: 1 },
    ]);

    const response = await versionsHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/versions")
    );

    const body = await response.json();
    expect(body.versions).toHaveLength(1);
    expect(body.versions[0].id).toBe("version-1");
  });

  it("creates version snapshot", async () => {
    stub.setResponses([
      { data: { id: "plan-1", share_access: "owner" } },
      { data: { id: "plan-1", title: "Plan" } },
      { data: [{ id: "step-1" }] },
      { data: { id: "version-1", label: null } },
    ]);

    const response = await versionsHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/versions", {
        method: "POST",
        body: JSON.stringify({ userId: "teacher-1" }),
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.version.id).toBe("version-1");

    const insertCall = stub.calls.find((call) => call.method === "insert");
    expect(insertCall?.args[0]).toMatchObject({
      lesson_plan_id: "plan-1",
    });
  });
});

describe("lesson plan export", () => {
  it("updates export selection and returns signed url", async () => {
    stub.setResponses([
      { data: { id: "plan-1", share_access: "owner" } },
      {
        data: {
          id: "plan-1",
          share_access: "owner",
          latest_export_path: "exports/plan-1.pdf",
        },
      },
    ]);
    stub.setStorageResponses([{ data: { signedUrl: "https://signed.example" } }]);

    const response = await exportHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/export", {
        method: "POST",
        body: JSON.stringify({
          userId: "teacher-1",
          exportType: "pdf",
          exportPath: "exports/plan-1.pdf",
          bucket: "lesson-exports",
          expiresIn: 120,
        }),
      })
    );

    const body = await response.json();
    expect(body.signedUrl).toBe("https://signed.example");
    expect(stub.storageCalls[0]).toMatchObject({
      bucket: "lesson-exports",
      path: "exports/plan-1.pdf",
      expiresIn: 120,
    });
  });

  it("blocks export when share access is viewer", async () => {
    stub.setResponses([{ data: { id: "plan-1", share_access: "viewer" } }]);

    const response = await exportHandler(
      new Request("http://localhost/api/lesson-plans/plan-1/export", {
        method: "POST",
        body: JSON.stringify({ userId: "teacher-1" }),
      })
    );

    expect(response.status).toBe(403);
  });
});
