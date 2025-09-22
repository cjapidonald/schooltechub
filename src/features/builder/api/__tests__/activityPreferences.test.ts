import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  fetchRecents,
  fetchFavorites,
  toggleFavorite,
  trackRecentActivity,
  createCollection,
  fetchCollections,
} from "@/features/builder/api/activityPreferences";
import type { BuilderActivitySummary } from "@/features/builder/types";

const sampleRecord = {
  slug: "vr-lab",
  name: "VR Lab Walkthrough",
  description: "Explore the virtual science lab",
  subjects: ["Science"],
  school_stages: ["Secondary"],
  activity_types: ["Exploration"],
  group_sizes: ["Pairs"],
  setup_time: "30",
  best_for: "In-class",
  devices: ["VR"],
};

const sampleActivity: BuilderActivitySummary = {
  slug: sampleRecord.slug,
  name: sampleRecord.name,
  description: sampleRecord.description,
  subjects: ["Science"],
  schoolStages: ["Secondary"],
  activityTypes: ["Exploration"],
  tags: ["Pairs"],
  duration: "30",
  delivery: "In-class",
  technology: ["VR"],
};

const recentsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({
    data: [
      {
        last_viewed: "2024-01-01T00:00:00.000Z",
        metadata: { name: sampleRecord.name },
        activity: sampleRecord,
      },
    ],
    error: null,
  }),
};

const deleteBuilder = {
  eq: vi.fn().mockImplementation(() => deleteBuilder),
  then: (resolve: (value: { data: null; error: null }) => unknown) => {
    resolve({ data: null, error: null });
    return Promise.resolve();
  },
};

const favoritesChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({
    data: [
      {
        created_at: "2024-01-01T00:00:00.000Z",
        activity: sampleRecord,
      },
    ],
    error: null,
  }),
  delete: vi.fn().mockReturnValue(deleteBuilder),
  upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
};

const recentsUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
const resourceInsert = vi.fn().mockResolvedValue({ data: null, error: null });

const collectionsChain = {
  insert: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: "collection-1" }, error: null }) }),
  }),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
};

const collectionItemsChain = {
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      switch (table) {
        case "builder_activity_recents":
          return { ...recentsChain, upsert: recentsUpsert };
        case "builder_activity_favorites":
          return favoritesChain;
        case "builder_collections":
          return collectionsChain;
        case "builder_collection_items":
          return collectionItemsChain;
        default:
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            insert: resourceInsert,
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
      }
    }),
  },
}));

describe("activityPreferences API helpers", () => {
  beforeEach(() => {
    window.localStorage.setItem("builder-anon-user-id", "test-user");
    recentsChain.select.mockClear();
    favoritesChain.select.mockClear();
    favoritesChain.delete.mockClear();
    deleteBuilder.eq.mockClear();
    favoritesChain.upsert.mockClear();
    recentsUpsert.mockClear();
    collectionsChain.insert.mockClear();
    collectionsChain.select.mockClear();
    collectionItemsChain.insert.mockClear();
  });

  it("loads recents with joined activity data", async () => {
    const recents = await fetchRecents();
    expect(recents).toHaveLength(1);
    expect(recents[0].summary.slug).toBe(sampleRecord.slug);
    expect(recentsChain.select).toHaveBeenCalledWith(
      expect.stringContaining("builder_activity_recents_activity_slug_fkey"),
    );
  });

  it("loads favorites with activity summaries", async () => {
    const favorites = await fetchFavorites();
    expect(favorites).toHaveLength(1);
    expect(favoritesChain.select).toHaveBeenCalledWith(
      expect.stringContaining("builder_activity_favorites_activity_slug_fkey"),
    );
  });

  it("toggles favorites through Supabase", async () => {
    const added = await toggleFavorite(sampleActivity, false);
    expect(added).toBe(true);
    expect(favoritesChain.upsert).toHaveBeenCalled();

    const removed = await toggleFavorite(sampleActivity, true);
    expect(removed).toBe(false);
    expect(favoritesChain.delete).toHaveBeenCalled();
  });

  it("tracks recent activity", async () => {
    await trackRecentActivity(sampleActivity);
    expect(recentsUpsert).toHaveBeenCalled();
  });

  it("creates collections and adds items", async () => {
    const id = await createCollection("Warm-ups", [sampleActivity.slug]);
    expect(id).toBe("collection-1");
    expect(collectionsChain.insert).toHaveBeenCalled();
    expect(collectionItemsChain.insert).toHaveBeenCalled();
  });

  it("fetches collections with activity entries", async () => {
    collectionsChain.order.mockResolvedValueOnce({
      data: [
        {
          id: "collection-1",
          name: "Warm-ups",
          description: "Quick starts",
          items: [
            {
              activity: sampleRecord,
            },
          ],
        },
      ],
      error: null,
    });

    const collections = await fetchCollections();
    expect(collections[0].items[0].slug).toBe(sampleRecord.slug);
  });
});
