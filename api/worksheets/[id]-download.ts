import type { WorksheetRecord } from "../../types/worksheets";
import {
  mapRecordToWorksheet,
  parseRequestUrl,
  renderWorksheetToPdf,
} from "../_lib/worksheet-helpers";
import { getSupabaseClient } from "../_lib/supabase";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method && request.method.toUpperCase() !== "GET") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET" },
    });
  }

  const url = parseRequestUrl(request);
  const segments = url.pathname.split("/").filter(Boolean);
  const action = segments.pop();
  if (action?.toLowerCase() !== "download") {
    return jsonResponse({ error: "Worksheet not found" }, 404);
  }
  const id = segments.pop();

  if (!id) {
    return jsonResponse({ error: "Worksheet not found" }, 404);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from<WorksheetRecord>("worksheets")
    .select("*")
    .eq("status", "published")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Failed to load worksheet" }, 500);
  }

  if (!data) {
    return jsonResponse({ error: "Worksheet not found" }, 404);
  }

  if (data.pdf_url && typeof data.pdf_url === "string") {
    return new Response(null, {
      status: 302,
      headers: {
        Location: data.pdf_url,
      },
    });
  }

  const worksheet = mapRecordToWorksheet(data);
  const pdfBuffer = await renderWorksheetToPdf(worksheet);

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${worksheet.slug}.pdf"`,
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
