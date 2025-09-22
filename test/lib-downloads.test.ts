import { afterEach, describe, expect, it, vi } from "vitest";

import { getLessonPlanExportUrl } from "@/lib/lessonPlans";
import { getDocumentDownloadUrl, getSubmissionDownloadUrl } from "@/lib/research";
import type { SupabaseClient } from "@supabase/supabase-js";

function createClient(): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "token", user: { id: "user-1" } } },
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
}

describe("download helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retrieves a signed lesson plan export url", async () => {
    const client = createClient();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ url: "https://signed.example/lesson" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const url = await getLessonPlanExportUrl("exports/plan.pdf", client);

    expect(url).toBe("https://signed.example/lesson");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/files/signed?bucket=lesson-plans&path=exports%2Fplan.pdf",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        method: "GET",
      }),
    );
  });

  it("retrieves a signed research document url", async () => {
    const client = createClient();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ url: "https://signed.example/doc" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const url = await getDocumentDownloadUrl({ storagePath: "project/doc.pdf" }, client);

    expect(url).toBe("https://signed.example/doc");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/files/signed?bucket=research&path=project%2Fdoc.pdf",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        method: "GET",
      }),
    );
  });

  it("retrieves a signed research submission url", async () => {
    const client = createClient();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ url: "https://signed.example/sub" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const url = await getSubmissionDownloadUrl({ storagePath: "project/submission.pdf" }, client);

    expect(url).toBe("https://signed.example/sub");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/files/signed?bucket=research&path=project%2Fsubmission.pdf",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        method: "GET",
      }),
    );
  });
});
