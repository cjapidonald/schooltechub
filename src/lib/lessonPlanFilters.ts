export interface LessonPlanFilterParams {
  q?: string;
  stage?: string[];
  subjects?: string[];
  delivery?: string[];
  tech?: string[];
}

type QueryStringParams = Record<string, string | string[] | undefined>;

const toArray = (value?: string | string[]): string[] | undefined => {
  if (!value) return undefined;
  const values = Array.isArray(value) ? value : value.split(",");
  const normalized = values.map((entry) => entry.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
};

export const normalizeLessonPlanFilters = (params: QueryStringParams): LessonPlanFilterParams => {
  const qValue = params.q;
  let q: string | undefined;
  if (Array.isArray(qValue)) {
    q = qValue.find(Boolean)?.trim();
  } else if (typeof qValue === "string") {
    q = qValue.trim();
  }

  return {
    q: q ? q : undefined,
    stage: toArray(params.stage as string | string[] | undefined),
    subjects: toArray(params.subjects as string | string[] | undefined),
    delivery: toArray(params.delivery as string | string[] | undefined),
    tech: toArray(params.tech as string | string[] | undefined)
  };
};

const buildSearchClause = (term: string): string => {
  const sanitized = term.replace(/[%]/g, "").trim();
  if (!sanitized) return "";
  const normalized = sanitized.replace(/[,]+/g, " ").replace(/\s+/g, " ").trim();
  const like = `%${normalized}%`;
  return [
    `title.ilike.${like}`,
    `summary.ilike.${like}`,
    `description.ilike.${like}`,
    `content.ilike.${like}`
  ].join(",");
};

type FilterableQuery = {
  or?: (clause: string) => FilterableQuery;
  in?: (column: string, values: string[]) => FilterableQuery;
  overlaps?: (column: string, values: string[]) => FilterableQuery;
  contains?: (column: string, values: string[]) => FilterableQuery;
};

const applyOverlapFilter = (
  query: FilterableQuery,
  column: string,
  values: string[]
): FilterableQuery => {
  if (typeof query.overlaps === "function") {
    return query.overlaps(column, values);
  }
  if (typeof query.contains === "function") {
    return query.contains(column, values);
  }
  return query;
};

export const applyLessonPlanFilters = <T extends FilterableQuery>(
  query: T,
  filters: LessonPlanFilterParams
): T => {
  let builder: FilterableQuery = query;

  if (filters.q) {
    const clause = buildSearchClause(filters.q);
    if (clause && typeof builder.or === "function") {
      builder = builder.or(clause);
    }
  }

  if (filters.stage?.length && typeof builder.in === "function") {
    builder = builder.in("stage", filters.stage);
  }

  if (filters.subjects?.length) {
    builder = applyOverlapFilter(builder, "subjects", filters.subjects);
  }

  if (filters.delivery?.length) {
    builder = applyOverlapFilter(builder, "delivery", filters.delivery);
  }

  if (filters.tech?.length) {
    builder = applyOverlapFilter(builder, "tech", filters.tech);
  }

  return builder as T;
};

export const buildLessonPlanSearchClause = buildSearchClause;
