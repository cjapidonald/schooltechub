import type { PlanPartTemplate } from "@/contexts/PlanEditorContext";
import { PLAN_PART_GROUPS } from "@/lib/plan-parts";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface PlanCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: PlanPartTemplate) => void;
}

export function PlanCommandPalette({ open, onOpenChange, onSelectTemplate }: PlanCommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search actions..." />
      <CommandList aria-label="Plan actions">
        <CommandEmpty>No matching actions</CommandEmpty>
        {PLAN_PART_GROUPS.map((group) => (
          <CommandGroup key={group.id} heading={group.label}>
            {group.description ? (
              <p className="px-2 pb-1 text-xs text-muted-foreground">{group.description}</p>
            ) : null}
            {group.parts.map((part) => (
              <CommandItem
                key={part.id}
                value={`${group.id}-${part.id}`}
                onSelect={() => {
                  onSelectTemplate(part);
                  onOpenChange(false);
                }}
                className="flex flex-col gap-1 text-left"
              >
                <span className="font-medium">{part.title}</span>
                {part.description ? (
                  <span className="text-xs text-muted-foreground">{part.description}</span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
