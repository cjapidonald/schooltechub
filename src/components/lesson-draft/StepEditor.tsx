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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LessonStep } from "@/stores/lessonDraft";
import { useLessonDraftStore } from "@/stores/lessonDraft";
import { getResourcesByIds } from "@/lib/resources";
import type { Resource } from "@/types/resources";

interface StepEditorProps {
  onRequestResourceSearch: (stepId: string) => void;
  activeResourceStepId: string | null;
  isResourceSearchOpen: boolean;
}

interface StepFormProps {
  step: LessonStep;
  index: number;
  onRemove: (stepId: string) => void;
  onRequestResources: (stepId: string) => void;
  isResourceSearchOpen: boolean;
  isResourceSearchOpenForStep: boolean;
  resources: Resource[];
  pendingResourceIds: string[];
  missingResourceIds: string[];
  onTitleChange: (stepId: string, title: string) => void;
  onNotesChange: (stepId: string, notes: string) => void;
}

const StepForm = ({
  step,
  index,
  onRemove,
  onRequestResources,
  isResourceSearchOpen,
  isResourceSearchOpenForStep,
  resources,
  pendingResourceIds,
  missingResourceIds,
  onTitleChange,
  onNotesChange,
}: StepFormProps) => {
  const titleFieldId = `lesson-step-${step.id}-title`;
  const notesFieldId = `lesson-step-${step.id}-notes`;
  const helperId = `${titleFieldId}-helper`;
  const trimmedTitle = step.title.trim();
  const isTitleEmpty = trimmedTitle.length === 0;
  const displayTitle = trimmedTitle.length > 0 ? step.title : "New step";
  const notesValue = step.notes ?? "";

  const handleResourceClick = () => {
    if (!isResourceSearchOpen || !isResourceSearchOpenForStep) {
      onRequestResources(step.id);
    }
  };

  const handleTitleChange = (value: string) => {
    onTitleChange(step.id, value);
  };

  const handleTitleBlur = () => {
    if (step.title.trim().length === 0) {
      onTitleChange(step.id, "New step");
    }
  };

  const handleNotesChange = (value: string) => {
    onNotesChange(step.id, value);
  };

  const resourceCount = step.resourceIds.length;
  const resourceSummary = resourceCount
    ? `${resourceCount} resource${resourceCount === 1 ? "" : "s"} attached`
    : "No resources added yet";

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
          <p className="text-base font-semibold text-foreground">{displayTitle}</p>
          <p className="text-sm text-muted-foreground">{resourceSummary}</p>
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
                This step will be removed from your lesson plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(step.id)}>Remove step</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-3">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={titleFieldId}>Step {index + 1} title</Label>
            <Input
              id={titleFieldId}
              value={step.title}
              onChange={event => handleTitleChange(event.target.value)}
              onBlur={handleTitleBlur}
              aria-invalid={isTitleEmpty}
              aria-describedby={isTitleEmpty ? helperId : undefined}
              placeholder="Name this step"
            />
            {isTitleEmpty ? (
              <p id={helperId} className="text-xs text-destructive">
                Each step needs a title. We'll restore the default name if you leave it blank.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={notesFieldId}>Step {index + 1} notes</Label>
            <Textarea
              id={notesFieldId}
              rows={5}
              value={notesValue}
              onChange={event => handleNotesChange(event.target.value)}
              placeholder="Describe what happens during this part of the lesson."
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleResourceClick}
            onFocus={handleResourceClick}
            aria-expanded={isResourceSearchOpenForStep}
            aria-controls="lesson-draft-resource-search"
            aria-label={`Step ${index + 1} resources`}
          >
            {resourceCount > 0 ? "Add more resources" : "Add resources"}
          </Button>
          <span className="text-sm text-muted-foreground">{resourceSummary}</span>
        </div>

        {resources.length > 0 ? (
          <ul className="space-y-3">
            {resources.map(resource => (
              <li
                key={resource.id}
                className="rounded-md border border-border/60 bg-background/60 p-3"
              >
                <p className="text-sm font-medium text-foreground">{resource.title}</p>
                {resource.description ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {pendingResourceIds.length > 0 ? (
          <div className="space-y-2" aria-live="polite">
            {pendingResourceIds.map(id => (
              <Skeleton key={id} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : null}

        {missingResourceIds.length > 0 ? (
          <p className="rounded-md border border-dashed border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
            {missingResourceIds.length === 1
              ? "We couldn't load one of the attached resources. It may have been removed."
              : "Some resources could not be loaded. They may have been removed."}
          </p>
        ) : null}

        {resourceCount === 0 && pendingResourceIds.length === 0 && missingResourceIds.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
            Use the button above to attach links, files, or activities for this part of your lesson.
          </p>
        ) : null}
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
  const removeStep = useLessonDraftStore(state => state.removeStep);
  const renameStep = useLessonDraftStore(state => state.renameStep);
  const setStepNotes = useLessonDraftStore(state => state.setStepNotes);
  const [resourcesById, setResourcesById] = useState<Record<string, Resource | null>>({});

  const handleAddStep = () => {
    addStep();
  };

  const orderedSteps = useMemo(() => steps.map((step, index) => ({ step, index })), [steps]);

  const uniqueResourceIds = useMemo(() => {
    const ids = new Set<string>();
    steps.forEach(step => {
      step.resourceIds.forEach(resourceId => {
        if (typeof resourceId === "string" && resourceId.trim().length > 0) {
          ids.add(resourceId);
        }
      });
    });
    return Array.from(ids);
  }, [steps]);

  useEffect(() => {
    if (uniqueResourceIds.length === 0) {
      setResourcesById({});
      return;
    }

    setResourcesById(prev => {
      const next = { ...prev };
      let changed = false;

      Object.keys(next).forEach(id => {
        if (!uniqueResourceIds.includes(id)) {
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [uniqueResourceIds]);

  useEffect(() => {
    const missing = uniqueResourceIds.filter(id => resourcesById[id] === undefined);

    if (missing.length === 0) {
      return;
    }

    let isCancelled = false;

    getResourcesByIds(missing)
      .then(fetched => {
        if (isCancelled) {
          return;
        }

        setResourcesById(prev => {
          const next = { ...prev };
          const receivedIds = new Set<string>();

          fetched.forEach(resource => {
            next[resource.id] = resource;
            receivedIds.add(resource.id);
          });

          missing.forEach(id => {
            if (!receivedIds.has(id)) {
              next[id] = null;
            }
          });

          return next;
        });
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setResourcesById(prev => {
          const next = { ...prev };
          missing.forEach(id => {
            if (!(id in next)) {
              next[id] = null;
            }
          });
          return next;
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [uniqueResourceIds, resourcesById]);

  return (
    <Card aria-labelledby="lesson-draft-step-editor-heading">
      <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle id="lesson-draft-step-editor-heading" className="text-xl">
            Step editor
          </CardTitle>
          <CardDescription>
            Add learning resources to each part of your lesson. Use multiple steps to organise the flow.
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
                onRemove={removeStep}
                onRequestResources={onRequestResourceSearch}
                isResourceSearchOpen={isResourceSearchOpen}
                isResourceSearchOpenForStep={isResourceSearchOpen && activeResourceStepId === step.id}
                resources={step.resourceIds
                  .map(id => resourcesById[id])
                  .filter((resource): resource is Resource => Boolean(resource))}
                pendingResourceIds={step.resourceIds.filter(id => resourcesById[id] === undefined)}
                missingResourceIds={step.resourceIds.filter(id => resourcesById[id] === null)}
                onTitleChange={renameStep}
                onNotesChange={setStepNotes}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
