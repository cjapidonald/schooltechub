import { Buffer } from "node:buffer";

import type { LessonPlanRecord } from "../../../types/lesson-plans";
import { exportLessonPlan } from "../../_lib/lesson-plan-exporters";
import { mapRecordToDetail, parseRequestUrl } from "../../_lib/lesson-plan-helpers";
import { getSupabaseClient } from "../../_lib/supabase";

const EXPORT_BUCKET =
  process.env.LESSON_PLAN_EXPORT_BUCKET ?? "lesson-plan-exports";
const SIGNED_URL_EXPIRY_SECONDS = Number.parseInt(
  process.env.LESSON_PLAN_EXPORT_EXPIRY ?? "3600",
  10
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type ExportFormat = "pdf" | "docx";
type ExportVariant = "default" | "handout";

type ExportQuery = {
  format: ExportFormat;
  variant: ExportVariant;
  includeQrCodes: boolean;
  store: boolean;
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method?.toUpperCase() === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method?.toUpperCase() !== "GET") {
    return new Response(null, {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        Allow: "GET,OPTIONS",
      },
    });
  }

  try {
    const { url, id } = parseRequest(request);
    if (!id) {
      return jsonResponse({ error: "Lesson plan not found" }, 404);
    }

    const query = parseExportQuery(url.searchParams);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from<LessonPlanRecord>("lesson_plans")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load lesson plan", error);
      return jsonResponse({ error: "Failed to load lesson plan" }, 500);
    }

    if (!data) {
      return jsonResponse({ error: "Lesson plan not found" }, 404);
    }

    if (!query.store && query.format === "pdf") {
      const pdfUrl =
        typeof data.pdf_url === "string" && data.pdf_url.trim().length > 0
          ? data.pdf_url
          : null;
      if (pdfUrl) {
        return new Response(null, {
          status: 302,
          headers: {
            ...CORS_HEADERS,
            Location: pdfUrl,
          },
        });
      }
    }

    const detail = mapRecordToDetail(data);
    const exportResult = await exportLessonPlan(detail, {
      format: query.format,
      variant: query.variant,
      includeQrCodes: query.includeQrCodes,
    });

    if (!query.store) {
      return new Response(exportResult.buffer, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": exportResult.mimeType,
          "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      });
    }

    const storage = supabase.storage.from(EXPORT_BUCKET);
    const objectPath = buildStoragePath(detail.slug, exportResult.filename);
    const payload = Buffer.from(exportResult.buffer);
    const uploadResult = await storage.upload(objectPath, payload, {
      contentType: exportResult.mimeType,
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadResult.error) {
      console.error("Failed to upload export", uploadResult.error);
      return jsonResponse({ error: "Failed to persist export" }, 500);
    }

    const expiresIn = normalizeExpiry(SIGNED_URL_EXPIRY_SECONDS);
    const signedResult = await storage.createSignedUrl(objectPath, expiresIn);

    if (signedResult.error || !signedResult.data) {
      console.error("Failed to create signed URL", signedResult.error);
      return jsonResponse({ error: "Failed to create download link" }, 500);
    }

    return jsonResponse(
      {
        url: signedResult.data.signedUrl,
        path: objectPath,
        expiresIn,
        filename: exportResult.filename,
        format: query.format,
        variant: query.variant,
      },
      200
    );
  } catch (error) {
    console.error("Unexpected export error", error);
    return jsonResponse({ error: "Unable to export lesson plan" }, 500);
  }
}

function parseRequest(request: Request): { url: URL; id: string | null } {
  const url = parseRequestUrl(request);
  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments.pop();
  if (last?.toLowerCase() !== "export") {
    return { url, id: null };
  }

  const id = segments.pop() ?? null;
  return { url, id };
}

function parseExportQuery(params: URLSearchParams): ExportQuery {
  const formatParam = (params.get("format") ?? "pdf").toLowerCase();
  const variantParam = (params.get("variant") ?? "default").toLowerCase();

  const format: ExportFormat = formatParam === "docx" ? "docx" : "pdf";
  const variant: ExportVariant = variantParam === "handout" ? "handout" : "default";

  const includeQrCodes = parseBoolean(params.get("qr"));
  const store = parseBoolean(params.get("store"));

  return { format, variant, includeQrCodes, store };
}

function parseBoolean(value: string | null): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function buildStoragePath(slug: string, filename: string): string {
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${safeSlug || "lesson-plan"}/${timestamp}-${filename}`;
}

function normalizeExpiry(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 3600;
  }
  return Math.max(60, Math.trunc(value));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

