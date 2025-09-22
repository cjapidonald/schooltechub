import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LessonStep } from "@/stores/lessonDraft";
import { useLessonDraftStore } from "@/stores/lessonDraft";

interface StepEditorProps {
  onRequestResourceSearch: (stepId: string) => void;
  activeResourceStepId: string | null;
  isResourceSearchOpen: boolean;
}

interface StepFormProps {
  step: LessonStep;
  index: number;
  onRename: (stepId: string, value: string) => void;
  onCommitName: (stepId: string) => void;
  onRemove: (stepId: string) => void;
  onUpdateNotes: (stepId: string, value: string) => void;
  onRequestResources: (stepId: string) => void;
  isResourceSearchOpen: boolean;
  isResourceSearchOpenForStep: boolean;
}

const STEP_TITLE_LIMIT = 80;

const getStepDisplayTitle = (title: string) => {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : "New step";
};

const StepForm = ({
  step,
  index,
  onRename,
  onCommitName,
  onRemove,
  onUpdateNotes,
  onRequestResources,
  isResourceSearchOpen,
  isResourceSearchOpenForStep,
}: StepFormProps) => {
  const [isTitleTouched, setIsTitleTouched] = useState(false);

  const trimmedTitle = step.title.trim();
  const showTitleError = isTitleTouched && trimmedTitle.length === 0;
  const remainingCharacters = Math.max(0, STEP_TITLE_LIMIT - step.title.length);
  const helperId = `step-${step.id}-title-help`;

  useEffect(() => {
    if (isTitleTouched && trimmedTitle.length > 0) {
      setIsTitleTouched(false);
    }
  }, [isTitleTouched, trimmedTitle]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.slice(0, STEP_TITLE_LIMIT);
    setIsTitleTouched(true);
    onRename(step.id, nextValue);
  };

  const handleTitleBlur = () => {
    onCommitName(step.id);
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNotes(step.id, event.target.value);
  };

  const handleResourceFocus = () => {
    if (!isResourceSearchOpen || !isResourceSearchOpenForStep) {
      onRequestResources(step.id);
    }
  };

  const handleResourceKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRequestResources(step.id);
    }
  };

  const resourceSummary = step.resourceIds.length
    ? `${step.resourceIds.length} resource${step.resourceIds.length === 1 ? "" : "s"} added`
    : "";

  return (
    <section
      className="space-y-4 rounded-lg border border-border/60 bg-background/80 p-4"
      aria-labelledby={`step-${step.id}-label`}
      data-testid={`lesson-draft-step-${index + 1}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p
            id={`step-${step.id}-label`}
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Step {index + 1}
          </p>
          <p className="text-base font-semibold text-foreground">{getStepDisplayTitle(step.title)}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove step ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this step?</AlertDialogTitle>
              <AlertDialogDescription>
                “{getStepDisplayTitle(step.title)}” will be removed from your lesson plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(step.id)}>Remove step</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`step-${step.id}-title`}>Step {index + 1} title</Label>
        <Input
          id={`step-${step.id}-title`}
          data-testid={`lesson-draft-step-${index + 1}-title`}
          value={step.title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          aria-invalid={showTitleError}
          aria-describedby={helperId}
          maxLength={STEP_TITLE_LIMIT}
        />
        <p
          id={helperId}
          className={`text-sm ${showTitleError ? "text-destructive" : "text-muted-foreground"}`}
        >
          {showTitleError
            ? "Each step needs a title. Try something descriptive."
            : `${remainingCharacters} characters remaining`}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`step-${step.id}-notes`}>Step {index + 1} notes (optional)</Label>
        <Textarea
          id={`step-${step.id}-notes`}
          value={step.notes ?? ""}
          onChange={handleNotesChange}
          placeholder="Add facilitation notes, differentiation strategies, or reminders..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`step-${step.id}-resources`}>Step {index + 1} resources</Label>
        <Input
          id={`step-${step.id}-resources`}
          value={resourceSummary}
          placeholder="Add resources"
          onFocus={handleResourceFocus}
          onClick={handleResourceFocus}
          onKeyDown={handleResourceKeyDown}
          readOnly
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={isResourceSearchOpenForStep}
          aria-controls="lesson-draft-resource-search"
        />
        <p className="text-sm text-muted-foreground">
          Search our library to attach links, files, or activities to this step.
        </p>
      </div>
    </section>
  );
};

export const StepEditor = ({
  onRequestResourceSearch,
  activeResourceStepId,
  isResourceSearchOpen,
}: StepEditorProps) => {
  const steps = useLessonDraftStore(state => state.draft.steps);
  const addStep = useLessonDraftStore(state => state.addStep);
  const renameStep = useLessonDraftStore(state => state.renameStep);
  const removeStep = useLessonDraftStore(state => state.removeStep);
  const setStepNotes = useLessonDraftStore(state => state.setStepNotes);

  const [pendingFocusStepId, setPendingFocusStepId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFocusStepId) {
      return;
    }

    const input = document.getElementById(`step-${pendingFocusStepId}-title`) as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
      setPendingFocusStepId(null);
    }
  }, [pendingFocusStepId, steps]);

  const handleAddStep = () => {
    const step = addStep();
    setPendingFocusStepId(step.id);
  };

  const handleCommitName = (stepId: string) => {
    const step = steps.find(item => item.id === stepId);
    if (!step) {
      return;
    }
    const trimmed = step.title.trim();
    if (trimmed.length === 0) {
      renameStep(stepId, "New step");
      return;
    }
    if (trimmed !== step.title) {
      renameStep(stepId, trimmed);
    }
  };

  const orderedSteps = useMemo(() => steps.map((step, index) => ({ step, index })), [steps]);

  return (
    <Card aria-labelledby="lesson-draft-step-editor-heading">
      <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle id="lesson-draft-step-editor-heading" className="text-xl">
            Step editor
          </CardTitle>
          <CardDescription>
            Build your learning sequence and capture teacher-facing notes for each moment.
          </CardDescription>
        </div>
        <Button type="button" onClick={handleAddStep} data-testid="lesson-draft-add-step">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add step
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {orderedSteps.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/40 p-6 text-sm text-muted-foreground">
            No steps yet. Use the “Add step” button to start outlining your lesson.
          </p>
        ) : (
          <div className="space-y-6">
            {orderedSteps.map(({ step, index }) => (
              <StepForm
                key={step.id}
                step={step}
                index={index}
                onRename={renameStep}
                onCommitName={handleCommitName}
                onRemove={removeStep}
                onUpdateNotes={setStepNotes}
                onRequestResources={onRequestResourceSearch}
                isResourceSearchOpen={isResourceSearchOpen}
                isResourceSearchOpenForStep={isResourceSearchOpen && activeResourceStepId === step.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
