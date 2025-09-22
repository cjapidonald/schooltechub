import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Resource } from "@/types/resources";
import { searchResources } from "@/lib/resources";

const baseResources: Resource[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Math Morning Worksheet",
    description: "Daily numeracy warm-up worksheet for early learners.",
    url: "storage://resources/math-morning-worksheet.pdf",
    type: "worksheet",
    subject: "Math",
    stage: "Stage 1",
    tags: ["numeracy", "morning-routine"],
    thumbnail_url: "https://cdn.example.com/thumbnails/math-morning.png",
    created_by: null,
    created_at: "2024-01-01T00:00:00.000Z",
    is_active: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Phonics Song Video",
    description: "Animated video introducing consonant blends.",
    url: "https://videos.example.com/phonics-song",
    type: "video",
    subject: "Phonics",
    stage: "Stage 2",
    tags: ["phonics", "listening", "music"],
    thumbnail_url: "https://cdn.example.com/thumbnails/phonics-song.png",
    created_by: null,
    created_at: "2024-01-02T00:00:00.000Z",
    is_active: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Science Lab Picture Cards",
    description: "Printable picture cards for lab safety equipment.",
    url: "storage://resources/science-lab-cards.zip",
    type: "picture",
    subject: "Science",
    stage: "Stage 3",
    tags: ["lab", "safety", "visual"],
    thumbnail_url: "https://cdn.example.com/thumbnails/science-lab.png",
    created_by: null,
    created_at: "2024-01-03T00:00:00.000Z",
    is_active: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    title: "History Presentation Deck",
    description: "Slides covering early explorers with discussion prompts.",
    url: "https://cdn.example.com/presentations/history-explorers.pptx",
    type: "ppt",
    subject: "Social Studies",
    stage: "Stage 4",
    tags: ["exploration", "discussion", "project"],
    thumbnail_url: "https://cdn.example.com/thumbnails/history-explorers.png",
    created_by: null,
    created_at: "2024-01-04T00:00:00.000Z",
    is_active: true,
  },
];

type QueryFilters = {
  types: string[] | null;
  subjects: string[] | null;
  stages: string[] | null;
  tags: string[] | null;
  searchTerm: string | null;
  range: { from: number; to: number };
  onlyActive: boolean;
};

function applyFilters(filters: QueryFilters, data: Resource[]): Resource[] {
  const { types, subjects, stages, tags, searchTerm } = filters;
  const search = searchTerm?.toLowerCase() ?? null;

  return data.filter(resource => {
    if (filters.onlyActive && !resource.is_active) return false;
    if (types && !types.includes(resource.type)) return false;
    if (subjects && (!resource.subject || !subjects.includes(resource.subject))) return false;
    if (stages && (!resource.stage || !stages.includes(resource.stage))) return false;
    if (tags && !tags.some(tag => resource.tags.includes(tag))) return false;

    if (search) {
      const inTitle = resource.title.toLowerCase().includes(search);
      const inDescription = (resource.description ?? "").toLowerCase().includes(search);
      const inTags = resource.tags.some(tag => tag.toLowerCase().includes(search));
      if (!inTitle && !inDescription && !inTags) {
        return false;
      }
    }

    return true;
  });
}

type BuilderState = QueryFilters & {
  includeCount: boolean;
};

function decodeIlikeTerm(expression: string): string | null {
  const descriptionMatch = expression.match(/description\.ilike\.%([^%]+)%/);
  if (descriptionMatch) {
    return descriptionMatch[1].replace(/\\\\/g, "");
  }

  const titleMatch = expression.match(/title\.ilike\.%([^%]+)%/);
  if (titleMatch) {
    return titleMatch[1].replace(/\\\\/g, "");
  }

  return null;
}

vi.mock("@/integrations/supabase/client", () => {
  let dataset: Resource[] = [];

  function createBuilder() {
    const state: BuilderState = {
      types: null,
      subjects: null,
      stages: null,
      tags: null,
      searchTerm: null,
      range: { from: 0, to: dataset.length - 1 },
      onlyActive: false,
      includeCount: false,
    };

    const builder = {
      select(_columns: string, options?: { count?: "exact" | null }) {
        state.includeCount = options?.count === "exact";
        return builder;
      },
      order() {
        return builder;
      },
      range(from: number, to: number) {
        state.range = { from, to };
        return builder;
      },
      eq(column: string, value: unknown) {
        if (column === "is_active") {
          state.onlyActive = Boolean(value);
        }
        return builder;
      },
      in(column: string, values: string[]) {
        if (column === "type") state.types = values;
        if (column === "subject") state.subjects = values;
        if (column === "stage") state.stages = values;
        return builder;
      },
      overlaps(column: string, values: string[]) {
        if (column === "tags") state.tags = values;
        return builder;
      },
      or(expression: string) {
        const parts = expression.split(",");
        for (const part of parts) {
          const term = decodeIlikeTerm(part);
          if (term) {
            state.searchTerm = term;
            break;
          }
        }
        return builder;
      },
      async execute() {
        const filtered = applyFilters(state, dataset);
        const items = filtered.slice(state.range.from, state.range.to + 1);

        return {
          data: items,
          error: null,
          count: state.includeCount ? filtered.length : null,
        };
      },
      then<TResult1 = unknown, TResult2 = unknown>(
        onFulfilled?: ((value: Awaited<ReturnType<typeof builder.execute>>) => TResult1 | PromiseLike<TResult1>) | null,
        onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return builder.execute().then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  return {
    supabase: {
      from(table: string) {
        if (table !== "resources") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return createBuilder();
      },
      auth: {
        async getSession() {
          return { data: { session: { user: { id: "user-123" } } }, error: null };
        },
      },
      __setData(newData: Resource[]) {
        dataset = newData;
      },
    },
  };
});

interface SupabaseClientMock {
  __setData: (data: Resource[]) => void;
  from: (table: string) => unknown;
  auth: {
    getSession: () => Promise<{ data: { session: { user: { id: string } } }; error: null }>;
  };
}

const { supabase } = (await import("@/integrations/supabase/client")) as { supabase: SupabaseClientMock };

describe("resources data access", () => {
  beforeEach(() => {
    const copy = JSON.parse(JSON.stringify(baseResources)) as Resource[];
    supabase.__setData(copy);
  });

  it("retrieves paginated resources", async () => {
    const result = await searchResources({ pageSize: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(baseResources.length);
  });

  it("filters by search term across title, description, and tags", async () => {
    const result = await searchResources({ q: "science" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("33333333-3333-4333-8333-333333333333");
  });

  it("filters by resource type", async () => {
    const result = await searchResources({ types: ["video"] });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe("video");
  });

  it("filters by overlapping tags", async () => {
    const result = await searchResources({ tags: ["discussion"] });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe("History Presentation Deck");
  });
});
