import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BuilderLessonPlanDetail from "../BuilderLessonPlanDetail";
import { en } from "@/translations/en";

const builderApiMocks = vi.hoisted(() => ({
  fetchPlan: vi.fn(),
  fetchHistory: vi.fn(),
  autosave: vi.fn(),
}));

const resourcesMocks = vi.hoisted(() => ({
  search: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "plan-1" }),
  };
});

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: en, language: "en", setLanguage: () => {} }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock,
}));

vi.mock("@/lib/builder-api", () => ({
  fetchLessonBuilderPlan: builderApiMocks.fetchPlan,
  fetchLessonBuilderHistory: builderApiMocks.fetchHistory,
  autosaveLessonBuilderPlan: builderApiMocks.autosave,
}));

vi.mock("@/lib/resources", () => ({
  searchResources: resourcesMocks.search,
}));

describe("BuilderLessonPlanDetail", () => {
  const { fetchPlan, fetchHistory, autosave } = builderApiMocks;
  const { search: searchResources } = resourcesMocks;
  const basePlan = {
    id: "plan-1",
    slug: "plan-1",
    title: "Sample Plan",
    summary: null,
    status: "draft",
    stage: null,
    stages: [],
    subjects: [],
    deliveryMethods: [],
    technologyTags: [],
    durationMinutes: null,
    overview: null,
    steps: [
      {
        id: "step-1",
        title: "Launch",
        description: null,
        learningGoals: null,
        durationMinutes: null,
        duration: null,
        grouping: null,
        delivery: null,
        notes: null,
        activities: [],
        resources: [],
      },
    ],
    standards: [],
    availableStandards: [],
    resources: [],
    lastSavedAt: null,
    version: 1,
    parts: [{ id: "structure", label: "Structure", description: null, completed: false }],
    history: [],
    createdAt: null,
    updatedAt: null,
  } as const;

  const resource = {
    id: "resource-1",
    title: "Great Resource",
    description: "A helpful resource",
    url: "https://example.com/resource",
    storage_path: null,
    type: "Video",
    subject: "Science",
    stage: "Middle School",
    tags: ["engagement"],
    thumbnail_url: "https://example.com/thumbnail.jpg",
    created_by: "user-1",
    created_at: new Date().toISOString(),
    status: "approved" as const,
    approved_by: null,
    approved_at: null,
    is_active: true,
  };

  beforeEach(() => {
    fetchPlan.mockResolvedValue(JSON.parse(JSON.stringify(basePlan)));
    fetchHistory.mockResolvedValue([]);
    autosave.mockImplementation(async (_id: string, updatedPlan) => updatedPlan);
    searchResources.mockResolvedValue({ items: [resource], total: 1 });
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { school_logo_url: null } }),
        }),
      }),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it(
    "adds a searched resource to the current step and schedules autosave",
    async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={queryClient}>
          <BuilderLessonPlanDetail />
        </QueryClientProvider>
      );

      const searchButton = await screen.findByRole("button", { name: /search resources/i });
      fireEvent.click(searchButton);

      const searchInput = await screen.findByPlaceholderText(/search by keyword/i);
      fireEvent.change(searchInput, { target: { value: "video" } });
      fireEvent.keyDown(searchInput, { key: "Enter" });
      await new Promise((resolve) => setTimeout(resolve, 400));

      await waitFor(() => expect(searchResources).toHaveBeenCalled());
      const [filters] = searchResources.mock.calls.at(-1) ?? [];
      expect(filters?.q).toBe("video");

      const addButton = await screen.findByRole("button", { name: /add/i });
      fireEvent.click(addButton);

      await waitFor(() =>
        expect(screen.getByRole("link", { name: resource.title })).toBeInTheDocument()
      );

      const notesField = screen.getByLabelText(/instructional notes/i) as HTMLTextAreaElement;
      expect(notesField.value).toContain(resource.description);

      await waitFor(() => expect(autosave).toHaveBeenCalled(), { timeout: 6000 });

      queryClient.clear();
    },
    10000
  );
});
