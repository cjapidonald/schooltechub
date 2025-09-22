import {
  errorResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../../_lib/http";
import { requireUser } from "../../_lib/auth";
import {
  createLessonPlanExportFileName,
  loadLessonPlanExportData,
  renderLessonPlanDocx,
  verifyLessonPlanAccess,
} from "../../_lib/lesson-plan-export";

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  if (method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const id = extractIdFromRequest(request);
  if (!id) {
    return errorResponse(404, "Lesson plan not found");
  }

  const auth = await requireUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  let exportData;
  try {
    exportData = await loadLessonPlanExportData(auth.supabase, id);
  } catch (error) {
    console.error("Failed to load lesson plan for export", error);
    return errorResponse(500, "Failed to load lesson plan");
  }

  if (!exportData) {
    return errorResponse(404, "Lesson plan not found");
  }

  let hasAccess = false;
  try {
    hasAccess = await verifyLessonPlanAccess(auth.supabase, auth.user.id, exportData);
  } catch (error) {
    console.error("Failed to verify lesson plan access", error);
    return errorResponse(500, "Failed to verify lesson plan access");
  }

  if (!hasAccess) {
    return errorResponse(403, "You do not have permission to export this plan");
  }

  let docxBuffer: Uint8Array;
  try {
    docxBuffer = await renderLessonPlanDocx(exportData.plan);
  } catch (error) {
    console.error("Failed to generate lesson plan DOCX", error);
    return errorResponse(500, "Failed to generate DOCX export");
  }

  const fileName = createLessonPlanExportFileName(exportData.plan, "docx");

  return new Response(docxBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function extractIdFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 2];
    return id ? decodeURIComponent(id) : null;
  } catch {
    return null;
  }
}
