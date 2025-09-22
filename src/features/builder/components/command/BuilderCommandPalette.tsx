import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface BuilderCommandPaletteProps {
  onAddStep: () => void;
  onDuplicateStep: () => void;
  onFocusSearch: () => void;
}

export const BuilderCommandPalette = ({ onAddStep, onDuplicateStep, onFocusSearch }: BuilderCommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (action: () => void, message: string) => {
    action();
    toast({ description: message, duration: 1500 });
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} data-testid="builder-command-palette">
      <DialogTitle className="sr-only">Lesson builder commands</DialogTitle>
      <DialogDescription className="sr-only">Use the search field or arrow keys to run a quick action.</DialogDescription>
      <CommandInput placeholder="Type a command or search" />
      <CommandList>
        <CommandEmpty>No command found.</CommandEmpty>
        <CommandGroup heading="Lesson builder">
          <CommandItem
            onSelect={() => handleSelect(onAddStep, "Added a new step to the lesson")}
            data-testid="command-add-step"
          >
            Add step
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(onDuplicateStep, "Duplicated the last step")}
            data-testid="command-duplicate-step"
          >
            Duplicate last step
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(onFocusSearch, "Focus the activity search")}
            data-testid="command-focus-search"
          >
            Focus activity search
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
