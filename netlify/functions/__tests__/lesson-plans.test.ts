import { describe, expect, it, vi } from "vitest";
import { createLessonPlanHandler } from "../lesson-plans";

interface LessonPlan {
  id: string;
  title: string;
  summary: string;
  description: string;
  stage: string;
  subjects: string[];
  delivery: string[];
  tech: string[];
  is_published: boolean;
  published_at: string;
}

type QueryState = {
  filters: {
    q?: string;
    stage?: string[];
    subjects?: string[];
    delivery?: string[];
    tech?: string[];
    is_published?: boolean;
  };
  range: { from: number; to: number };
};

const createQueryBuilder = (data: LessonPlan[]) => {
  const state: QueryState = {
    filters: {},
    range: { from: 0, to: data.length - 1 }
  };

  const builder: any = {
    select() {
      return builder;
    },
    eq(column: string, value: unknown) {
      if (column === "is_published") {
        state.filters.is_published = value as boolean;
      }
      return builder;
    },
    or(clause: string) {
      state.filters.q = clause;
      return builder;
    },
    in(column: string, values: string[]) {
      if (column === "stage") {
        state.filters.stage = values;
      }
      return builder;
    },
    overlaps(column: string, values: string[]) {
      state.filters[column as keyof QueryState["filters"]] = values;
      return builder;
    },
    contains(column: string, values: string[]) {
      state.filters[column as keyof QueryState["filters"]] = values;
      return builder;
    },
    order() {
      return builder;
    },
    range(from: number, to: number) {
      state.range = { from, to };
      return builder;
    },
    then(onFulfilled?: (value: any) => any) {
      const applyFilters = (item: LessonPlan) => {
        if (state.filters.is_published === true && item.is_published !== true) {
          return false;
        }

        if (state.filters.stage && !state.filters.stage.includes(item.stage)) {
          return false;
        }

        const intersects = (field: keyof LessonPlan, values?: string[]) => {
          if (!values) return true;
          const target = item[field] as string[];
          return target.some((value) => values.includes(value));
        };

        if (!intersects("subjects", state.filters.subjects)) return false;
        if (!intersects("delivery", state.filters.delivery)) return false;
        if (!intersects("tech", state.filters.tech)) return false;

        if (state.filters.q) {
          const match = state.filters.q.match(/%([^%]+)%/);
          const term = match ? match[1].toLowerCase() : "";
          const haystacks = [item.title, item.summary, item.description].map((entry) =>
            entry.toLowerCase()
          );
          if (!haystacks.some((entry) => entry.includes(term))) {
            return false;
          }
        }

        return true;
      };

      const filtered = data.filter(applyFilters);
      const slice = filtered.slice(state.range.from, state.range.to + 1);
      const payload = {
        data: slice,
        count: filtered.length,
        error: null
      };

      return Promise.resolve(onFulfilled ? onFulfilled(payload) : payload);
    }
  };

  return builder;
};

const createSupabaseMock = (data: LessonPlan[]) => ({
  from: vi.fn(() => createQueryBuilder(data))
});

const sampleData: LessonPlan[] = [
  {
    id: "1",
    title: "Robotics for Primary",
    summary: "Robotics lesson",
    description: "Teach robotics basics",
    stage: "Primary",
    subjects: ["Math", "Science"],
    delivery: ["In-class", "Hybrid"],
    tech: ["Robotics", "AR"],
    is_published: true,
    published_at: "2024-01-01"
  },
  {
    id: "2",
    title: "Robotics for Secondary",
    summary: "Robotics advanced",
    description: "Robotics lab",
    stage: "Secondary",
    subjects: ["Science"],
    delivery: ["Online"],
    tech: ["VR"],
    is_published: false,
    published_at: "2024-01-02"
  },
  {
    id: "3",
    title: "Art with Tablets",
    summary: "Digital art",
    description: "Painting with tablets",
    stage: "Primary",
    subjects: ["Art"],
    delivery: ["In-class"],
    tech: ["Tablets"],
    is_published: true,
    published_at: "2024-01-03"
  }
];

describe("lesson-plans handler", () => {
  it("filters by search term, stage, and arrays", async () => {
    const supabase = createSupabaseMock(sampleData);
    const handler = createLessonPlanHandler({ supabase });

    const response = await handler({
      queryStringParameters: {
        q: "robotics",
        stage: "Primary",
        subjects: "Science",
        delivery: "Hybrid",
        tech: "AR"
      }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].id).toBe("1");
    expect(payload.total).toBe(1);
  });

  it("paginates results using range", async () => {
    const supabase = createSupabaseMock(sampleData);
    const handler = createLessonPlanHandler({ supabase, defaultLimit: 1 });

    const response = await handler({
      queryStringParameters: {
        page: "2",
        limit: "1"
      }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data).toHaveLength(1);
    expect(payload.page).toBe(2);
    expect(payload.limit).toBe(1);
    expect(payload.total).toBe(2);
  });

  it("enforces published-only flag", async () => {
    const supabase = createSupabaseMock(sampleData);
    const handler = createLessonPlanHandler({ supabase });

    const response = await handler({
      queryStringParameters: {
        stage: "Secondary"
      }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data).toHaveLength(0);
    expect(payload.total).toBe(0);
  });
});
