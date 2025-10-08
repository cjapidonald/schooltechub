import { type FormEvent, useCallback, useMemo, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { GripVertical, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { searchResources, fetchResourceById } from "@/lib/resources";
import type { Subject } from "@/lib/constants/subjects";
import type { Resource, ResourceDetail } from "@/types/resources";
import { Badge } from "@/components/ui/badge";
import { ResourceCard } from "@/components/lesson-draft/ResourceCard";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { LessonWorkspaceTextCard } from "../types";

const SEARCH_INPUT_ID = "lesson-resource-search-input";

type DraggableResourceData = {
  type: "library-resource";
  resource: Resource;
  resourceId: string;
  source: "sidebar";
};

type SidebarTextCardDragData = {
  type: "text-card";
  textCardId: string;
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

interface SidebarTextCardProps {
  card: LessonWorkspaceTextCard;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
}

const SidebarTextCard = ({ card, onTitleChange, onContentChange }: SidebarTextCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable<SidebarTextCardDragData>({
    id: `lesson-text-card-${card.id}`,
    data: {
      type: "text-card",
      textCardId: card.id,
      source: "sidebar",
    },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.85)] backdrop-blur",
        isDragging && "opacity-80",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Text card</p>
          <p className="text-xs text-muted-foreground">Drag to your lesson wall or keep editing here.</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-white/20 bg-white/10 p-2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          aria-label="Drag text card"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`lesson-text-card-${card.id}-title`} className="text-xs uppercase tracking-wide text-slate-200/80">
          Title
        </Label>
        <Input
          id={`lesson-text-card-${card.id}-title`}
          value={card.title}
          onChange={event => onTitleChange(event.target.value)}
          placeholder="Add a heading"
          className="border-white/20 bg-white/10 text-foreground placeholder:text-slate-200/60 backdrop-blur"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`lesson-text-card-${card.id}-content`} className="text-xs uppercase tracking-wide text-slate-200/80">
          Notes
        </Label>
        <Textarea
          id={`lesson-text-card-${card.id}-content`}
          value={card.content}
          onChange={event => onContentChange(event.target.value)}
          placeholder="Capture talking points, reminders, or differentiation ideas."
          rows={4}
          className="min-h-[120px] border-white/20 bg-white/10 text-foreground placeholder:text-slate-200/60 backdrop-blur"
        />
      </div>
    </div>
  );
};

interface LessonResourceSidebarProps {
  subject: Subject | null;
  onInsertResource: (resource: ResourceDetail) => void;
  isAuthenticated: boolean;
  textCards: LessonWorkspaceTextCard[];
  onAddTextCard: () => void;
  onUpdateTextCard: (id: string, updates: { title?: string; content?: string }) => void;
}

export const LessonResourceSidebar = ({
  subject,
  onInsertResource,
  isAuthenticated,
  textCards,
  onAddTextCard,
  onUpdateTextCard,
}: LessonResourceSidebarProps) => {
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

  return (
    <aside className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.9)] backdrop-blur">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Reusable text cards</p>
          <p className="text-xs text-slate-200/80">
            Capture quick notes and drag them into your lesson room. Changes stay in sync wherever the card lives.
          </p>
        </div>

        <div className="space-y-3">
          {textCards.map(card => (
            <SidebarTextCard
              key={card.id}
              card={card}
              onTitleChange={value => onUpdateTextCard(card.id, { title: value })}
              onContentChange={value => onUpdateTextCard(card.id, { content: value })}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddTextCard}
            className="w-full border-white/20 bg-white/10 text-foreground shadow-[0_12px_35px_-22px_rgba(56,189,248,0.65)] backdrop-blur"
          >
            Add another text card
          </Button>
        </div>
      </div>

      <Separator className="border-white/10" />

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Add a resource</p>
        <p className="text-xs text-slate-200/80">
          Search presentations, worksheets, and videos. Drag them to your lesson room or insert them into documents.
        </p>
      </div>

      {isAuthenticated ? (
        <>
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
                {subject ? (
                  <Badge variant="secondary" className="border-white/20 bg-white/10 backdrop-blur">
                    {subject}
                  </Badge>
                ) : null}
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
        </>
      ) : (
        <div className="space-y-2 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-slate-200/80 backdrop-blur">
          <p className="font-medium text-white">Sign in to browse resources</p>
          <p className="text-xs text-slate-200/70">
            You can still craft and edit text cards. Sign in to search vetted resources and attach them to your lessons.
          </p>
        </div>
      )}
    </aside>
  );
};

export default LessonResourceSidebar;
