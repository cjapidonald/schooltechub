import { useEffect, useMemo, useState } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Loader2, Search, X } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ResourceCard } from "@/components/lesson-draft/ResourceCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { searchResources } from "@/lib/resources";
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

const cloneFilterState = (state: FilterState): FilterState => ({
  searchValue: state.searchValue,
  types: [...state.types],
  subjects: [...state.subjects],
  stages: [...state.stages],
  tags: [...state.tags],
});

let LAST_FILTER_STATE: FilterState = cloneFilterState(DEFAULT_FILTER_STATE);

interface ResourceSearchCopy {
  title: string;
  placeholder: string;
  mediaLabel: string;
  stageLabel: string;
  subjectLabel: string;
  clearFilters: string;
  empty: string;
  addLabel: string;
  loading: string;
  tagsLabel?: string;
  loadMoreLabel?: string;
  errorTitle?: string;
  errorDescription?: string;
  retryLabel?: string;
}

interface ResourceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (resource: Resource) => void;
  copy: ResourceSearchCopy;
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

export const ResourceSearchModal = ({ open, onOpenChange, onSelect, copy }: ResourceSearchModalProps) => {
  const [filters, setFilters] = useState<FilterState>(() => cloneFilterState(DEFAULT_FILTER_STATE));
  const [tagInput, setTagInput] = useState("");

  const debouncedSearch = useDebouncedValue(filters.searchValue, 300);

  useEffect(() => {
    if (open) {
      setFilters(cloneFilterState(LAST_FILTER_STATE));
      setTagInput("");
    } else {
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
      "builder-resource-search",
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

  const handleAddResource = (resource: Resource) => {
    onSelect(resource);
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
  const hasActiveFilters =
    filters.searchValue.trim().length > 0 ||
    filters.types.length > 0 ||
    filters.subjects.length > 0 ||
    filters.stages.length > 0 ||
    filters.tags.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl"
        onOpenAutoFocus={event => {
          event.preventDefault();
          const input = document.getElementById("builder-resource-search-input") as HTMLInputElement | null;
          input?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {copy.placeholder}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="builder-resource-search-input"
                value={filters.searchValue}
                onChange={event => setFilters(current => ({ ...current, searchValue: event.target.value }))}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setFilters(current => ({ ...current, searchValue: event.currentTarget.value }));
                  }
                }}
                placeholder={copy.placeholder}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" onClick={clearAllFilters} disabled={!hasActiveFilters}>
              {copy.clearFilters}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MultiSelectFilter
              label={copy.mediaLabel}
              options={TYPE_OPTIONS}
              selected={filters.types}
              onChange={next => setFilters(current => ({ ...current, types: next }))}
            />
            <MultiSelectFilter
              label={copy.stageLabel}
              options={STAGE_OPTIONS}
              selected={filters.stages}
              onChange={next => setFilters(current => ({ ...current, stages: next }))}
            />
            <MultiSelectFilter
              label={copy.subjectLabel}
              options={SUBJECT_OPTIONS}
              selected={filters.subjects}
              onChange={next => setFilters(current => ({ ...current, subjects: next }))}
            />
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={tagInput}
                onChange={event => setTagInput(event.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder={copy.tagsLabel ?? "Add tags"}
              />
              {filters.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 rounded-full px-2 text-xs">
                      <span>#{tag}</span>
                      <button
                        type="button"
                        className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {isInitialLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-60 w-full rounded-lg" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-background/60 p-10 text-center">
                <p className="text-sm font-medium text-foreground">{copy.errorTitle ?? "We couldn't load resources right now."}</p>
                <p className="text-sm text-muted-foreground">{copy.errorDescription ?? "Please try again in a moment."}</p>
                <Button type="button" onClick={() => refetch()}>
                  {copy.retryLabel ?? "Try again"}
                </Button>
              </div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-background/60 p-10 text-center">
                <p className="text-sm text-muted-foreground">{copy.empty}</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {resources.map(resource => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      layout="vertical"
                      onAdd={() => handleAddResource(resource)}
                      addButtonLabel={copy.addLabel}
                    />
                  ))}
                </div>
                {hasNextPage ? (
                  <div className="flex justify-center pt-2">
                    <Button type="button" variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                      {isFetchingNextPage ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> {copy.loading}
                        </span>
                      ) : (
                        copy.loadMoreLabel ?? "Load more"
                      )}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceSearchModal;
