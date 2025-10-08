import { useMemo, type CSSProperties } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ResourceCard } from "@/components/lesson-draft/ResourceCard";
import type {
  LessonPlanMetaDraft,
  LessonWorkspaceItem,
  LessonWorkspaceTextCard,
} from "../types";

const formatDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
};

interface WorkspaceSummaryProps {
  meta: LessonPlanMetaDraft;
}

const WorkspaceSummary = ({ meta }: WorkspaceSummaryProps) => {
  const rows = useMemo(
    () => [
      { label: "Teacher", value: meta.teacher ?? undefined },
      { label: "Lesson", value: meta.title.trim() ? meta.title : "Untitled lesson" },
      { label: "Subject", value: meta.subject ?? undefined },
      { label: "Date", value: formatDate(meta.date) ?? "Date not set" },
      { label: "Learning objective", value: meta.objective.trim() ? meta.objective : null },
      {
        label: "Success criteria",
        value: meta.successCriteria.trim() ? meta.successCriteria : null,
      },
    ],
    [meta.date, meta.objective, meta.subject, meta.successCriteria, meta.teacher, meta.title],
  );

  return (
    <div className="space-y-3 rounded-3xl border border-white/15 bg-white/10 p-4 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200/80">
        Lesson context
      </h3>
      <dl className="grid gap-3 text-sm text-slate-100 sm:grid-cols-2">
        {rows.map(row => (
          <div key={row.label} className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-300/70">
              {row.label}
            </dt>
            <dd className="whitespace-pre-wrap text-sm text-foreground/90">
              {row.value ? row.value : "Add details"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

interface SortableWorkspaceCardProps {
  item: LessonWorkspaceItem;
  textCard: LessonWorkspaceTextCard | null;
  onRemove: (workspaceId: string) => void;
  onUpdateTextCard: (textId: string, updates: { title?: string; content?: string }) => void;
}

const SortableWorkspaceCard = ({
  item,
  textCard,
  onRemove,
  onUpdateTextCard,
}: SortableWorkspaceCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data:
      item.type === "resource"
        ? {
            type: "workspace-card" as const,
            workspaceId: item.id,
            itemType: "resource" as const,
            resource: item.resource,
          }
        : {
            type: "workspace-card" as const,
            workspaceId: item.id,
            itemType: "text" as const,
            textCardId: item.textId,
          },
  });

  const style: CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-4 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur",
        isDragging && "ring-2 ring-sky-300/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-white/20 bg-white/10 p-2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-label="Reorder card"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <p className="text-sm font-semibold text-foreground">
            {item.type === "resource" ? item.resource.title : textCard?.title || "Text card"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          aria-label="Remove card from workspace"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {item.type === "resource" ? (
        <ResourceCard resource={item.resource} layout="horizontal" />
      ) : (
        <div className="space-y-3">
          <Input
            value={textCard?.title ?? ""}
            onChange={event => onUpdateTextCard(item.textId, { title: event.target.value })}
            placeholder="Title"
            className="border-white/20 bg-white/10 text-foreground placeholder:text-slate-200/60 backdrop-blur"
          />
          <Textarea
            value={textCard?.content ?? ""}
            onChange={event => onUpdateTextCard(item.textId, { content: event.target.value })}
            placeholder="Add lesson notes or reminders."
            rows={4}
            className="min-h-[120px] border-white/20 bg-white/10 text-foreground placeholder:text-slate-200/60 backdrop-blur"
          />
        </div>
      )}
    </div>
  );
};

interface LessonWorkspaceBoardProps {
  meta: LessonPlanMetaDraft;
  items: LessonWorkspaceItem[];
  textCards: LessonWorkspaceTextCard[];
  onRemoveItem: (workspaceId: string) => void;
  onUpdateTextCard: (textId: string, updates: { title?: string; content?: string }) => void;
}

export const LessonWorkspaceBoard = ({
  meta,
  items,
  textCards,
  onRemoveItem,
  onUpdateTextCard,
}: LessonWorkspaceBoardProps) => {
  const dropZone = useDroppable({
    id: "lesson-workspace",
    data: { type: "workspace-dropzone" as const },
  });

  const itemIds = useMemo(() => items.map(item => item.id), [items]);

  return (
    <div className="space-y-6">
      <WorkspaceSummary meta={meta} />
      <div
        ref={dropZone.setNodeRef}
        className={cn(
          "space-y-4 rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-slate-200/80 backdrop-blur",
          dropZone.isOver && "border-sky-300/70 bg-sky-500/10",
        )}
        aria-label="Lesson room drop zone"
      >
        {items.length === 0 ? (
          <p className="text-sm">
            Drag resource and text cards here to begin assembling your lesson wall. New cards snap to the top so you can build
            downward.
          </p>
        ) : (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {items.map(item => (
                <SortableWorkspaceCard
                  key={item.id}
                  item={item}
                  textCard={item.type === "text" ? textCards.find(card => card.id === item.textId) ?? null : null}
                  onRemove={onRemoveItem}
                  onUpdateTextCard={onUpdateTextCard}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
};

export default LessonWorkspaceBoard;
