import { describe, expect, it, vi, beforeEach } from "vitest";

import pdfHandler from "../lesson-plans/[id]/export.pdf";
import docxHandler from "../lesson-plans/[id]/export.docx";

const authMocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
}));

const exportMocks = vi.hoisted(() => ({
  loadLessonPlanExportData: vi.fn(),
  verifyLessonPlanAccess: vi.fn(),
  renderLessonPlanPdf: vi.fn(),
  renderLessonPlanDocx: vi.fn(),
  createLessonPlanExportFileName: vi.fn(),
}));

vi.mock("../_lib/auth", () => authMocks);

vi.mock("../_lib/lesson-plan-export", () => exportMocks);

const { requireUser } = authMocks;
const {
  loadLessonPlanExportData,
  verifyLessonPlanAccess,
  renderLessonPlanPdf,
  renderLessonPlanDocx,
  createLessonPlanExportFileName,
} = exportMocks;

describe("lesson plan export routes", () => {
  beforeEach(() => {
    requireUser.mockReset();
    loadLessonPlanExportData.mockReset();
    verifyLessonPlanAccess.mockReset();
    renderLessonPlanPdf.mockReset();
    renderLessonPlanDocx.mockReset();
    createLessonPlanExportFileName.mockReset();
  });

  it("rejects non-GET requests", async () => {
    const response = await pdfHandler(new Request("http://localhost/api/lesson-plans/plan-1/export.pdf", { method: "POST" }));
    expect(response.status).toBe(405);
  });

  it("requires authentication", async () => {
    requireUser.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const response = await pdfHandler(new Request("http://localhost/api/lesson-plans/plan-1/export.pdf"));
    expect(response.status).toBe(401);
  });

  it("returns 404 when plan is missing", async () => {
    requireUser.mockResolvedValueOnce({ supabase: {}, user: { id: "user-1" } });
    loadLessonPlanExportData.mockResolvedValueOnce(null);
    const response = await pdfHandler(new Request("http://localhost/api/lesson-plans/plan-1/export.pdf"));
    expect(response.status).toBe(404);
  });

  it("returns 403 when access is denied", async () => {
    requireUser.mockResolvedValueOnce({ supabase: {}, user: { id: "user-1" } });
    loadLessonPlanExportData.mockResolvedValueOnce({ plan: { title: "Plan" }, ownerId: "user-2", classIds: [] });
    verifyLessonPlanAccess.mockResolvedValueOnce(false);
    const response = await pdfHandler(new Request("http://localhost/api/lesson-plans/plan-1/export.pdf"));
    expect(response.status).toBe(403);
  });

  it("returns a PDF when export succeeds", async () => {
    const buffer = new Uint8Array([1, 2, 3]);
    requireUser.mockResolvedValueOnce({ supabase: {}, user: { id: "user-1" } });
    loadLessonPlanExportData.mockResolvedValueOnce({ plan: { title: "Plan" }, ownerId: "user-1", classIds: [] });
    verifyLessonPlanAccess.mockResolvedValueOnce(true);
    renderLessonPlanPdf.mockResolvedValueOnce(buffer);
    createLessonPlanExportFileName.mockReturnValueOnce("plan.pdf");

    const response = await pdfHandler(new Request("http://localhost/api/lesson-plans/plan-1/export.pdf"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("plan.pdf");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(body)).toEqual([1, 2, 3]);
  });

  it("returns a DOCX when export succeeds", async () => {
    const buffer = new Uint8Array([9, 8, 7]);
    requireUser.mockResolvedValueOnce({ supabase: {}, user: { id: "user-1" } });
    loadLessonPlanExportData.mockResolvedValueOnce({ plan: { title: "Plan" }, ownerId: "user-1", classIds: [] });
    verifyLessonPlanAccess.mockResolvedValueOnce(true);
    renderLessonPlanDocx.mockResolvedValueOnce(buffer);
    createLessonPlanExportFileName.mockReturnValueOnce("plan.docx");

    const response = await docxHandler(new Request("http://localhost/api/lesson-plans/plan-1/export.docx"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(response.headers.get("Content-Disposition")).toContain("plan.docx");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(body)).toEqual([9, 8, 7]);
  });
});
