import { Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { LessonBuilderStep } from "@/types/lesson-builder";
import { StepCard } from "./StepCard";

interface PlanCanvasCopy {
  title: string;
  addStep: string;
  empty: string;
  stepCopy: {
    titlePlaceholder: string;
    descriptionPlaceholder: string;
    notesPlaceholder: string;
    activitiesTitle: string;
    removeActivity: string;
  };
}

interface PlanCanvasProps {
  steps: LessonBuilderStep[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onAddStep: () => void;
  onRemoveStep: (id: string) => void;
  onStepChange: (id: string, updater: (step: LessonBuilderStep) => LessonBuilderStep) => void;
  copy: PlanCanvasCopy;
}

export const PlanCanvas = ({
  steps,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onRemoveStep,
  onStepChange,
  copy,
}: PlanCanvasProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">{copy.title}</CardTitle>
        <Button size="sm" onClick={onAddStep}>
          {copy.addStep}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Fragment key={step.id}>
                <StepCard
                  step={step}
                  index={index}
                  isActive={step.id === selectedStepId}
                  onSelect={() => onSelectStep(step.id)}
                  onRemove={() => onRemoveStep(step.id)}
                  onChange={(updater) => onStepChange(step.id, updater)}
                  copy={copy.stepCopy}
                />
                {index < steps.length - 1 ? <Separator /> : null}
              </Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
