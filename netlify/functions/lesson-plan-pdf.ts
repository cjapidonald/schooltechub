import { createClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";

type HandlerEvent = {
  queryStringParameters?: Record<string, string | undefined>;
};

type HandlerResponse = {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
  isBase64Encoded?: boolean;
};

export interface LessonPlanRecord {
  id: string;
  title: string;
  content?: unknown;
  summary?: string | null;
  pdf_public_url?: string | null;
  [key: string]: unknown;
}

export interface LessonPlanPdfDeps {
  fetchLessonPlan: (id: string) => Promise<{ data: LessonPlanRecord | null; error: Error | null }>;
  storePdf: (id: string, payload: Uint8Array) => Promise<{ publicUrl: string | null; error: Error | null }>;
  updateLessonPlan: (id: string, payload: Partial<LessonPlanRecord>) => Promise<{ error: Error | null }>;
  renderPdf: (lessonPlan: LessonPlanRecord) => Promise<Uint8Array>;
}

const toBuffer = (data: Uint8Array): Buffer => {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
};

export const createLessonPlanPdfHandler = (deps: LessonPlanPdfDeps) => {
  return async (event: HandlerEvent): Promise<HandlerResponse> => {
    const id = event.queryStringParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing lesson plan id" }),
        headers: { "Content-Type": "application/json" }
      };
    }

    try {
      const { data, error } = await deps.fetchLessonPlan(id);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to load lesson plan" }),
          headers: { "Content-Type": "application/json" }
        };
      }

      if (!data) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Lesson plan not found" }),
          headers: { "Content-Type": "application/json" }
        };
      }

      if (data.pdf_public_url) {
        return {
          statusCode: 302,
          body: "",
          headers: { Location: data.pdf_public_url }
        };
      }

      const pdfPayload = await deps.renderPdf(data);
      const uploadResult = await deps.storePdf(id, pdfPayload);

      if (uploadResult.error || !uploadResult.publicUrl) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to store PDF" }),
          headers: { "Content-Type": "application/json" }
        };
      }

      const updateResult = await deps.updateLessonPlan(id, {
        pdf_public_url: uploadResult.publicUrl
      });

      if (updateResult.error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to update lesson plan" }),
          headers: { "Content-Type": "application/json" }
        };
      }

      const buffer = toBuffer(pdfPayload);
      return {
        statusCode: 200,
        body: buffer.toString("base64"),
        isBase64Encoded: true,
        headers: { "Content-Type": "application/pdf" }
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unexpected error"
        }),
        headers: { "Content-Type": "application/json" }
      };
    }
  };
};

const createServiceRoleClient = () => {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase service role credentials are not configured");
  }

  return createClient(url, serviceKey);
};

const getPdfBucket = () => process.env.LESSON_PLAN_PDF_BUCKET ?? "lesson-plan-pdfs";

const defaultRenderPdf = async (lessonPlan: LessonPlanRecord): Promise<Uint8Array> => {
  const content = `Lesson Plan: ${lessonPlan.title}`;
  return Buffer.from(content, "utf-8");
};

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const supabase = createServiceRoleClient();
  const bucket = getPdfBucket();
  const storage = supabase.storage.from(bucket);

  const deps: LessonPlanPdfDeps = {
    fetchLessonPlan: async (id: string) => {
      const { data, error } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      return { data: data ?? null, error: error ? new Error(error.message) : null };
    },
    storePdf: async (id: string, payload: Uint8Array) => {
      const path = `${id}.pdf`;
      const upload = await storage.upload(path, payload, {
        contentType: "application/pdf",
        upsert: true
      });

      if (upload.error) {
        return { publicUrl: null, error: new Error(upload.error.message) };
      }

      const { data } = storage.getPublicUrl(path);
      return { publicUrl: data.publicUrl ?? null, error: null };
    },
    updateLessonPlan: async (id: string, payload: Partial<LessonPlanRecord>) => {
      const { error } = await supabase
        .from("lesson_plans")
        .update(payload)
        .eq("id", id);

      return { error: error ? new Error(error.message) : null };
    },
    renderPdf: defaultRenderPdf
  };

  const handlerImpl = createLessonPlanPdfHandler(deps);
  return handlerImpl(event);
};
