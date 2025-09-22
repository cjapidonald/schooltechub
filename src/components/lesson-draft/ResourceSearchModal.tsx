import { useEffect, useMemo, useRef, useState } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import type { MutableRefObject } from "react";
import { Loader2, Search } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";

import { searchResources } from "@/lib/resources";
import type { Resource } from "@/types/resources";
import { useLessonDraftStore } from "@/stores/lessonDraft";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

const cloneFilterState = (state: FilterState): FilterState => ({
  searchValue: state.searchValue,
  types: [...state.types],
  subjects: [...state.subjects],
  stages: [...state.stages],
  tags: [...state.tags],
});

let LAST_FILTER_STATE: FilterState = cloneFilterState(DEFAULT_FILTER_STATE);

interface ResourceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeStepId: string | null;
}

type MultiSelectFilterProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
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

  const toggleValue = (value: string, checked: CheckedState) => {
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

type ResourceGridProps = {
  resources: Resource[];
  columnCount: number;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  onToggleSelection: (resourceId: string) => void;
  onAddSingle: (resourceId: string) => void;
  selectedIds: Set<string>;
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  loadMoreRef: MutableRefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
  canAdd: boolean;
};

const ResourceGrid = ({
  resources,
  columnCount,
  virtualizer,
  onToggleSelection,
  onAddSingle,
  selectedIds,
  scrollContainerRef,
  loadMoreRef,
  isFetchingNextPage,
  canAdd,
}: ResourceGridProps) => {
  const virtualItems = virtualizer.getVirtualItems();

  if (resources.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/60">
        <p className="text-sm text-muted-foreground">No resources match your filters yet.</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-[480px] overflow-y-auto rounded-lg border border-border/60 bg-background/60"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualItems.map(virtualRow => {
          const startIndex = virtualRow.index * columnCount;
          const rowItems = resources.slice(startIndex, startIndex + columnCount);
          return (
            <div
              key={virtualRow.key}
              ref={node => {
                if (node) {
                  virtualizer.measureElement(node);
                }
              }}
              className="absolute left-0 right-0 grid gap-4 px-4 py-4"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              }}
            >
              {rowItems.map(resource => {
                const isSelected = selectedIds.has(resource.id);
                return (
                  <article
                    key={resource.id}
                    className={cn(
                      "flex h-full flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm transition",
                      isSelected
                        ? "border-primary/80 ring-1 ring-primary/30"
                        : "border-border/60 hover:border-primary/40",
                    )}
                  >
                    <div className="relative overflow-hidden rounded-md">
                      <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                        {resource.thumbnail_url ? (
                          <img
                            src={resource.thumbnail_url}
                            alt={resource.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            No preview
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute right-2 top-2 h-7 px-2 text-xs"
                        onClick={() => onAddSingle(resource.id)}
                        disabled={!canAdd}
                      >
                        + Add
                      </Button>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection(resource.id)}
                        aria-label={isSelected ? "Deselect resource" : "Select resource"}
                      />
                      <div className="flex-1 space-y-2">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">{resource.title}</p>
                        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                          {resource.type ? <Badge variant="outline">{resource.type}</Badge> : null}
                          {resource.subject ? <Badge variant="outline">{resource.subject}</Badge> : null}
                          {resource.stage ? <Badge variant="outline">{resource.stage}</Badge> : null}
                        </div>
                        {resource.tags?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.slice(0, 6).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}
        <div
          ref={loadMoreRef}
          style={{
            position: "absolute",
            top: virtualizer.getTotalSize() - 1,
            left: 0,
            right: 0,
            height: 1,
          }}
        />
      </div>
      {isFetchingNextPage ? (
        <div className="flex justify-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading more resources...
        </div>
      ) : null}
    </div>
  );
};

export const ResourceSearchModal = ({ open, onOpenChange, activeStepId }: ResourceSearchModalProps) => {
  const attachResource = useLessonDraftStore(state => state.attachResource);

  const [filters, setFilters] = useState<FilterState>(() => cloneFilterState(DEFAULT_FILTER_STATE));
  const [tagInput, setTagInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [columnCount, setColumnCount] = useState(1);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const debouncedSearch = useDebouncedValue(filters.searchValue, 300);

  useEffect(() => {
    if (open) {
      setFilters(cloneFilterState(LAST_FILTER_STATE));
      setTagInput("");
    } else {
      setSelectedIds([]);
      setTagInput("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    LAST_FILTER_STATE = cloneFilterState(filters);
  }, [filters, open]);

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
      "lesson-draft-resources",
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
    enabled: open,
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

  const { data, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isPending, refetch } = resourceQuery;

  const resources = useMemo(() => data?.pages.flatMap(page => page.items) ?? [], [data?.pages]);

  const virtualizer = useVirtualizer({
    count: Math.ceil(resources.length / columnCount),
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 260,
    overscan: 4,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const calculateColumns = (width: number) => {
      if (width >= 1024) {
        return 3;
      }
      if (width >= 768) {
        return 2;
      }
      return 1;
    };

    const applyColumnCount = (width: number) => {
      const next = calculateColumns(width);
      setColumnCount(prev => (prev === next ? prev : next));
    };

    applyColumnCount(container.clientWidth);

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        applyColumnCount(entry.contentRect.width);
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [open, resources.length]);

  useEffect(() => {
    virtualizer.measure();
  }, [resources.length, columnCount, virtualizer]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const sentinel = loadMoreRef.current;
    const scrollElement = scrollContainerRef.current;

    if (!sentinel || !scrollElement) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: scrollElement,
        rootMargin: "200px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [open, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const toggleSelection = (resourceId: string) => {
    setSelectedIds(current =>
      current.includes(resourceId)
        ? current.filter(item => item !== resourceId)
        : [...current, resourceId],
    );
  };

  const attachResources = (resourceIds: string[]) => {
    if (!activeStepId) {
      return;
    }
    resourceIds.forEach(id => {
      attachResource(activeStepId, id);
    });
  };

  const handleAddSingle = (resourceId: string) => {
    if (!activeStepId) {
      return;
    }
    attachResources([resourceId]);
    onOpenChange(false);
  };

  const handleAddSelected = () => {
    if (!activeStepId || selectedIds.length === 0) {
      return;
    }
    attachResources(selectedIds);
    setSelectedIds([]);
    onOpenChange(false);
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

  const clearAllFilters = () => {
    setFilters(cloneFilterState(DEFAULT_FILTER_STATE));
    setTagInput("");
  };

  const isInitialLoading = isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="lesson-draft-resource-search" className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Search resources</DialogTitle>
          <DialogDescription>
            Explore our resource library to attach materials, activities, and references to this lesson step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={filters.searchValue}
                onChange={event => setFilters(current => ({ ...current, searchValue: event.target.value }))}
                placeholder="Search by topic, tool, or keyword"
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={clearAllFilters}
              disabled={
                filters.searchValue.trim().length === 0 &&
                filters.types.length === 0 &&
                filters.subjects.length === 0 &&
                filters.stages.length === 0 &&
                filters.tags.length === 0
              }
            >
              Clear filters
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-full border border-dashed px-3 py-1">
              <Input
                value={tagInput}
                onChange={event => setTagInput(event.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tag filter"
                className="h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          {filters.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-2 rounded-full px-3">
                  <span>{tag}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground transition hover:text-foreground"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}

          {isError ? (
            <div className="flex h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 text-destructive">
              <p className="text-sm font-medium">We couldn&apos;t load resources right now.</p>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : isInitialLoading ? (
            <div className="grid h-[480px] grid-cols-1 gap-4 overflow-hidden rounded-lg border border-border/60 bg-background/60 p-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-3">
                  <Skeleton className="h-32 w-full rounded-md" />
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ResourceGrid
              resources={resources}
              columnCount={columnCount}
              virtualizer={virtualizer}
              onToggleSelection={toggleSelection}
              onAddSingle={handleAddSingle}
              selectedIds={new Set(selectedIds)}
              scrollContainerRef={scrollContainerRef}
              loadMoreRef={loadMoreRef}
              isFetchingNextPage={isFetchingNextPage}
              canAdd={Boolean(activeStepId)}
            />
          )}
        </div>

        <DialogFooter className="gap-3 sm:justify-between">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 ? (
              <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
            ) : null}
            <Button
              type="button"
              onClick={handleAddSelected}
              disabled={!activeStepId || selectedIds.length === 0}
            >
              Add selected
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

