import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LessonBuilderActivity, LessonBuilderStep } from "@/types/lesson-builder";

interface StepCardCopy {
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  notesPlaceholder: string;
  activitiesTitle: string;
  removeActivity: string;
}

interface StepCardProps {
  step: LessonBuilderStep;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onChange: (updater: (step: LessonBuilderStep) => LessonBuilderStep) => void;
  onRemove?: () => void;
  copy: StepCardCopy;
}

export const StepCard = ({
  step,
  index,
  isActive,
  onSelect,
  onChange,
  onRemove,
  copy,
}: StepCardProps) => {
  const handleTitleChange = (value: string) => {
    onChange((current) => ({ ...current, title: value }));
  };

  const handleDescriptionChange = (value: string) => {
    onChange((current) => ({ ...current, description: value.length > 0 ? value : null }));
  };

  const handleNotesChange = (value: string) => {
    onChange((current) => ({ ...current, notes: value.length > 0 ? value : null }));
  };

  const handleRemoveActivity = (activity: LessonBuilderActivity) => {
    onChange((current) => ({
      ...current,
      activities: current.activities.filter((item) => item.id !== activity.id),
    }));
  };

  return (
    <Card
      className={`border ${isActive ? "border-primary" : "border-border"} transition-colors`}
      onClick={onSelect}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Badge variant={isActive ? "default" : "outline"}>{index + 1}</Badge>
          {onRemove ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              ×
            </Button>
          ) : null}
        </div>
        <Input
          value={step.title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder={copy.titlePlaceholder}
        />
        <Textarea
          value={step.description ?? ""}
          onChange={(event) => handleDescriptionChange(event.target.value)}
          placeholder={copy.descriptionPlaceholder}
          className="min-h-[100px]"
        />
        <Textarea
          value={step.notes ?? ""}
          onChange={(event) => handleNotesChange(event.target.value)}
          placeholder={copy.notesPlaceholder}
          className="min-h-[80px]"
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{copy.activitiesTitle}</p>
          {step.activities.length === 0 ? (
            <p className="text-xs text-muted-foreground">—</p>
          ) : (
            <div className="space-y-2">
              {step.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-border p-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    {activity.summary ? (
                      <p className="text-xs text-muted-foreground">{activity.summary}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveActivity(activity);
                    }}
                  >
                    {copy.removeActivity}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
