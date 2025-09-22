import { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";

import type { PlanPartTemplate } from "@/contexts/PlanEditorContext";
import { PLAN_PART_GROUPS } from "@/lib/plan-parts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PartsSidebarProps {
  onSelectTemplate: (template: PlanPartTemplate) => void;
}

function DraggableTemplate({ template, onSelect }: { template: PlanPartTemplate; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: {
      type: "part",
      template,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-background p-4 transition hover:border-primary focus-within:ring-2 focus-within:ring-ring",
        isDragging ? "opacity-60" : "",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{template.title}</p>
          {template.description ? (
            <p className="text-xs text-muted-foreground">{template.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">Default: {template.defaultDuration} min</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={onSelect}
          aria-label={`Insert ${template.title}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground transition hover:border-primary"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${template.title}`}
      >
        Drag to canvas
      </button>
    </li>
  );
}

export function PartsSidebar({ onSelectTemplate }: PartsSidebarProps) {
  const groups = useMemo(() => PLAN_PART_GROUPS, []);

  return (
    <aside className="flex h-full flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm" aria-label="Plan parts">
      <header>
        <h2 className="text-lg font-semibold">Parts Library</h2>
        <p className="text-sm text-muted-foreground">
          Drag building blocks into the canvas or click to insert instantly.
        </p>
      </header>
      <div className="flex-1 space-y-6 overflow-y-auto pr-1" role="list">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`group-${group.id}`} className="space-y-3">
            <div>
              <h3 id={`group-${group.id}`} className="text-sm font-semibold uppercase text-muted-foreground">
                {group.label}
              </h3>
              {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
            </div>
            <ul className="space-y-3" role="list">
              {group.parts.map((part) => (
                <DraggableTemplate key={part.id} template={part} onSelect={() => onSelectTemplate(part)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
