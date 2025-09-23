import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ActivitySearchPanel } from "../ActivitySearchPanel";
import type { BuilderActivitySummary } from "../../types";

const { sampleActivity, anotherActivity } = vi.hoisted(() => {
  const baseActivity: BuilderActivitySummary = {
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

  const secondActivity: BuilderActivitySummary = {
    ...baseActivity,
    slug: "another-activity",
    name: "Another Activity",
  };

  return {
    sampleActivity: baseActivity,
    anotherActivity: secondActivity,
  };
});

const mocks = vi.hoisted(() => {
  return {
    fetchActivities: vi.fn(),
    fetchFavorites: vi.fn(),
    fetchRecents: vi.fn(),
    fetchCollections: vi.fn(),
    toggleFavorite: vi.fn(),
    trackRecentActivity: vi.fn(),
    createCollection: vi.fn(),
  };
});

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const { defaultFilters } = vi.hoisted(() => ({
  defaultFilters: {
    search: "",
    stage: [] as string[],
    subject: [] as string[],
    skills: [] as string[],
    duration: [] as string[],
    grouping: [] as string[],
    delivery: [] as string[],
    technology: [] as string[],
    tags: [] as string[],
  },
}));

vi.mock("../../api/activityPreferences", () => ({
  defaultActivityFilters: defaultFilters,
  fetchActivities: mocks.fetchActivities,
  fetchFavorites: mocks.fetchFavorites,
  fetchRecents: mocks.fetchRecents,
  fetchCollections: mocks.fetchCollections,
  toggleFavorite: mocks.toggleFavorite,
  trackRecentActivity: mocks.trackRecentActivity,
  createCollection: mocks.createCollection,
}));

const { ResizeObserver } = vi.hoisted(() => ({
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
}));

describe("ActivitySearchPanel favorites", () => {
  beforeAll(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserver);
  });

  beforeEach(() => {
    mocks.fetchRecents.mockResolvedValue([]);
    mocks.fetchCollections.mockResolvedValue([]);
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("adds an activity to favorites state when favorited from browse", async () => {
    mocks.fetchActivities.mockResolvedValue([sampleActivity]);
    mocks.toggleFavorite.mockResolvedValue(true);
    const favoritesRequest = createDeferred<any>();
    mocks.fetchFavorites.mockImplementation(() => favoritesRequest.promise);

    render(<ActivitySearchPanel activeActivitySlug={null} onSelectActivity={vi.fn()} />);

    const browsePanel = await screen.findByRole("tabpanel", { name: /browse/i });
    await waitFor(() => {
      expect(within(browsePanel).getByText(sampleActivity.name)).toBeInTheDocument();
    });

    const toggleButton = within(browsePanel).getByRole("button", { name: /toggle favorite/i });
    const user = userEvent.setup();
    await user.click(toggleButton);

    const favoritesTab = await screen.findByRole("tab", { name: /favorites/i });
    await user.click(favoritesTab);

    const favoritesPanel = await screen.findByRole("tabpanel", { name: /favorites/i });
    await waitFor(() => {
      expect(within(favoritesPanel).getByText(sampleActivity.name)).toBeInTheDocument();
    });

    favoritesRequest.resolve([] as any);
  });

  it("removes an activity from the favorites tab immediately after unfavoriting", async () => {
    mocks.fetchActivities.mockResolvedValue([sampleActivity, anotherActivity]);
    mocks.fetchFavorites.mockResolvedValue([
      { summary: anotherActivity, createdAt: "2024-01-01T00:00:00.000Z" },
    ]);
    mocks.toggleFavorite.mockResolvedValue(false);

    render(<ActivitySearchPanel activeActivitySlug={null} onSelectActivity={vi.fn()} />);

    const user = userEvent.setup();
    const favoritesTab = await screen.findByRole("tab", { name: /favorites/i });
    await user.click(favoritesTab);

    const favoritesPanel = await screen.findByRole("tabpanel", { name: /favorites/i });
    await waitFor(() => {
      expect(within(favoritesPanel).getByText(anotherActivity.name)).toBeInTheDocument();
    });

    const toggleButton = within(favoritesPanel).getByRole("button", { name: /toggle favorite/i });
    await user.click(toggleButton);

    await waitFor(() => {
      expect(within(favoritesPanel).queryByText(anotherActivity.name)).not.toBeInTheDocument();
    });
  });
});
