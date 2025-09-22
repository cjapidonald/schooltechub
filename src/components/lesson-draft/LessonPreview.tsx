import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLessonDraftStore } from "@/stores/lessonDraft";

const getStepDisplayTitle = (title: string) => {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : "New step";
};

export const LessonPreview = () => {
  const steps = useLessonDraftStore(state => state.draft.steps);

  return (
    <Card aria-labelledby="lesson-draft-preview-heading">
      <CardHeader>
        <CardTitle id="lesson-draft-preview-heading" className="text-xl">
          Lesson preview
        </CardTitle>
        <CardDescription>
          See how your steps and notes will appear when you publish your plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/40 p-6 text-sm text-muted-foreground">
            Add learning steps to generate a live preview of your lesson.
          </p>
        ) : (
          <ol className="space-y-4" aria-live="polite">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className="space-y-2 rounded-lg border border-border/70 bg-background/80 p-4"
                data-testid={`lesson-draft-preview-step-${index + 1}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    Step {index + 1}: {getStepDisplayTitle(step.title)}
                  </h3>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {step.resourceIds.length} resource{step.resourceIds.length === 1 ? "" : "s"}
                  </span>
                </div>
                {step.notes ? (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{step.notes}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">No notes added for this step yet.</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
