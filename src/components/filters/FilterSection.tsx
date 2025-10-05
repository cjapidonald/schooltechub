import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FilterSectionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  triggerClassName?: string;
  titleWrapperClassName?: string;
  contentClassName?: string;
}

export function FilterSection({
  title,
  children,
  defaultOpen = true,
  className,
  triggerClassName,
  titleWrapperClassName,
  contentClassName,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("space-y-3", className)}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 text-left text-sm font-semibold",
            triggerClassName,
          )}
          aria-expanded={isOpen}
        >
          <span className={cn("flex items-center gap-2", titleWrapperClassName)}>{title}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              isOpen ? "rotate-180" : "rotate-0",
            )}
            aria-hidden="true"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("mt-3", contentClassName ?? "space-y-2")}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
