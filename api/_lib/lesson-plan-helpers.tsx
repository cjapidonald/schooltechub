import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LessonPlanContentBlock,
  LessonPlanContentSection,
  LessonPlanDetail,
  LessonPlanListItem,
  LessonPlanListResponse,
  LessonPlanOverview,
  LessonPlanRecord,
  LessonPlanResource,
  LessonPlanStatus,
} from "../../types/lesson-plans";

const BASE_URL = "http://localhost";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const BASE_SELECT = "*";
const FULL_TEXT_COLUMN = "search_vector";

export interface LessonPlanListFilters {
  q: string | null;
  stage: string[];
  subjects: string[];
  delivery: string[];
  tech: string[];
  limit: number;
  offset: number;
}

export interface LessonPlanQueryOptions {
  useFullTextSearch?: boolean;
}

export function parseRequestUrl(request: Request): URL {
  try {
    return new URL(request.url);
  } catch {
    return new URL(request.url, BASE_URL);
  }
}

export function parseListFilters(url: URL): LessonPlanListFilters {
  const params = url.searchParams;
  const limit = clampLimit(parseInteger(params.get("limit")) ?? DEFAULT_LIMIT);
  const cursorValue = params.get("cursor");
  const page = parsePositiveInteger(params.get("page")) ?? null;
  const offsetFromCursor = decodeCursor(cursorValue);
  const offset =
    offsetFromCursor ?? (page && page > 0 ? (page - 1) * limit : 0);

  return {
    q: sanitizeSearchTerm(params.get("q")),
    stage: parseListParam(params, "stage"),
    subjects: parseListParam(params, "subjects"),
    delivery: parseListParam(params, "delivery"),
    tech: parseListParam(params, "tech"),
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
        .filter(Boolean)
    )
    .map((value) => value.toLowerCase());

  return Array.from(new Set(parsed));
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
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as { offset?: number };
    if (typeof decoded.offset === "number" && decoded.offset >= 0) {
      return Math.trunc(decoded.offset);
    }
    return null;
  } catch {
    return null;
  }
}

export function buildLessonPlanQuery(
  client: SupabaseClient,
  filters: LessonPlanListFilters,
  options: LessonPlanQueryOptions = {}
): PostgrestFilterBuilder<LessonPlanRecord> {
  const { useFullTextSearch = true } = options;

  let query = client
    .from<LessonPlanRecord>("lesson_plans")
    .select(BASE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (filters.stage.length > 0) {
    if (filters.stage.length === 1) {
      query = query.ilike("stage", filters.stage[0]);
    } else {
      query = query.in("stage", filters.stage);
    }
  }

  if (filters.subjects.length > 0) {
    query = query.overlaps("subjects", filters.subjects);
  }

  if (filters.delivery.length > 0) {
    query = query.overlaps("delivery_methods", filters.delivery);
  }

  if (filters.tech.length > 0) {
    query = query.overlaps("technology_tags", filters.tech);
  }

  if (filters.q) {
    if (useFullTextSearch) {
      query = query.textSearch(
        FULL_TEXT_COLUMN,
        filters.q,
        {
          type: "websearch",
          config: "english",
        }
      );
    } else {
      const escaped = escapeLike(filters.q);
      const pattern = `%${escaped}%`;
      query = query.or(
        [
          `title.ilike.${pattern}`,
          `summary.ilike.${pattern}`,
          `excerpt.ilike.${pattern}`,
        ].join(",")
      );
    }
  }

  const end = filters.offset + filters.limit;
  query = query.range(filters.offset, end);

  return query;
}

export function mapRecordToListItem(record: LessonPlanRecord): LessonPlanListItem {
  const stages = uniqStrings([
    ...(ensureStringArray(record.stages)),
    ...(ensureStringArray(record.stage_levels)),
    ...ensureStringArray(record.stage ? [record.stage] : []),
  ]);
  const subjects = uniqStrings([
    ...ensureStringArray(record.subjects),
    ...ensureStringArray(record.subject ? [record.subject] : []),
  ]);
  const delivery = uniqStrings([
    ...ensureStringArray(record.delivery_methods),
    ...ensureStringArray(record.delivery),
    ...ensureStringArray(record.delivery_modes),
    ...ensureStringArray(record.delivery_format),
  ]);
  const tech = uniqStrings([
    ...ensureStringArray(record.technology_tags),
    ...ensureStringArray(record.technology),
    ...ensureStringArray(record.tech),
    ...ensureStringArray(record.tools),
  ]);

  const summary =
    nullableString(record.summary) ??
    nullableString(record.excerpt) ??
    nullableString(record.description) ??
    extractOverviewSummary(record);

  const duration =
    firstNumber([
      record.duration_minutes,
      record.duration,
      record.time_required,
      extractOverviewDuration(record),
    ]);

  const pdfUrl =
    nullableString(record.pdf_url) ?? nullableString(record.pdf) ?? null;

  const schoolLogoUrl = nullableString(record.school_logo_url);
  const lessonDate = nullableString(record.lesson_date);

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary,
    stage: stages[0] ?? null,
    stages,
    subjects,
    deliveryMethods: delivery,
    technologyTags: tech,
    durationMinutes: duration,
    pdfUrl,
    schoolLogoUrl,
    lessonDate,
    status: record.status ?? ("draft" as LessonPlanStatus),
    createdAt: nullableString(record.created_at),
    updatedAt: nullableString(record.updated_at),
  };
}

export function mapRecordToDetail(record: LessonPlanRecord): LessonPlanDetail {
  const base = mapRecordToListItem(record);
  const overview = extractOverview(record, base);
  const resources = extractResources(record);
  const content = normalizeContent(record.content ?? record.body ?? null);

  return {
    ...base,
    content,
    overview,
    resources,
  };
}

export function buildListResponse(
  records: LessonPlanRecord[],
  filters: LessonPlanListFilters
): LessonPlanListResponse {
  const hasMore = records.length > filters.limit;
  const items = hasMore ? records.slice(0, filters.limit) : records;
  const mapped = items.map(mapRecordToListItem);
  const nextCursor = hasMore
    ? encodeCursor(filters.offset + filters.limit)
    : null;

  return {
    items: mapped,
    nextCursor,
  };
}

export async function renderLessonPlanToPdf(
  lesson: LessonPlanDetail
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
      marginBottom: 16,
      fontWeight: 700,
    },
    summary: {
      marginBottom: 16,
    },
    metaGroup: {
      marginBottom: 12,
    },
    metaLabel: {
      fontWeight: 600,
    },
    section: {
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 16,
      marginBottom: 8,
      fontWeight: 600,
    },
    paragraph: {
      marginBottom: 8,
    },
    listItem: {
      marginLeft: 12,
      marginBottom: 4,
    },
  });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{lesson.title}</Text>
        {lesson.summary ? (
          <Text style={styles.summary}>{lesson.summary}</Text>
        ) : null}
        <View style={styles.metaGroup}>
          {renderMetaLine("Stage", lesson.stage, styles)}
          {renderMetaLine(
            "Subjects",
            lesson.subjects.join(", ") || null,
            styles
          )}
          {renderMetaLine(
            "Delivery",
            lesson.deliveryMethods.join(", ") || null,
            styles
          )}
          {renderMetaLine(
            "Technology",
            lesson.technologyTags.join(", ") || null,
            styles
          )}
          {renderMetaLine(
            "Duration",
            lesson.durationMinutes != null
              ? `${lesson.durationMinutes} minutes`
              : null,
            styles
          )}
        </View>
        {lesson.content.length === 0 ? (
          <Text style={styles.paragraph}>Lesson content coming soon.</Text>
        ) : (
          lesson.content.map((section, index) => (
            <View key={section.id ?? index} style={styles.section}>
              {section.title ? (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              ) : null}
              {section.description ? (
                <Text style={styles.paragraph}>{section.description}</Text>
              ) : null}
              {section.blocks.map((block, blockIndex) =>
                renderBlock(block, blockIndex, styles)
              )}
            </View>
          ))
        )}
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  return buffer as Uint8Array;
}

function renderMetaLine(
  label: string,
  value: string | null,
  styles: ReturnType<typeof StyleSheet.create>
): JSX.Element | null {
  if (!value) {
    return null;
  }
  return (
    <Text style={styles.paragraph}>
      <Text style={styles.metaLabel}>{`${label}: `}</Text>
      {value}
    </Text>
  );
}

function renderBlock(
  block: LessonPlanContentBlock,
  index: number,
  styles: ReturnType<typeof StyleSheet.create>
): JSX.Element {
  switch (block.type) {
    case "paragraph":
      return (
        <Text key={index} style={styles.paragraph}>
          {block.text}
        </Text>
      );
    case "heading":
      return (
        <Text key={index} style={styles.sectionTitle}>
          {block.text}
        </Text>
      );
    case "list":
      return (
        <View key={index} style={styles.paragraph}>
          {block.items.map((item, itemIndex) => (
            <Text key={itemIndex} style={styles.listItem}>
              {block.ordered ? `${itemIndex + 1}. ` : "• "}
              {item}
            </Text>
          ))}
        </View>
      );
    case "quote":
      return (
        <View key={index} style={styles.paragraph}>
          <Text>“{block.text}”</Text>
          {block.attribution ? <Text>- {block.attribution}</Text> : null}
        </View>
      );
    default:
      return (
        <Text key={index} style={styles.paragraph}>
          {JSON.stringify(block)}
        </Text>
      );
  }
}

function ensureStringArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => ensureStringArray(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (typeof value === "number") {
    return [String(value)];
  }
  if (typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    const maybeValue = candidate.value ?? candidate.label ?? candidate.name;
    if (
      typeof maybeValue === "string" ||
      typeof maybeValue === "number"
    ) {
      return ensureStringArray(maybeValue);
    }
  }
  return [];
}

function uniqStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function nullableString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function firstNumber(values: Array<number | null | undefined>): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function extractOverviewSummary(record: LessonPlanRecord): string | null {
  const overview = record.overview ?? record.metadata;
  if (typeof overview === "string") {
    return overview;
  }
  if (typeof overview === "object" && overview) {
    const summary = (overview as Record<string, unknown>).summary;
    return nullableString(summary);
  }
  return null;
}

function extractOverviewDuration(record: LessonPlanRecord): number | null {
  const overview = record.overview ?? record.metadata;
  if (typeof overview === "object" && overview) {
    const duration = (overview as Record<string, unknown>).durationMinutes ??
      (overview as Record<string, unknown>).duration_minutes ??
      (overview as Record<string, unknown>).duration;
    if (typeof duration === "number" && Number.isFinite(duration)) {
      return duration;
    }
  }
  return null;
}

function extractOverview(
  record: LessonPlanRecord,
  base: LessonPlanListItem
): LessonPlanOverview | null {
  const overview = record.overview ?? record.metadata;
  if (!overview || typeof overview !== "object") {
    if (
      base.summary ||
      base.stage ||
      base.subjects.length > 0 ||
      base.deliveryMethods.length > 0 ||
      base.technologyTags.length > 0 ||
      base.durationMinutes != null
    ) {
      return {
        summary: base.summary,
        essentialQuestion: null,
        objectives: [],
        materials: [],
        assessment: [],
        technology: base.technologyTags,
        delivery: base.deliveryMethods,
        stage: base.stage,
        subjects: base.subjects,
        durationMinutes: base.durationMinutes,
      };
    }
    return null;
  }

  const overviewRecord = overview as Record<string, unknown>;
  const summary =
    nullableString(overviewRecord.summary) ?? base.summary ?? null;
  const essentialQuestion =
    nullableString(overviewRecord.essentialQuestion) ??
    nullableString(overviewRecord.essential_question);

  const objectives = uniqStrings(
    ensureStringArray(overviewRecord.objectives ?? overviewRecord.learningObjectives)
  );
  const materials = uniqStrings(
    ensureStringArray(overviewRecord.materials ?? overviewRecord.materialsNeeded)
  );
  const assessment = uniqStrings(
    ensureStringArray(overviewRecord.assessment ?? overviewRecord.assessments)
  );
  const technology = uniqStrings(
    ensureStringArray(overviewRecord.technology ?? overviewRecord.technologyTools)
  );
  const delivery = uniqStrings(
    ensureStringArray(overviewRecord.delivery ?? overviewRecord.deliveryMode)
  );
  const subjects = uniqStrings(
    ensureStringArray(overviewRecord.subjects ?? base.subjects)
  );
  const stage =
    nullableString(overviewRecord.stage) ?? base.stage ?? null;
  const durationMinutes =
    firstNumber([
      overviewRecord.durationMinutes as number | undefined,
      overviewRecord.duration_minutes as number | undefined,
      overviewRecord.duration as number | undefined,
      base.durationMinutes ?? undefined,
    ]);

  return {
    summary,
    essentialQuestion: essentialQuestion ?? null,
    objectives,
    materials,
    assessment,
    technology: technology.length ? technology : base.technologyTags,
    delivery: delivery.length ? delivery : base.deliveryMethods,
    stage,
    subjects,
    durationMinutes,
  };
}

function extractResources(record: LessonPlanRecord): LessonPlanResource[] {
  const raw = record.resources ?? record.attachments;
  if (!raw) {
    return [];
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeResource(item))
    .filter((resource): resource is LessonPlanResource => resource !== null);
}

function normalizeResource(input: unknown): LessonPlanResource | null {
  if (!input || typeof input !== "object") {
    return null;
  }
  const record = input as Record<string, unknown>;
  const title =
    nullableString(record.title) ??
    nullableString(record.name) ??
    nullableString(record.label);
  const url =
    nullableString(record.url) ??
    nullableString(record.link) ??
    nullableString(record.href) ??
    null;
  const type =
    nullableString(record.type) ??
    nullableString(record.format) ??
    nullableString(record.kind) ??
    null;
  const description = nullableString(record.description) ?? null;

  if (!title && !url) {
    return null;
  }

  return {
    title: title ?? "Resource",
    url,
    type,
    description,
  };
}

function normalizeContent(raw: unknown): LessonPlanContentSection[] {
  if (!raw) {
    return [];
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return normalizeContent(parsed);
    } catch {
      return [
        {
          title: null,
          description: null,
          blocks: [
            {
              type: "paragraph",
              text: raw,
            },
          ],
        },
      ];
    }
  }
  if (Array.isArray(raw)) {
    return raw
      .map((section, index) => normalizeSection(section, index))
      .filter((section): section is LessonPlanContentSection => section !== null);
  }
  if (typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.sections)) {
      return normalizeContent(record.sections);
    }
    if (Array.isArray(record.blocks)) {
      return [
        {
          title: nullableString(record.title),
          description: nullableString(record.description),
          blocks: normalizeBlocks(record.blocks),
        },
      ];
    }
  }
  return [];
}

function normalizeSection(
  input: unknown,
  index: number
): LessonPlanContentSection | null {
  if (!input) {
    return null;
  }
  if (typeof input === "string") {
    return {
      title: null,
      description: null,
      blocks: [
        {
          type: "paragraph",
          text: input,
        },
      ],
    };
  }
  if (typeof input !== "object") {
    return null;
  }
  const record = input as Record<string, unknown>;
  const title = nullableString(record.title) ?? nullableString(record.name);
  const description = nullableString(record.description) ?? null;
  const blocks = normalizeBlocks(record.blocks ?? record.items ?? record.content);

  return {
    id: nullableString(record.id) ?? undefined,
    title: title ?? null,
    description,
    blocks,
  };
}

function normalizeBlocks(input: unknown): LessonPlanContentBlock[] {
  if (!input) {
    return [];
  }
  if (typeof input === "string") {
    return [
      {
        type: "paragraph",
        text: input,
      },
    ];
  }
  if (!Array.isArray(input)) {
    if (typeof input === "object") {
      return normalizeBlocks([input]);
    }
    return [];
  }

  return input
    .map((block) => normalizeBlock(block))
    .filter((block): block is LessonPlanContentBlock => block !== null);
}

function normalizeBlock(input: unknown): LessonPlanContentBlock | null {
  if (!input) {
    return null;
  }
  if (typeof input === "string") {
    return {
      type: "paragraph",
      text: input,
    };
  }
  if (typeof input !== "object") {
    return null;
  }
  const record = input as Record<string, unknown>;
  const type = nullableString(record.type) ?? "paragraph";
  if (type === "paragraph") {
    const text =
      nullableString(record.text) ??
      nullableString(record.content) ??
      nullableString(record.value) ??
      null;
    if (!text && Array.isArray(record.children)) {
      const combined = record.children
        .map((child) =>
          typeof child === "string"
            ? child
            : nullableString((child as Record<string, unknown>).text) ?? ""
        )
        .join(" ")
        .trim();
      if (combined.length > 0) {
        return {
          type: "paragraph",
          text: combined,
        };
      }
    }
    return {
      type: "paragraph",
      text: text ?? "",
    };
  }
  if (type === "heading") {
    return {
      type: "heading",
      text:
        nullableString(record.text) ??
        nullableString(record.content) ??
        nullableString(record.value) ??
        "",
      level:
        typeof record.level === "number" && Number.isFinite(record.level)
          ? record.level
          : undefined,
    };
  }
  if (type === "list" || type === "bulleted-list" || type === "numbered-list") {
    const items = ensureStringArray(record.items ?? record.children ?? []);
    return {
      type: "list",
      items,
      ordered: type === "numbered-list" || record.ordered === true,
    };
  }
  if (type === "quote") {
    return {
      type: "quote",
      text: nullableString(record.text) ?? "",
      attribution: nullableString(record.attribution) ?? null,
    };
  }
  return {
    type,
    ...record,
  } as LessonPlanContentBlock;
}
