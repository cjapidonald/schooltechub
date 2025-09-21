import { BookOpenCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  resetLabel: string;
  onReset: () => void;
}

export function EmptyState({ title, description, resetLabel, onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card/40 p-12 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BookOpenCheck className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button type="button" className="mt-6" onClick={onReset}>
        {resetLabel}
      </Button>
    </div>
  );
}
