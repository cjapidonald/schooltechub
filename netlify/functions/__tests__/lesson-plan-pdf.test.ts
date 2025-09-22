import { describe, expect, it, vi } from "vitest";
import { createLessonPlanPdfHandler, type LessonPlanRecord } from "../lesson-plan-pdf";

describe("lesson-plan pdf handler", () => {
  const baseRecord: LessonPlanRecord = {
    id: "plan-1",
    title: "STEM Robotics",
    summary: "Build robots",
    content: { blocks: [] }
  };

  it("redirects when pdf already exists", async () => {
    const fetchLessonPlan = vi.fn(async () => ({
      data: { ...baseRecord, pdf_public_url: "https://cdn.example.com/plan-1.pdf" },
      error: null
    }));
    const renderPdf = vi.fn();
    const handler = createLessonPlanPdfHandler({
      fetchLessonPlan,
      renderPdf,
      storePdf: vi.fn(),
      updateLessonPlan: vi.fn()
    });

    const response = await handler({ queryStringParameters: { id: "plan-1" } });

    expect(response.statusCode).toBe(302);
    expect(response.headers).toEqual({ Location: "https://cdn.example.com/plan-1.pdf" });
    expect(renderPdf).not.toHaveBeenCalled();
  });

  it("renders and stores pdf when missing", async () => {
    const renderPdf = vi.fn(async () => new Uint8Array([80, 68, 70]));
    const storePdf = vi.fn(async () => ({ publicUrl: "https://cdn.example.com/new.pdf", error: null }));
    const updateLessonPlan = vi.fn(async () => ({ error: null }));

    const handler = createLessonPlanPdfHandler({
      fetchLessonPlan: vi.fn(async () => ({ data: { ...baseRecord, pdf_public_url: null }, error: null })),
      renderPdf,
      storePdf,
      updateLessonPlan
    });

    const response = await handler({ queryStringParameters: { id: "plan-1" } });

    expect(response.statusCode).toBe(200);
    expect(response.isBase64Encoded).toBe(true);
    expect(response.headers).toEqual({ "Content-Type": "application/pdf" });
    expect(storePdf).toHaveBeenCalledWith("plan-1", expect.any(Uint8Array));
    expect(updateLessonPlan).toHaveBeenCalledWith("plan-1", {
      pdf_public_url: "https://cdn.example.com/new.pdf"
    });
  });
});
