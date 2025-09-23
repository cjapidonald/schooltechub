import { cleanup, render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  describe,
  expect,
  it,
  beforeEach,
  beforeAll,
  vi,
  afterEach,
  afterAll,
} from "vitest";
import { useEffect } from "react";

import LessonBuilder, { BuilderShell } from "@/features/builder/components/LessonBuilder";
import { BuilderProvider, useBuilder } from "@/features/builder/context/BuilderContext";
import { fetchLinkStatuses } from "@/features/builder/api/linkHealth";
import type { BuilderActivitySummary } from "@/features/builder/types";
import type { BuilderResourceLink, BuilderState } from "@/features/builder/types";
import type { LinkHealthStatus } from "@/features/builder/api/linkHealth";

const { sampleActivity } = vi.hoisted(() => {
  const activity: BuilderActivitySummary = {
    slug: "sample-activity",
    name: "Sample Activity",
    description: "Engaging task",
    subjects: ["Science"],
    schoolStages: ["Secondary"],
    activityTypes: ["Hands-on"],
    tags: ["Warm-Up"],
    duration: "20",
    delivery: "In-class",
    technology: ["Slides"],
  };
  return { sampleActivity: activity };
});

const { upsertMock, genericPromise } = vi.hoisted(() => {
  const upsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const promise = Promise.resolve({ data: [], error: null });
  return { upsertMock: upsert, genericPromise: promise };
});

const { ResizeObserver } = vi.hoisted(() => ({
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
}));
vi.stubGlobal("ResizeObserver", ResizeObserver);

const { matchMedia } = vi.hoisted(() => ({
  matchMedia: vi.fn(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
}));
vi.stubGlobal("matchMedia", matchMedia);

vi.mock("@/integrations/supabase/client", () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnValue(genericPromise),
    delete: vi.fn().mockReturnValue(genericPromise),
    upsert: upsertMock,
  };
  return {
    supabase: {
      from: vi.fn().mockReturnValue(chain),
    },
  };
});

vi.mock("@/features/builder/api/activityPreferences", () => ({
  defaultActivityFilters: {
    search: "",
    stage: [],
    subject: [],
    skills: [],
    duration: [],
    grouping: [],
    delivery: [],
    technology: [],
    tags: [],
  },
  fetchActivities: vi.fn().mockResolvedValue([sampleActivity]),
  fetchRecents: vi.fn().mockResolvedValue([]),
  fetchFavorites: vi.fn().mockResolvedValue([]),
  fetchCollections: vi.fn().mockResolvedValue([]),
  toggleFavorite: vi.fn().mockResolvedValue(true),
  trackRecentActivity: vi.fn().mockResolvedValue(undefined),
  createCollection: vi.fn().mockResolvedValue("collection-1"),
}));

vi.mock("@/features/builder/api/linkHealth", () => ({
  fetchLinkStatuses: vi.fn().mockResolvedValue({}),
  syncResourceLinks: vi.fn().mockResolvedValue(undefined),
}));

describe("LessonBuilder UI", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
    (HTMLElement.prototype as any).scrollTo = vi.fn();
    (HTMLElement.prototype as any).scrollBy = vi.fn();
  });

  beforeEach(() => {
    window.localStorage.setItem("builder-anon-user-id", "test-user");
    window.prompt = vi.fn().mockReturnValue("My Collection");
    upsertMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("opens command palette and adds a step", async () => {
    render(<LessonBuilder />);

    await screen.findAllByText("Sample Activity");

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const commandDialog = await screen.findByRole("dialog", { name: /lesson builder commands/i });
    expect(commandDialog).toBeInTheDocument();

    const addStepItem = await screen.findByTestId("command-add-step");
    const user = userEvent.setup();
    await user.click(addStepItem);

    await waitFor(() => {
      expect(screen.getAllByTestId(/step-card-/)).toHaveLength(2);
    });
  });

  it("debounces autosave requests", async () => {
    render(<LessonBuilder />);

    const titleInput = await screen.findByLabelText("Lesson title", { selector: "input" });

    vi.useFakeTimers();

    fireEvent.change(titleInput, { target: { value: "Solar System Explorers" } });

    await vi.advanceTimersByTimeAsync(900);

    expect(upsertMock).toHaveBeenCalledTimes(1);
    const payload = upsertMock.mock.calls[0][0];
    expect(payload.title).toContain("Solar System Explorers");

    vi.useRealTimers();
  });

  it("reorders steps via drag and drop", async () => {
    render(<LessonBuilder />);
    await screen.findByTestId("add-step");

    const addStepButton = screen.getByTestId("add-step");
    const user = userEvent.setup();
    await user.click(addStepButton);

    const titleFields = screen.getAllByLabelText("Title");
    await user.clear(titleFields[0]);
    await user.type(titleFields[0], "First Step");
    await user.clear(titleFields[1]);
    await user.type(titleFields[1], "Second Step");

    const dataTransfer = {
      data: new Map<string, string>(),
      setData(key: string, value: string) {
        this.data.set(key, value);
      },
      getData(key: string) {
        return this.data.get(key) ?? "";
      },
      clearData() {
        this.data.clear();
      },
      dropEffect: "move",
      effectAllowed: "all",
      files: [],
      items: [],
      types: [],
    };

    const [firstCard, secondCard] = screen.getAllByTestId(/step-card-/);
    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.drop(secondCard, { dataTransfer });

    const reorderedCards = screen.getAllByTestId(/step-card-/);
    expect(reorderedCards[0]).toHaveTextContent("Second Step");
  });

  it("exports teacher and student handouts with correct visibility", async () => {
    const exporters = await import("@/features/builder/utils/exporters");
    const downloadSpy = vi.spyOn(exporters, "downloadText").mockImplementation(() => undefined);

    render(<LessonBuilder />);
    await screen.findAllByText("Sample Activity");

    const exportTrigger = screen.getByTestId("export-menu-trigger");
    const user = userEvent.setup();
    await user.click(exportTrigger);
    const teacherOption = await screen.findByTestId("export-teacher");
    await user.click(teacherOption);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalled();
    });

    const teacherContent = downloadSpy.mock.calls[0][1] as string;
    expect(teacherContent).toContain("Offline fallback");

    const exportTriggerAgain = screen.getByTestId("export-menu-trigger");
    await user.click(exportTriggerAgain);
    const studentOption = await screen.findByTestId("export-student");
    await user.click(studentOption);

    const studentContent = downloadSpy.mock.calls[1][1] as string;
    expect(studentContent).not.toContain("Offline fallback");

    downloadSpy.mockRestore();
  });

  it("keeps the latest link lookup when resources update rapidly", async () => {
    const fetchLinkStatusesMock = vi.mocked(fetchLinkStatuses);
    const firstUrl = "https://example.com/resource-1";
    const secondUrl = "https://example.com/resource-2";

    let resolveFirst: (() => void) | undefined;
    const staleLookup: Record<string, LinkHealthStatus> = {
      [firstUrl]: {
        url: firstUrl,
        isHealthy: false,
        statusCode: 500,
        statusText: "Stale failure",
        lastChecked: null,
        lastError: "Server error",
      },
    };
    const latestLookup: Record<string, LinkHealthStatus> = {
      [firstUrl]: {
        url: firstUrl,
        isHealthy: true,
        statusCode: 200,
        statusText: "Recovered",
        lastChecked: null,
        lastError: null,
      },
      [secondUrl]: {
        url: secondUrl,
        isHealthy: false,
        statusCode: 500,
        statusText: "Latest failure",
        lastChecked: null,
        lastError: "Server error",
      },
    };

    fetchLinkStatusesMock
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = () => resolve(staleLookup);
          }),
      )
      .mockImplementationOnce(() => Promise.resolve(latestLookup));

    const firstResource: BuilderResourceLink = {
      id: "res-1",
      resourceId: "res-1",
      title: "Resource 1",
      url: firstUrl,
      description: null,
      tags: [],
      resourceType: null,
      subject: null,
      gradeLevel: null,
      format: null,
      instructionalNotes: null,
      creatorId: null,
      creatorName: null,
    };
    const secondResource: BuilderResourceLink = {
      id: "res-2",
      resourceId: "res-2",
      title: "Resource 2",
      url: secondUrl,
      description: null,
      tags: [],
      resourceType: null,
      subject: null,
      gradeLevel: null,
      format: null,
      instructionalNotes: null,
      creatorId: null,
      creatorName: null,
    };

    let updateState: ((updater: (prev: BuilderState) => BuilderState) => void) | undefined;
    const StateDriver = ({
      onReady,
    }: {
      onReady: (setter: (updater: (prev: BuilderState) => BuilderState) => void) => void;
    }) => {
      const { setState } = useBuilder();
      useEffect(() => {
        onReady(setState);
      }, [onReady, setState]);
      return null;
    };

    render(
      <BuilderProvider>
        <BuilderShell />
        <StateDriver
          onReady={setter => {
            updateState = setter;
          }}
        />
      </BuilderProvider>,
    );

    await waitFor(() => {
      expect(typeof updateState).toBe("function");
    });

    act(() => {
      updateState?.(prev => ({
        ...prev,
        steps: prev.steps.map((step, index) =>
          index === 0
            ? {
                ...step,
                resources: [firstResource],
              }
            : step,
        ),
      }));
    });

    act(() => {
      updateState?.(prev => ({
        ...prev,
        steps: prev.steps.map((step, index) =>
          index === 0
            ? {
                ...step,
                resources: [firstResource, secondResource],
              }
            : step,
        ),
      }));
    });

    await waitFor(() => {
      expect(fetchLinkStatusesMock).toHaveBeenCalledTimes(2);
    });

    const firstCard = await screen.findByTestId("resource-card-res-1");
    const secondCard = await screen.findByTestId("resource-card-res-2");

    await waitFor(() => {
      expect(within(secondCard).queryByText("Check link")).toBeTruthy();
    });
    expect(within(firstCard).queryByText("Check link")).toBeNull();

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => {
      expect(within(secondCard).queryByText("Check link")).toBeTruthy();
    });
    expect(within(firstCard).queryByText("Check link")).toBeNull();
  });
});
