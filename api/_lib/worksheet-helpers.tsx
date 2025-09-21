import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Worksheet,
  WorksheetCard,
  WorksheetListResponse,
  WorksheetRecord,
} from "../../types/worksheets";

const BASE_URL = "http://localhost";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const FULL_TEXT_COLUMN = "search_vector";
const BASE_SELECT = "*";

export interface WorksheetListFilters {
  q: string | null;
  stage: string[];
  subjects: string[];
  skills: string[];
  worksheetTypes: string[];
  difficulties: string[];
  formats: string[];
  techIntegratedOnly: boolean;
  answersOnly: boolean;
  limit: number;
  offset: number;
}

export interface WorksheetQueryOptions {
  useFullTextSearch?: boolean;
}

export function parseRequestUrl(request: Request): URL {
  try {
    return new URL(request.url);
  } catch {
    return new URL(request.url, BASE_URL);
  }
}

export function parseListFilters(url: URL): WorksheetListFilters {
  const params = url.searchParams;
  const limit = clampLimit(parseInteger(params.get("limit")) ?? DEFAULT_LIMIT);
  const cursor = params.get("cursor");
  const page = parsePositiveInteger(params.get("page"));
  const offsetFromCursor = decodeCursor(cursor);
  const offset =
    offsetFromCursor ?? (page && page > 0 ? (page - 1) * limit : 0);

  return {
    q: sanitizeSearchTerm(params.get("q")),
    stage: parseListParam(params, "stage"),
    subjects: parseListParam(params, "subjects"),
    skills: parseListParam(params, "skills"),
    worksheetTypes: parseListParam(params, "type"),
    difficulties: parseListParam(params, "difficulty"),
    formats: parseListParam(params, "format"),
    techIntegratedOnly: parseBooleanParam(params, "tech"),
    answersOnly: parseBooleanParam(params, "answers"),
    limit,
    offset,
  };
}

export function parseListParam(params: URLSearchParams, key: string): string[] {
  const values = params.getAll(key);
  if (values.length === 0) {
    const singular = params.get(`${key}[]`);
    if (singular) {
      values.push(singular);
    }
  }
  if (values.length === 0) {
    const fallback = params.get(key);
    if (fallback) {
      values.push(fallback);
    }
  }

  const parsed = values
    .flatMap((value) =>
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .map((value) => value.toLowerCase());

  return Array.from(new Set(parsed));
}

export function parseBooleanParam(params: URLSearchParams, key: string): boolean {
  const value = params.get(key);
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

export function clampLimit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(value)));
}

export function parseInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parsePositiveInteger(value: string | null): number | null {
  const parsed = parseInteger(value);
  return parsed && parsed > 0 ? parsed : null;
}

export function sanitizeSearchTerm(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset }), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | null): number | null {
  if (!cursor) {
    return null;
  }
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { offset?: number };
    if (typeof decoded.offset === "number" && decoded.offset >= 0) {
      return Math.trunc(decoded.offset);
    }
    return null;
  } catch {
    return null;
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function ensureStringArray(value: string[] | null | undefined): string[] {
  if (!value) {
    return [];
  }
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

export function buildWorksheetQuery(
  client: SupabaseClient,
  filters: WorksheetListFilters,
  options: WorksheetQueryOptions = {},
): PostgrestFilterBuilder<WorksheetRecord> {
  const { useFullTextSearch = true } = options;

  let query = client
    .from<WorksheetRecord>("worksheets")
    .select(BASE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (filters.stage.length > 0) {
    if (filters.stage.length === 1) {
      query = query.eq("stage", filters.stage[0]);
    } else {
      query = query.in("stage", filters.stage);
    }
  }

  if (filters.subjects.length > 0) {
    query = query.overlaps("subjects", filters.subjects);
  }

  if (filters.skills.length > 0) {
    query = query.overlaps("skills", filters.skills);
  }

  if (filters.worksheetTypes.length > 0) {
    query = query.in("worksheet_type", filters.worksheetTypes);
  }

  if (filters.difficulties.length > 0) {
    query = query.in("difficulty", filters.difficulties);
  }

  if (filters.formats.length > 0) {
    query = query.in("format", filters.formats);
  }

  if (filters.techIntegratedOnly) {
    query = query.eq("tech_integrated", true);
  }

  if (filters.answersOnly) {
    query = query.eq("has_answer_key", true);
  }

  if (filters.q) {
    if (useFullTextSearch) {
      query = query.textSearch(
        FULL_TEXT_COLUMN,
        filters.q,
        {
          type: "websearch",
          config: "english",
        },
      );
    } else {
      const escaped = escapeLike(filters.q);
      const pattern = `%${escaped}%`;
      query = query.or(
        [
          `title.ilike.${pattern}`,
          `overview.ilike.${pattern}`,
          `worksheet_type.ilike.${pattern}`,
          `difficulty.ilike.${pattern}`,
          `format.ilike.${pattern}`,
        ].join(","),
      );
    }
  }

  const end = filters.offset + filters.limit;
  query = query.range(filters.offset, end);

  return query;
}

export function mapRecordToCard(record: WorksheetRecord): WorksheetCard {
  const subjects = ensureStringArray(record.subjects);
  const skills = ensureStringArray(record.skills);

  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    overview: record.overview ?? null,
    stage: record.stage,
    subjects,
    skills,
    worksheet_type: record.worksheet_type ?? null,
    difficulty: record.difficulty ?? null,
    format: record.format,
    thumbnail_url: record.thumbnail_url ?? null,
    hasAnswerKey:
      Boolean(record.has_answer_key) || Boolean(record.answer_key_url),
  };
}

export function mapRecordToWorksheet(record: WorksheetRecord): Worksheet {
  const card = mapRecordToCard(record);

  return {
    ...card,
    tech_integrated: Boolean(record.tech_integrated),
    page_images: ensureStringArray(record.page_images),
    pdf_url: record.pdf_url ?? null,
    answer_key_url: record.answer_key_url ?? null,
    language: record.language ?? null,
    tags: ensureStringArray(record.tags),
    status: record.status ?? "draft",
    created_at: record.created_at ?? null,
    published_at: record.published_at ?? null,
  };
}

export function buildListResponse(
  records: WorksheetRecord[],
  filters: WorksheetListFilters,
): WorksheetListResponse {
  const hasMore = records.length > filters.limit;
  const items = hasMore ? records.slice(0, filters.limit) : records;
  const mapped = items.map(mapRecordToCard);
  const nextCursor = hasMore
    ? encodeCursor(filters.offset + filters.limit)
    : null;

  return {
    items: mapped,
    nextCursor,
  };
}

export async function renderWorksheetToPdf(
  worksheet: Worksheet,
): Promise<Uint8Array> {
  const styles = StyleSheet.create({
    page: {
      padding: 48,
      fontSize: 12,
      fontFamily: "Helvetica",
      lineHeight: 1.4,
    },
    title: {
      fontSize: 22,
      marginBottom: 12,
      fontWeight: 700,
    },
    section: {
      marginTop: 16,
    },
    heading: {
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 6,
    },
    paragraph: {
      marginBottom: 8,
    },
    metaLine: {
      marginBottom: 4,
    },
    listItem: {
      marginLeft: 12,
      marginBottom: 4,
    },
  });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{worksheet.title}</Text>
        {worksheet.overview ? (
          <Text style={styles.paragraph}>{worksheet.overview}</Text>
        ) : null}

        <View style={styles.section}>
          {renderMetaLine("Stage", worksheet.stage, styles)}
          {renderMetaLine(
            "Subjects",
            worksheet.subjects.join(", ") || null,
            styles,
          )}
          {renderMetaLine(
            "Skills",
            worksheet.skills.join(", ") || null,
            styles,
          )}
          {renderMetaLine(
            "Difficulty",
            worksheet.difficulty ?? null,
            styles,
          )}
          {renderMetaLine(
            "Format",
            worksheet.format === "pdf" ? "Printable PDF" : "Digital Interactive",
            styles,
          )}
          {renderMetaLine(
            "Tech Integrated",
            worksheet.tech_integrated ? "Yes" : "No",
            styles,
          )}
          {renderMetaLine(
            "Includes Answer Key",
            worksheet.hasAnswerKey ? "Yes" : "No",
            styles,
          )}
        </View>

        {worksheet.tags.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Tags</Text>
            <View>
              {worksheet.tags.map((tag, index) => (
                <Text key={tag ?? index} style={styles.listItem}>
                  • {tag}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {worksheet.skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Skill Focus</Text>
            <View>
              {worksheet.skills.map((skill, index) => (
                <Text key={skill ?? index} style={styles.listItem}>
                  • {skill}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {worksheet.subjects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Subjects</Text>
            <View>
              {worksheet.subjects.map((subject, index) => (
                <Text key={subject ?? index} style={styles.listItem}>
                  • {subject}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {worksheet.page_images.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Preview Pages</Text>
            <Text style={styles.paragraph}>
              This worksheet includes {worksheet.page_images.length} preview
              image{worksheet.page_images.length === 1 ? "" : "s"} in the
              online experience.
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  return buffer as Uint8Array;
}

function renderMetaLine(
  label: string,
  value: string | null,
  styles: ReturnType<typeof StyleSheet.create>,
) {
  if (!value) {
    return null;
  }

  return (
    <Text style={styles.metaLine}>
      <Text style={{ fontWeight: 600 }}>{label}: </Text>
      {value}
    </Text>
  );
}
