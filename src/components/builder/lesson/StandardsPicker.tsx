import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { LessonBuilderStandard } from "@/types/lesson-builder";

interface StandardsCopy {
  title: string;
  empty: string;
  selectedLabel: string;
}

interface StandardsPickerProps {
  available: LessonBuilderStandard[];
  selected: LessonBuilderStandard[];
  onToggle: (standard: LessonBuilderStandard) => void;
  copy: StandardsCopy;
}

export const StandardsPicker = ({ available, selected, onToggle, copy }: StandardsPickerProps) => {
  const selectedIds = new Set(selected.map((standard) => standard.id));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="space-y-3">
            {available.map((standard) => (
              <label key={standard.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
                <Checkbox
                  checked={selectedIds.has(standard.id)}
                  onCheckedChange={() => onToggle(standard)}
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{standard.code}</p>
                  <p className="text-xs text-muted-foreground">{standard.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {standard.subject ? `${standard.subject}` : copy.selectedLabel}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
