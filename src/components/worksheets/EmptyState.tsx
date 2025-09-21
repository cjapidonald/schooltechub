import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  resetLabel: string;
  onReset: () => void;
}

export function EmptyState({ title, description, resetLabel, onReset }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" onClick={onReset}>
          {resetLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
