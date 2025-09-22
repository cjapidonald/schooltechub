import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LessonBuilderPlan } from "@/types/lesson-builder";

interface MetaBarCopy {
  titleLabel: string;
  summaryLabel: string;
  stageLabel: string;
  subjectsLabel: string;
  durationLabel: string;
  technologyLabel: string;
}

interface MetaBarProps {
  plan: LessonBuilderPlan;
  copy: MetaBarCopy;
  onUpdate: (updater: (plan: LessonBuilderPlan) => LessonBuilderPlan) => void;
}

export const MetaBar = ({ plan, copy, onUpdate }: MetaBarProps) => {
  const handleTitleChange = (value: string) => {
    onUpdate((current) => ({ ...current, title: value }));
  };

  const handleSummaryChange = (value: string) => {
    onUpdate((current) => ({ ...current, summary: value.length > 0 ? value : null }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{copy.titleLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Input
            value={plan.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder={copy.titleLabel}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{copy.summaryLabel}</p>
          <Textarea
            value={plan.summary ?? ""}
            onChange={(event) => handleSummaryChange(event.target.value)}
            placeholder={copy.summaryLabel}
            className="min-h-[120px]"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetaGroup label={copy.stageLabel} values={plan.stage ? [plan.stage] : []} />
          <MetaGroup label={copy.subjectsLabel} values={plan.subjects} />
          <MetaGroup
            label={copy.durationLabel}
            values={plan.durationMinutes != null ? [`${plan.durationMinutes} min`] : []}
          />
          <MetaGroup label={copy.technologyLabel} values={plan.technologyTags} />
        </div>
      </CardContent>
    </Card>
  );
};

interface MetaGroupProps {
  label: string;
  values: string[];
}

const MetaGroup = ({ label, values }: MetaGroupProps) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
    {values.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={value} variant="secondary">
            {value}
          </Badge>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">—</p>
    )}
  </div>
);
