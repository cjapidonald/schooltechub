import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";
import { format } from "date-fns";
import puppeteer from "puppeteer";

import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../../_lib/http";
import { getSupabaseClient } from "../../_lib/supabase";

const EXPORT_BUCKET = "lesson-plans-exports";

type LessonPlanRecord = {
  id: string;
  title: string;
  body_md: string | null;
  stage: string | null;
  planned_date: string | null;
  classes?: { title: string | null } | null;
  lesson_plan_resources?: Array<{
    position: number | null;
    resources: {
      id: string;
      title: string;
      type: string;
      instructions: string | null;
      url: string | null;
      file_path: string | null;
    } | null;
  }> | null;
};

type MarkdownBlock =
  | { type: "paragraph"; content: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  if (method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const { id, format: exportFormat } = resolveRequestMeta(request);
  if (!id) {
    return errorResponse(400, "Lesson plan id is required");
  }

  if (exportFormat !== "pdf" && exportFormat !== "docx") {
    return errorResponse(400, "Invalid export format. Use pdf or docx");
  }

  const supabase = getSupabaseClient();
  const { data: plan, error } = await supabase
    .from<LessonPlanRecord>("lesson_plans")
    .select(
      "id,title,body_md,stage,planned_date,classes(title),lesson_plan_resources(position,resources(id,title,type,instructions,url,file_path)))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch lesson plan", error);
    return errorResponse(500, "Unable to load lesson plan for export");
  }

  if (!plan) {
    return errorResponse(404, "Lesson plan not found");
  }

  const markdown = plan.body_md ?? "";
  const blocks = parseMarkdownBlocks(markdown);
  const classTitle = plan.classes?.title ?? "";
  const formattedDate = formatPlannedDate(plan.planned_date);

  try {
    const file = await generateExport({ plan, blocks, format: exportFormat, classTitle, formattedDate });
    const filePath = await uploadExport({
      supabase,
      planId: id,
      buffer: file.buffer,
      contentType: file.contentType,
      extension: file.extension,
    });

    await updateLessonPlanExportPath({ supabase, planId: id, format: exportFormat, path: filePath });

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(EXPORT_BUCKET)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Failed to create signed URL", signedUrlError);
      return errorResponse(500, "Export created but URL signing failed");
    }

    return jsonResponse({ signedUrl: signedUrlData.signedUrl, path: filePath });
  } catch (exportError) {
    console.error("Failed to export lesson plan", exportError);
    return errorResponse(500, "Failed to generate export");
  }
}

function resolveRequestMeta(request: Request): { id: string | null; format: "pdf" | "docx" } {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 2] ?? null;
    const format = (url.searchParams.get("format") ?? "pdf").toLowerCase();
    return { id, format: format === "docx" ? "docx" : "pdf" };
  } catch (error) {
    console.error("Failed to resolve request meta", error);
    return { id: null, format: "pdf" };
  }
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraphBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: "paragraph", content: paragraphBuffer.join(" ").trim() });
      paragraphBuffer = [];
    }
  };

  const flushTable = () => {
    if (tableBuffer.length >= 2) {
      const table = createTableBlock(tableBuffer);
      if (table) {
        blocks.push(table);
      }
    }
    tableBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("|")) {
      flushParagraph();
      tableBuffer.push(line);
      continue;
    }

    if (tableBuffer.length > 0) {
      flushTable();
    }

    if (line.length === 0) {
      flushParagraph();
    } else {
      paragraphBuffer.push(line);
    }
  }

  flushTable();
  flushParagraph();

  return blocks;
}

function createTableBlock(lines: string[]): MarkdownBlock | null {
  if (lines.length < 2) {
    return null;
  }

  const headerLine = lines[0];
  const headerCells = headerLine.split("|").slice(1, -1).map(cell => cell.trim());
  const rowLines = lines.slice(2).filter(line => line.includes("|"));
  const rows = rowLines.map(row => row.split("|").slice(1, -1).map(cell => cell.trim()));

  if (headerCells.length === 0 || rows.length === 0) {
    return null;
  }

  return { type: "table", headers: headerCells, rows };
}

async function generateExport({
  plan,
  blocks,
  format,
  classTitle,
  formattedDate,
}: {
  plan: LessonPlanRecord;
  blocks: MarkdownBlock[];
  format: "pdf" | "docx";
  classTitle: string;
  formattedDate: string;
}): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const html = renderHtml(plan, blocks, classTitle, formattedDate);

  if (format === "pdf") {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "25mm", bottom: "25mm", left: "20mm", right: "20mm" },
      });
      return { buffer: Buffer.from(pdf), contentType: "application/pdf", extension: "pdf" };
    } finally {
      await browser.close();
    }
  }

  const doc = renderDocxDocument(plan, blocks, classTitle, formattedDate);
  const buffer = await Packer.toBuffer(doc);
  return {
    buffer,
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
  };
}

function renderHtml(plan: LessonPlanRecord, blocks: MarkdownBlock[], classTitle: string, formattedDate: string): string {
  const paragraphs = blocks
    .map(block => {
      if (block.type === "paragraph") {
        return `<p>${escapeHtml(block.content)}</p>`;
      }

      const headerRow = block.headers.map(header => `<th>${escapeHtml(header)}</th>`).join("");
      const rows = block.rows
        .map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("");
      return `<table><thead><tr>${headerRow}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 32px; color: #0f172a; }
      h1 { font-size: 28px; margin-bottom: 8px; }
      .meta { color: #475569; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; }
      th, td { border: 1px solid #cbd5f5; padding: 8px 12px; text-align: left; }
      th { background: #f1f5f9; }
      p { line-height: 1.6; margin: 16px 0; white-space: pre-wrap; }
    </style>
    <title>${escapeHtml(plan.title)}</title>
  </head>
  <body>
    <h1>${escapeHtml(plan.title)}</h1>
    <p class="meta">${escapeHtml(classTitle || "")} ${plan.stage ? `• ${escapeHtml(plan.stage)}` : ""} ${formattedDate ? `• ${escapeHtml(formattedDate)}` : ""}</p>
    ${paragraphs}
  </body>
</html>`;
}

function renderDocxDocument(plan: LessonPlanRecord, blocks: MarkdownBlock[], classTitle: string, formattedDate: string): Document {
  const children: Array<Paragraph | Table> = [
    new Paragraph({ text: plan.title, heading: HeadingLevel.HEADING1 }),
    new Paragraph({ text: classTitle || "" }),
    new Paragraph({ text: formattedDate ? `Date: ${formattedDate}` : "" }),
  ];

  for (const block of blocks) {
    if (block.type === "paragraph") {
      children.push(new Paragraph(block.content));
      continue;
    }

    const headerRow = new TableRow({
      children: block.headers.map(header =>
        new TableCell({ children: [new Paragraph(header)], width: { size: 33, type: WidthType.PERCENTAGE } }),
      ),
    });

    const tableRows = block.rows.map(row =>
      new TableRow({
        children: row.map(cell =>
          new TableCell({ children: [new Paragraph(cell)], width: { size: 33, type: WidthType.PERCENTAGE } }),
        ),
      }),
    );

    children.push(new Table({ rows: [headerRow, ...tableRows] }));
  }

  return new Document({
    sections: [
      {
        children,
      },
    ],
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPlannedDate(value: string | null): string {
  if (!value) {
    return "";
  }

  try {
    return format(new Date(value), "PPP");
  } catch (error) {
    console.warn("Failed to format planned date", error);
    return value;
  }
}

async function uploadExport({
  supabase,
  planId,
  buffer,
  contentType,
  extension,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  planId: string;
  buffer: Buffer;
  contentType: string;
  extension: string;
}): Promise<string> {
  const filePath = `${planId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(EXPORT_BUCKET).upload(filePath, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.error("Failed to upload export", error);
    throw new Error("Export upload failed");
  }

  return filePath;
}

async function updateLessonPlanExportPath({
  supabase,
  planId,
  format,
  path,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  planId: string;
  format: "pdf" | "docx";
  path: string;
}): Promise<void> {
  const updates: Record<string, string | null> = {};
  if (format === "pdf") {
    updates.exported_pdf_url = path;
  } else {
    updates.exported_docx_url = path;
  }

  const { error } = await supabase.from("lesson_plans").update(updates).eq("id", planId);
  if (error) {
    console.error("Failed to update lesson plan export path", error);
    throw new Error("Failed to record export path");
  }
}
