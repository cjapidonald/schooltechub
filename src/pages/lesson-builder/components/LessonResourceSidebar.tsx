import { type FormEvent, useCallback, useMemo, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { searchResources, fetchResourceById } from "@/lib/resources";
import type { Subject } from "@/lib/constants/subjects";
import type { Resource, ResourceDetail } from "@/types/resources";
import { Badge } from "@/components/ui/badge";
import { ResourceCard } from "@/components/lesson-draft/ResourceCard";
import { cn } from "@/lib/utils";

const SEARCH_INPUT_ID = "lesson-resource-search-input";

type DraggableResourceData = {
  type: "library-resource";
  resource: Resource;
  resourceId: string;
  source: "sidebar";
};

interface SidebarResourceCardProps {
  resource: Resource;
  onInsert: (resourceId: string) => void;
  disabled: boolean;
  isPending: boolean;
}

const SidebarResourceCard = ({ resource, onInsert, disabled, isPending }: SidebarResourceCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable<DraggableResourceData>({
    id: `lesson-resource-${resource.id}`,
    data: {
      type: "library-resource",
      resource,
      resourceId: resource.id,
      source: "sidebar",
    },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <li>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group focus-within:ring-2 focus-within:ring-sky-300/80 focus-within:ring-offset-4 focus-within:ring-offset-[rgba(255,255,255,0.08)]",
          "cursor-grab rounded-2xl border border-white/20 bg-white/10 p-3 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.9)] backdrop-blur transition",
          isDragging && "opacity-70",
        )}
        {...listeners}
        {...attributes}
      >
        <div className="flex flex-col gap-3">
          <ResourceCard resource={resource} layout="horizontal" />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => onInsert(resource.id)}
              disabled={disabled || isPending}
              aria-label={`Insert ${resource.title} into document`}
              className="border-white/20 bg-white/10 text-foreground shadow-[0_10px_30px_-18px_rgba(15,23,42,0.85)] backdrop-blur"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add resource card
            </Button>
            {resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-sky-200 underline-offset-2 hover:underline"
              >
                Preview
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
};

interface LessonResourceSidebarProps {
  subject: Subject | null;
  onInsertResource: (resource: ResourceDetail) => void;
  isAuthenticated: boolean;
}

export const LessonResourceSidebar = ({ subject, onInsertResource, isAuthenticated }: LessonResourceSidebarProps) => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [pendingResourceId, setPendingResourceId] = useState<string | null>(null);

  const subjectFilters = useMemo(() => {
    if (!subject) {
      return undefined;
    }
    return [subject];
  }, [subject]);

  const resourceQuery = useQuery({
    queryKey: ["lesson-builder-resource-search", submittedQuery, subjectFilters?.join("|") ?? "all"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const result = await searchResources({
        q: submittedQuery || undefined,
        subjects: subjectFilters,
        pageSize: 8,
      });
      return result.items as Resource[];
    },
  });

  const resources = resourceQuery.data ?? [];

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmittedQuery(query.trim());
    },
    [query],
  );

  const handleInsert = useCallback(
    async (resourceId: string) => {
      if (!isAuthenticated) {
        toast({
          title: "Sign in to add resources",
          description: "You'll need to be signed in to attach catalog resources to your lesson plan.",
        });
        return;
      }

      setPendingResourceId(resourceId);
      try {
        const detail = await fetchResourceById(resourceId);
        onInsertResource(detail);
      } catch (error) {
        const description = error instanceof Error ? error.message : "Unable to add this resource.";
        toast({ title: "Resource not added", description, variant: "destructive" });
      } finally {
        setPendingResourceId(current => (current === resourceId ? null : current));
      }
    },
    [isAuthenticated, onInsertResource, toast],
  );

  if (!isAuthenticated) {
    return (
      <aside className="space-y-3 rounded-2xl border border-dashed border-white/30 bg-white/5 p-4 text-sm text-slate-100 backdrop-blur">
        <p className="font-medium text-white">Add resources</p>
        <p className="text-slate-200/80">
          Sign in and open a lesson workspace to search approved resources and insert them directly into your document.
        </p>
      </aside>
    );
  }

  return (
    <aside className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.9)] backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Add a resource</p>
        <p className="text-xs text-slate-200/80">
          Search presentations, worksheets, and videos. Click insert to add the resource to your lesson plan table.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            id={SEARCH_INPUT_ID}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search the resource library"
            className="pr-10 border-white/20 bg-white/10 text-foreground placeholder:text-slate-200/60 backdrop-blur"
            aria-label="Search lesson resources"
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {subject ? <Badge variant="secondary" className="border-white/20 bg-white/10 backdrop-blur">{subject}</Badge> : null}
            <span>{resourceQuery.data ? `${resources.length} results` : "Ready to search"}</span>
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={resourceQuery.isFetching}
            className="border-white/20 bg-white/10 text-foreground shadow-[0_12px_35px_-20px_rgba(15,23,42,0.85)] backdrop-blur"
          >
            {resourceQuery.isFetching ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Search
          </Button>
        </div>
      </form>

      {resourceQuery.isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive backdrop-blur">
          Unable to load resources right now. Please try searching again shortly.
        </div>
      ) : null}

      <div className="space-y-3">
        {resourceQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading resources…
          </div>
        ) : null}

        {!resourceQuery.isLoading && resources.length === 0 ? (
          <p className="text-sm text-slate-200/80">No matching resources yet. Try another search term.</p>
        ) : null}

        <ul className="space-y-3">
          {resources.map(resource => (
            <SidebarResourceCard
              key={resource.id}
              resource={resource}
              onInsert={resourceId => void handleInsert(resourceId)}
              disabled={resourceQuery.isFetching}
              isPending={pendingResourceId === resource.id}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default LessonResourceSidebar;
