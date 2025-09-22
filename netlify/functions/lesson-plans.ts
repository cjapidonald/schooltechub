import { createClient } from "@supabase/supabase-js";
import { applyLessonPlanFilters, normalizeLessonPlanFilters } from "../../src/lib/lessonPlanFilters";

type QueryString = Record<string, string | undefined>;

interface HandlerEvent {
  queryStringParameters?: QueryString;
}

interface HandlerResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

type SupabaseLike = {
  from: (table: string) => PostgrestQueryLike;
};

type PostgrestQueryLike = {
  select: (columns: string, options?: Record<string, unknown>) => PostgrestQueryLike;
  eq: (column: string, value: unknown) => PostgrestQueryLike;
  or?: (clause: string) => PostgrestQueryLike;
  in?: (column: string, values: string[]) => PostgrestQueryLike;
  overlaps?: (column: string, values: string[]) => PostgrestQueryLike;
  contains?: (column: string, values: string[]) => PostgrestQueryLike;
  order?: (column: string, options?: { ascending?: boolean }) => PostgrestQueryLike;
  range?: (from: number, to: number) => PostgrestQueryLike;
  then: <TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ) => Promise<TResult1 | TResult2>;
};

interface CreateLessonPlanHandlerDeps {
  supabase: SupabaseLike;
  defaultLimit?: number;
}

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const createLessonPlanHandler = ({
  supabase,
  defaultLimit = DEFAULT_LIMIT
}: CreateLessonPlanHandlerDeps) => {
  return async (event: HandlerEvent): Promise<HandlerResponse> => {
    const params = event.queryStringParameters ?? {};
    const filters = normalizeLessonPlanFilters(params);
    const page = Math.max(parsePositiveInt(params.page, 1), 1);
    const limit = Math.min(parsePositiveInt(params.limit, defaultLimit), MAX_LIMIT);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let query = supabase
        .from("lesson_plans")
        .select("*", { count: "exact" })
        .eq("is_published", true);

      query = applyLessonPlanFilters(query, filters);

      if (typeof query.order === "function") {
        query = query.order("published_at", { ascending: false });
      }

      if (typeof query.range === "function") {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to load lesson plans" }),
          headers: { "Content-Type": "application/json" }
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: data ?? [],
          total: typeof count === "number" ? count : data?.length ?? 0,
          page,
          limit
        }),
        headers: { "Content-Type": "application/json" }
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

const createServiceRoleClient = (): SupabaseLike => {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase service role credentials are not configured");
  }

  return createClient(url, serviceKey);
};

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const supabase = createServiceRoleClient();
  const handlerImpl = createLessonPlanHandler({ supabase });
  return handlerImpl(event);
};
