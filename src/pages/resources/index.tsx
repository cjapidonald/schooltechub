import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LayoutGrid, List, Loader2, Search, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { SEO } from "@/components/SEO";
import { ResourceCard as LessonDraftResourceCard } from "@/components/lesson-draft/ResourceCard";
import { UploadResourceDialog } from "@/components/resources/UploadResourceDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { getSignedDownloadUrl, ResourceDataError, searchResources } from "@/lib/resources";
import { supabase } from "@/integrations/supabase/client";
import {
  attachResourceToActiveStep,
  getActiveLessonDraftId,
  getStoredActiveStepId,
  subscribeToActiveStepChanges,
  subscribeToLessonDraftContext,
} from "@/lib/lesson-draft-bridge";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types/resources";

const TYPE_OPTIONS = [
  "Worksheet",
  "Video",
  "Interactive",
  "Presentation",
  "Assessment",
  "Article",
  "Audio",
  "Game",
  "Template",
  "Other",
];

const SUBJECT_OPTIONS = [
  "Math",
  "Science",
  "English",
  "Social Studies",
  "STEM",
  "ICT",
  "Arts",
  "Languages",
];

const STAGE_OPTIONS = [
  "Early Childhood",
  "Primary",
  "Lower Secondary",
  "Upper Secondary",
  "Higher Education",
];

type FilterState = {
  searchValue: string;
  types: string[];
  subjects: string[];
  stages: string[];
  tags: string[];
};

const DEFAULT_FILTER_STATE: FilterState = {
  searchValue: "",
  types: [],
  subjects: [],
  stages: [],
  tags: [],
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "most-tagged", label: "Most tags" },
  { value: "title", label: "Title A–Z" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

type MultiSelectFilterProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

type ResourceCardViewProps = {
  resource: Resource;
  view: "grid" | "list";
  onAdd: () => void;
  isAuthenticated: boolean;
  onRequireLogin: () => void;
};

const useDebouncedValue = <T,>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

const MultiSelectFilter = ({ label, options, selected, onChange }: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);

  const toggleValue = (value: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      if (selected.includes(value)) {
        return;
      }
      onChange([...selected, value]);
      return;
    }
    onChange(selected.filter(item => item !== value));
  };

  const clearSelection = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-full border-dashed"
        >
          <span>{label}</span>
          {selected.length > 0 ? (
            <Badge variant="secondary" className="rounded-full px-2 text-xs">
              {selected.length}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-medium">{label}</p>
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={selected.length === 0}>
            Clear
          </Button>
        </div>
        <Separator />
        <div className="max-h-64 overflow-y-auto p-2">
          {options.map(option => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={next => toggleValue(option, next)}
                  aria-label={`Toggle ${option}`}
                />
                <span className="flex-1 text-sm">{option}</span>
              </label>
            );
          })}
          {options.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">No options available.</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ResourceCardView = ({ resource, view, onAdd, isAuthenticated, onRequireLogin }: ResourceCardViewProps) => {
  const layout = view === "grid" ? "vertical" : "horizontal";
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const hasExternalLink = typeof resource.url === "string" && resource.url.trim().length > 0;
  const canDownload = !hasExternalLink && Boolean(resource.storage_path);

  const handleDownload = async () => {
    if (!canDownload) {
      return;
    }

    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }

    try {
      setIsDownloading(true);
      const signedUrl = await getSignedDownloadUrl(resource.id);

      if (typeof window !== "undefined") {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (downloadError) {
      const message =
        downloadError instanceof ResourceDataError
          ? downloadError.message
          : "We couldn't open this resource.";
      if (
        downloadError instanceof ResourceDataError &&
        downloadError.message.toLowerCase().includes("signed in")
      ) {
        onRequireLogin();
      }
      toast({ title: "Download failed", description: message, variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {hasExternalLink ? (
        <Button asChild variant="outline" size="sm">
          <a href={resource.url ?? undefined} target="_blank" rel="noreferrer">
            View resource
          </a>
        </Button>
      ) : null}
      {canDownload ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Preparing download
            </span>
          ) : (
            "Download"
          )}
        </Button>
      ) : null}
      {resource.created_at ? (
        <span className="text-xs text-muted-foreground">
          Added {new Date(resource.created_at).toLocaleDateString()}
        </span>
      ) : null}
    </div>
  );

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardContent className={view === "list" ? "space-y-3 p-6" : "space-y-3 p-4"}>
        <LessonDraftResourceCard
          resource={resource}
          layout={layout}
          onAdd={onAdd}
          addButtonLabel="Add to plan"
        />
        {actions}
      </CardContent>
    </Card>
  );
};

const cloneFilterState = (state: FilterState): FilterState => ({
  searchValue: state.searchValue,
  types: [...state.types],
  subjects: [...state.subjects],
  stages: [...state.stages],
  tags: [...state.tags],
});

const ResourcesPage = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(() => cloneFilterState(DEFAULT_FILTER_STATE));
  const [tagInput, setTagInput] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortOption>("newest");
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<"download" | "upload" | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(filters.searchValue, 300);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncContext = () => {
      const draftId = getActiveLessonDraftId();
      setActiveStepId(draftId ? getStoredActiveStepId(draftId) : null);
    };

    syncContext();

    const unsubscribeContext = subscribeToLessonDraftContext(({ draftId }) => {
      setActiveStepId(draftId ? getStoredActiveStepId(draftId) : null);
    });

    const unsubscribeStep = subscribeToActiveStepChanges(({ draftId, stepId }) => {
      const currentDraftId = getActiveLessonDraftId();
      if (currentDraftId && currentDraftId === draftId) {
        setActiveStepId(stepId);
      }
    });

    const handleFocus = () => {
      syncContext();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      unsubscribeContext();
      unsubscribeStep();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!mounted) {
        return;
      }
      setCurrentUser(sessionData.session?.user ?? null);
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      authSubscription?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser && loginDialogOpen) {
      setLoginDialogOpen(false);
      setLoginReason(null);
    }
  }, [currentUser, loginDialogOpen]);

  const isAuthenticated = Boolean(currentUser);

  const sanitizedFilters = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      types: filters.types,
      subjects: filters.subjects,
      stages: filters.stages,
      tags: filters.tags,
    }),
    [debouncedSearch, filters.tags, filters.types, filters.subjects, filters.stages],
  );

  const queryKey = useMemo(
    () => [
      "public-resources",
      sanitizedFilters.q ?? "",
      [...sanitizedFilters.types].sort().join("|"),
      [...sanitizedFilters.subjects].sort().join("|"),
      [...sanitizedFilters.stages].sort().join("|"),
      [...sanitizedFilters.tags].sort().join("|"),
    ],
    [sanitizedFilters],
  );

  const resourceQuery = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      const response = await searchResources({
        ...sanitizedFilters,
        page,
      });
      return {
        items: response.items,
        total: response.total,
        page,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      if (loaded >= lastPage.total) {
        return undefined;
      }
      return lastPage.page + 1;
    },
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError, isPending, refetch } = resourceQuery;

  const resources = useMemo(() => data?.pages.flatMap(page => page.items) ?? [], [data?.pages]);

  const sortedResources = useMemo(() => {
    const items = [...resources];
    if (sort === "most-tagged") {
      return items.sort((a, b) => {
        const aTags = a.tags?.length ?? 0;
        const bTags = b.tags?.length ?? 0;
        if (bTags !== aTags) {
          return bTags - aTags;
        }
        return a.title.localeCompare(b.title);
      });
    }
    if (sort === "title") {
      return items.sort((a, b) => a.title.localeCompare(b.title));
    }
    return items.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [resources, sort]);

  const handleAttachResource = (resource: Resource) => {
    if (!activeStepId) {
      toast({ description: "Open a lesson draft to attach resources." });
      return;
    }

    const attached = attachResourceToActiveStep(resource.id);
    if (attached) {
      toast({ description: `Added "${resource.title}" to your lesson draft.` });
      return;
    }

    toast({ description: "Open a lesson draft to attach resources." });
  };

  const handleTagInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const value = tagInput.trim();
      if (!value) {
        return;
      }
      if (filters.tags.includes(value)) {
        setTagInput("");
        return;
      }
      setFilters(current => ({ ...current, tags: [...current.tags, value] }));
      setTagInput("");
    }
    if (event.key === "Backspace" && tagInput.length === 0 && filters.tags.length > 0) {
      event.preventDefault();
      setFilters(current => ({ ...current, tags: current.tags.slice(0, -1) }));
    }
  };

  const removeTag = (tag: string) => {
    setFilters(current => ({ ...current, tags: current.tags.filter(item => item !== tag) }));
  };

  const clearFilters = () => {
    setFilters(cloneFilterState(DEFAULT_FILTER_STATE));
    setTagInput("");
  };

  const openLoginDialog = (reason: "download" | "upload") => {
    setLoginReason(reason);
    setLoginDialogOpen(true);
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      openLoginDialog("upload");
      return;
    }

    setUploadDialogOpen(true);
  };

  const isInitialLoading = isPending || (resources.length === 0 && isFetchingNextPage);

  const hasActiveFilters =
    filters.searchValue.trim().length > 0 ||
    filters.types.length > 0 ||
    filters.subjects.length > 0 ||
    filters.stages.length > 0 ||
    filters.tags.length > 0;

  const title = "Resource Library | SchoolTechHub";
  const description = "Browse classroom-ready worksheets, videos, games, and more curated by educators.";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={title}
        description={description}
        canonicalUrl={`https://schooltechhub.com${getLocalizedPath("/resources", language)}`}
        lang={language}
      />
      <main className="container py-12">
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[280px_1fr]">
          <aside className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight">Resource library</h1>
                  <p className="text-muted-foreground">
                    Explore ready-to-use learning materials shared by the SchoolTechHub community. Use filters to match your
                    classroom needs.
                  </p>
                </div>
                <Button type="button" className="w-full sm:w-auto" onClick={handleUploadClick}>
                  Upload resource
                </Button>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="resource-search">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="resource-search"
                    type="search"
                    value={filters.searchValue}
                    onChange={event =>
                      setFilters(current => ({ ...current, searchValue: event.target.value }))
                    }
                    placeholder="Search by keyword, topic, or tool"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <MultiSelectFilter
                  label="Type"
                  options={TYPE_OPTIONS}
                  selected={filters.types}
                  onChange={types => setFilters(current => ({ ...current, types }))}
                />
                <MultiSelectFilter
                  label="Subject"
                  options={SUBJECT_OPTIONS}
                  selected={filters.subjects}
                  onChange={subjects => setFilters(current => ({ ...current, subjects }))}
                />
                <MultiSelectFilter
                  label="Stage"
                  options={STAGE_OPTIONS}
                  selected={filters.stages}
                  onChange={stages => setFilters(current => ({ ...current, stages }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="resource-tags">
                  Tags
                </label>
                <Input
                  id="resource-tags"
                  value={tagInput}
                  onChange={event => setTagInput(event.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add a tag and press enter"
                />
                <p className="text-xs text-muted-foreground">Resources must include at least one of the tags you add.</p>
              </div>

              {filters.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-2 rounded-full px-3">
                      <span>#{tag}</span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground transition hover:text-foreground"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Sort</label>
                <Select value={sort} onValueChange={value => setSort(value as SortOption)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort resources" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="justify-start text-sm"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                Clear filters
              </Button>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                  Showing {sortedResources.length} resource{sortedResources.length === 1 ? "" : "s"}
                  {data?.pages?.[0]?.total ? ` of ${data.pages[0].total}` : ""}
                </p>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Button type="button" variant="secondary" onClick={handleUploadClick}>
                    Upload resource
                  </Button>
                  <ToggleGroup
                    type="single"
                    value={view}
                    onValueChange={next => {
                      if (next === "grid" || next === "list") {
                        setView(next);
                      }
                    }}
                  >
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                      <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List view">
                      <List className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>

            {isError ? (
              <div
                className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 p-12 text-center text-destructive"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-base font-medium">We couldn&apos;t load resources right now.</p>
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            ) : isInitialLoading ? (
              <div
                className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <span className="sr-only">Loading resources…</span>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden border shadow-sm">
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="space-y-3 p-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedResources.length === 0 ? (
              <div
                className="flex flex-col items-center gap-4 rounded-3xl border border-dashed p-12 text-center"
                role="status"
                aria-live="polite"
              >
                <p className="text-lg font-semibold">No resources match your filters yet.</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Try removing some filters or searching for a different keyword to explore more of the library.
                </p>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div
                className={cn(view === "grid" ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3" : "space-y-4")}
                aria-busy={isFetchingNextPage}
              >
                {sortedResources.map(resource => (
                  <ResourceCardView
                    key={resource.id}
                    resource={resource}
                    view={view}
                    onAdd={() => handleAttachResource(resource)}
                    isAuthenticated={isAuthenticated}
                    onRequireLogin={() => openLoginDialog("download")}
                  />
                ))}
              </div>
            )}

            {sortedResources.length > 0 ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading more
                    </span>
                  ) : hasNextPage ? (
                    "Load more"
                  ) : (
                    "All resources loaded"
                  )}
                </Button>
              </div>
            ) : null}

            <div className="flex justify-center pt-6">
              <Button type="button" size="lg" onClick={handleUploadClick}>
                Upload resource
              </Button>
            </div>
          </section>
        </div>
      </main>

      <UploadResourceDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => {
          toast({ description: "Submitted for approval" });
          setUploadDialogOpen(false);
        }}
      />

      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {loginReason === "upload" ? "Sign in to upload" : "Sign in to download"}
            </DialogTitle>
            <DialogDescription>
              {loginReason === "upload"
                ? "Create a free SchoolTechHub account to share your own classroom resources with the community."
                : "Sign in to access downloadable files and save them to your lesson plans."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLoginDialogOpen(false)}>
              Not now
            </Button>
            <Button
              type="button"
              onClick={() => {
                setLoginDialogOpen(false);
                navigate(getLocalizedPath("/auth", language));
              }}
            >
              Sign in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesPage;
