import { useEffect, useMemo } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { Copy, GripVertical, Redo2, Trash2, Undo2 } from "lucide-react";

import { usePlanEditor } from "@/contexts/PlanEditorContext";
import type { PlanStep } from "@/types/plan-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PlanCanvasProps {
  activeId: string | null;
  quickInsertRef: RefObject<HTMLInputElement>;
  onQuickInsert: (value: string) => void;
}

export function PlanCanvas({ activeId, quickInsertRef, onQuickInsert }: PlanCanvasProps) {
  const {
    plan,
    steps,
    targetMinutes,
    autosave,
    updatePlan,
    updateStep,
    removeStep,
    duplicateStep,
    setTargetMinutes,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePlanEditor();

  const { setNodeRef } = useDroppable({ id: "plan-canvas" });

  const totalMinutes = useMemo(
    () => steps.reduce((sum, step) => sum + (step.durationMinutes || 0), 0),
    [steps],
  );
  const remaining = targetMinutes - totalMinutes;
  const overflow = remaining < 0;

  useEffect(() => {
    const input = quickInsertRef.current;
    if (!input) {
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        input.focus();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [quickInsertRef]);

  const relativeSaved = useMemo(() => {
    if (!autosave.lastSavedAt) {
      return null;
    }
    const saved = new Date(autosave.lastSavedAt).getTime();
    const now = Date.now();
    const diffMinutes = Math.floor((now - saved) / 60000);
    if (diffMinutes <= 0) {
      return "Just now";
    }
    if (diffMinutes === 1) {
      return "1 minute ago";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) {
      return "1 hour ago";
    }
    return `${diffHours} hours ago`;
  }, [autosave.lastSavedAt]);

  const handleQuickInsert = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = event.currentTarget.value.trim();
      if (value) {
        onQuickInsert(value);
        event.currentTarget.value = "";
      }
    }
  };

  return (
    <section
      ref={setNodeRef}
      aria-label="Plan canvas"
      className="flex min-h-[32rem] flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm"
    >
      <header className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <label htmlFor="plan-title" className="text-sm font-medium text-muted-foreground">
              Plan title
            </label>
            <Input
              id="plan-title"
              value={plan.title}
              onChange={(event) =>
                updatePlan((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Add a lesson title"
              aria-describedby="plan-title-description"
            />
            <p id="plan-title-description" className="text-xs text-muted-foreground">
              Use descriptive titles to keep plans searchable.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border px-3 py-2 text-sm">
              <span className="font-semibold">Total:</span> {totalMinutes} min
              <span className="mx-2 text-muted-foreground">/</span>
              <span className={cn("font-semibold", overflow ? "text-destructive" : "text-emerald-600")}>Target: {targetMinutes} min</span>
              <div className="text-xs text-muted-foreground">
                {overflow
                  ? `Over by ${Math.abs(remaining)} minutes`
                  : `Remaining ${remaining} minute${remaining === 1 ? "" : "s"}`}
              </div>
            </div>
            {autosave.isSaving ? (
              <Badge variant="secondary">Saving…</Badge>
            ) : relativeSaved ? (
              <Badge variant="outline">Saved · {relativeSaved}</Badge>
            ) : null}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo"
              >
                <Undo2 className="mr-1 h-4 w-4" /> Undo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo"
              >
                <Redo2 className="mr-1 h-4 w-4" /> Redo
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="target-minutes" className="text-sm font-medium text-muted-foreground">
              Target duration (minutes)
            </label>
            <Input
              id="target-minutes"
              type="number"
              inputMode="numeric"
              min={0}
              value={targetMinutes}
              onChange={(event) => setTargetMinutes(Number(event.target.value) || 0)}
            />
          </div>
          <div>
            <label htmlFor="quick-insert" className="text-sm font-medium text-muted-foreground">
              Quick insert (press / to focus)
            </label>
            <Input
              id="quick-insert"
              ref={quickInsertRef}
              placeholder="Type a step title and press Enter"
              onKeyDown={handleQuickInsert}
            />
          </div>
        </div>
      </header>

      <SortableContext items={steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
        <ol role="list" className="space-y-3" aria-live="polite">
          {steps.length === 0 ? (
            <li className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Drag items from the sidebar or use the command palette (Ctrl/Cmd+K) to insert steps.
            </li>
          ) : null}
          {steps.map((step, index) => (
            <SortableStep
              key={step.id}
              step={step}
              index={index}
              isActive={activeId === step.id}
              onUpdate={(updater) => updateStep(step.id, updater)}
              onDuplicate={() => duplicateStep(step.id, index + 1)}
              onRemove={() => removeStep(step.id)}
            />
          ))}
        </ol>
      </SortableContext>
    </section>
  );
}

interface SortableStepProps {
  step: PlanStep;
  index: number;
  isActive: boolean;
  onUpdate: (updater: (step: PlanStep) => PlanStep) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function SortableStep({ step, index, isActive, onUpdate, onDuplicate, onRemove }: SortableStepProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
    data: {
      type: "step",
      stepId: step.id,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-background p-4 shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        isActive ? "ring-2 ring-ring" : "",
        isDragging ? "opacity-70" : "",
      )}
      role="listitem"
      aria-roledescription="Lesson plan step"
    >
      <article className="space-y-3">
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
            ref={setActivatorNodeRef}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <Input
                value={step.title}
                onChange={(event) =>
                  onUpdate((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                aria-label="Step title"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Duration</label>
                <input
                  type="range"
                  min={1}
                  max={120}
                  value={step.durationMinutes}
                  onChange={(event) =>
                    onUpdate((current) => ({
                      ...current,
                      durationMinutes: Number(event.target.value),
                    }))
                  }
                  aria-label="Duration in minutes"
                  className="h-2 w-24 cursor-pointer"
                />
                <Input
                  type="number"
                  value={step.durationMinutes}
                  min={1}
                  className="h-9 w-20"
                  onChange={(event) =>
                    onUpdate((current) => ({
                      ...current,
                      durationMinutes: Math.max(1, Number(event.target.value) || 0),
                    }))
                  }
                  aria-label="Duration value"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
            <Textarea
              value={step.notes ?? ""}
              placeholder="Notes, resources, or differentiation moves"
              onChange={(event) =>
                onUpdate((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
            />
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onDuplicate} aria-label="Duplicate step">
                <Copy className="mr-1 h-4 w-4" /> Duplicate
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={onRemove} aria-label="Delete step">
                <Trash2 className="mr-1 h-4 w-4" /> Remove
              </Button>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}
