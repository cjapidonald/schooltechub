import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Clock, FolderPlus, Heart, History, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { BuilderActivitySummary } from "../types";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  ActivityFilterState,
  createCollection,
  defaultActivityFilters,
  fetchActivities,
  fetchCollections,
  fetchFavorites,
  fetchRecents,
  toggleFavorite,
  trackRecentActivity,
} from "../api/activityPreferences";

const FILTER_CONFIG: Record<keyof Omit<ActivityFilterState, "search">, string[]> = {
  stage: ["Early Childhood", "Primary", "Secondary", "High School"],
  subject: ["ELA", "Math", "Science", "STEM", "ICT"],
  skills: ["Collaboration", "Creativity", "Critical Thinking", "Communication"],
  duration: ["10", "20", "30", "45", "60"],
  grouping: ["1:1", "Pairs", "Small Group", "Whole Class"],
  delivery: ["In-class", "Remote", "Hybrid"],
  technology: ["Slides", "Tablets", "Robotics", "VR"],
  tags: ["Warm-Up", "Hands-on", "Assessment", "Reflection"],
};

interface ActivitySearchPanelProps {
  activeActivitySlug?: string | null;
  onSelectActivity: (activity: BuilderActivitySummary) => void;
}

const formatDuration = (value: string | null) => {
  if (!value) return "Flexible";
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return value;
  return `${number} min`;
};

const ActivityCard = ({
  activity,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onAddToCollection,
}: {
  activity: BuilderActivitySummary;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onAddToCollection?: () => void;
}) => {
  return (
    <Card className={`transition ${isActive ? "border-primary shadow-lg" : "hover:border-primary"}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-lg font-semibold">{activity.name}</CardTitle>
          <CardDescription>{activity.description ?? ""}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleFavorite} aria-label="Toggle favorite">
          {isFavorite ? <Heart className="h-5 w-5 fill-current text-destructive" /> : <Heart className="h-5 w-5" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(activity.duration)}</span>
          {activity.schoolStages.map(stage => (
            <Badge key={stage} variant="secondary">{stage}</Badge>
          ))}
          {activity.subjects.map(subject => (
            <Badge key={subject} variant="outline">{subject}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {activity.activityTypes.map(type => (
            <Badge key={type} variant="secondary" className="capitalize">
              {type.toLowerCase()}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between gap-2">
          <Button onClick={onSelect} className="flex-1" variant={isActive ? "default" : "outline"}>
            {isActive ? "Selected" : "Add to lesson"}
          </Button>
          {onAddToCollection ? (
            <Button variant="ghost" size="sm" onClick={onAddToCollection} className="shrink-0">
              Save to collection
            </Button>
          ) : null}
          {activity.delivery ? (
            <Badge variant="secondary" className="self-center capitalize">
              {activity.delivery.toLowerCase()}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

const FilterChip = ({ active, label, onToggle }: { active: boolean; label: string; onToggle: () => void }) => (
  <Button
    type="button"
    variant={active ? "default" : "outline"}
    size="sm"
    className="rounded-full"
    onClick={onToggle}
  >
    {label}
  </Button>
);

export const ActivitySearchPanel = ({ activeActivitySlug, onSelectActivity }: ActivitySearchPanelProps) => {
  const [tab, setTab] = useState("browse");
  const [filters, setFilters] = useState<ActivityFilterState>(defaultActivityFilters);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const [activities, setActivities] = useState<BuilderActivitySummary[]>([]);
  const [recents, setRecents] = useState<{ summary: BuilderActivitySummary; lastViewed: string }[]>([]);
  const [favorites, setFavorites] = useState<{ summary: BuilderActivitySummary; createdAt: string }[]>([]);
  const [collections, setCollections] = useState<
    { id: string; name: string; description: string; items: BuilderActivitySummary[] }[]
  >([]);
  const [favoriteSlugs, setFavoriteSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleFilter = useCallback((key: keyof ActivityFilterState, value: string) => {
    setFilters(prev => {
      if (key === "search") {
        return { ...prev, search: value };
      }
      const current = new Set(prev[key]);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return {
        ...prev,
        [key]: Array.from(current),
      };
    });
  }, []);

  const { stage, subject, skills, duration, grouping, delivery, technology, tags } = filters;

  const filterPayload = useMemo<ActivityFilterState>(
    () => ({
      search: debouncedSearch,
      stage,
      subject,
      skills,
      duration,
      grouping,
      delivery,
      technology,
      tags,
    }),
    [debouncedSearch, stage, subject, skills, duration, grouping, delivery, technology, tags],
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchActivities(filterPayload);
        if (!isMounted) return;
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activities", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [filterPayload]);

  useEffect(() => {
    if (tab === "recents") {
      fetchRecents().then(result => setRecents(result)).catch(err => console.error(err));
    } else if (tab === "favorites") {
      fetchFavorites()
        .then(result => {
          setFavorites(result);
          setFavoriteSlugs(new Set(result.map(item => item.summary.slug)));
        })
        .catch(err => console.error(err));
    } else if (tab === "collections") {
      fetchCollections().then(result => setCollections(result)).catch(err => console.error(err));
    }
  }, [tab]);

  const handleToggleFavorite = async (activity: BuilderActivitySummary) => {
    try {
      const isFavorite = favoriteSlugs.has(activity.slug);
      const nextState = await toggleFavorite(activity, isFavorite);
      setFavoriteSlugs(prev => {
        const next = new Set(prev);
        if (nextState) {
          next.add(activity.slug);
        } else {
          next.delete(activity.slug);
        }
        return next;
      });
      setFavorites(prev => {
        if (nextState) {
          if (prev.some(item => item.summary.slug === activity.slug)) {
            return prev.map(item =>
              item.summary.slug === activity.slug ? { ...item, summary: activity } : item,
            );
          }
          return [
            {
              summary: activity,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
        return prev.filter(item => item.summary.slug !== activity.slug);
      });
    } catch (error) {
      console.error("Unable to toggle favorite", error);
    }
  };

  const handleSelect = async (activity: BuilderActivitySummary) => {
    onSelectActivity(activity);
    try {
      await trackRecentActivity(activity);
    } catch (error) {
      console.error("Failed to track recent activity", error);
    }
  };

  const handleCreateCollection = async (activity: BuilderActivitySummary) => {
    const name = window.prompt("Name this collection");
    if (!name) return;
    try {
      await createCollection(name, [activity.slug]);
      const result = await fetchCollections();
      setCollections(result);
    } catch (error) {
      console.error("Failed to create collection", error);
    }
  };

  const filterBadges = useMemo(() => {
    return (Object.keys(FILTER_CONFIG) as Array<keyof typeof FILTER_CONFIG>).map(filterKey => {
      const values = FILTER_CONFIG[filterKey];
      const selectedValues = filters[filterKey];
      return (
        <div key={filterKey} className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">{filterKey}</div>
          <div className="flex flex-wrap gap-2">
            {values.map(value => (
              <FilterChip
                key={value}
                label={value}
                active={selectedValues.includes(value)}
                onToggle={() => toggleFilter(filterKey, value)}
              />
            ))}
          </div>
        </div>
      );
    });
  }, [filters, toggleFilter]);

  return (
    <Card className="h-full overflow-hidden border-none bg-muted/40">
      <CardHeader className="border-b border-border bg-background/60">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Bookmark className="h-5 w-5" /> Activity Library
        </CardTitle>
        <CardDescription>
          Pin favorites, revisit recents, or pull from curated collections to shape your lesson flow.
        </CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by keyword, skill, or tool..."
            value={filters.search}
            onChange={event => toggleFilter("search", event.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-6rem)] flex-col gap-6 p-0">
        <ScrollArea className="px-6 pt-4">
          <div className="grid gap-6">{filterBadges}</div>
        </ScrollArea>
        <Separator />
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="mx-6">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="h-4 w-4" /> Browse
            </TabsTrigger>
            <TabsTrigger value="recents" className="flex items-center gap-2">
              <History className="h-4 w-4" /> Recents
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" /> Favorites
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" /> Collections
            </TabsTrigger>
          </TabsList>
          <TabsContent value="browse" className="h-full overflow-y-auto px-6 pb-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading activities...</p>
            ) : activities.length ? (
              <div className="grid gap-4">
                {activities.map(activity => (
                  <ActivityCard
                    key={activity.slug}
                    activity={activity}
                    isActive={activity.slug === activeActivitySlug}
                    isFavorite={favoriteSlugs.has(activity.slug)}
                    onSelect={() => handleSelect(activity)}
                    onToggleFavorite={() => handleToggleFavorite(activity)}
                    onAddToCollection={() => handleCreateCollection(activity)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activities match your filters yet.</p>
            )}
          </TabsContent>
          <TabsContent value="recents" className="h-full overflow-y-auto px-6 pb-6">
            {recents.length ? (
              <div className="grid gap-4">
                {recents.map(item => (
                  <ActivityCard
                    key={item.summary.slug}
                    activity={item.summary}
                    isActive={item.summary.slug === activeActivitySlug}
                    isFavorite={favoriteSlugs.has(item.summary.slug)}
                    onSelect={() => handleSelect(item.summary)}
                    onToggleFavorite={() => handleToggleFavorite(item.summary)}
                    onAddToCollection={() => handleCreateCollection(item.summary)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">We will keep track of the last activities you opened.</p>
            )}
          </TabsContent>
          <TabsContent value="favorites" className="h-full overflow-y-auto px-6 pb-6">
            {favorites.length ? (
              <div className="grid gap-4">
                {favorites.map(item => (
                  <ActivityCard
                    key={item.summary.slug}
                    activity={item.summary}
                    isActive={item.summary.slug === activeActivitySlug}
                    isFavorite={favoriteSlugs.has(item.summary.slug)}
                    onSelect={() => handleSelect(item.summary)}
                    onToggleFavorite={() => handleToggleFavorite(item.summary)}
                    onAddToCollection={() => handleCreateCollection(item.summary)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Favorite activities and we will stash them here.</p>
            )}
          </TabsContent>
          <TabsContent value="collections" className="h-full overflow-y-auto px-6 pb-6">
            {collections.length ? (
              <div className="space-y-6">
                {collections.map(collection => (
                  <div key={collection.id} className="space-y-3 rounded-lg border border-dashed p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{collection.name}</p>
                        {collection.description ? (
                          <p className="text-xs text-muted-foreground">{collection.description}</p>
                        ) : null}
                      </div>
                      <Badge variant="secondary">{collection.items.length} activities</Badge>
                    </div>
                    <div className="grid gap-3">
                      {collection.items.map(activity => (
                        <ActivityCard
                          key={`${collection.id}-${activity.slug}`}
                          activity={activity}
                          isActive={activity.slug === activeActivitySlug}
                          isFavorite={favoriteSlugs.has(activity.slug)}
                          onSelect={() => handleSelect(activity)}
                          onToggleFavorite={() => handleToggleFavorite(activity)}
                          onAddToCollection={() => handleCreateCollection(activity)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-6 text-left">
                <p className="text-sm text-muted-foreground">
                  Group your go-to sequences—warm-ups, collaboration sets, wrap-ups—into shareable collections.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activities[0] && handleCreateCollection(activities[0])}
                  disabled={!activities.length}
                >
                  Create your first collection
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
