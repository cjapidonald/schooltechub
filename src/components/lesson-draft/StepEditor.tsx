import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useDroppable, useDndMonitor } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
import { ResourceCard } from "@/components/lesson-draft/ResourceCard";
import { cn } from "@/lib/utils";

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
  resourceEntries: { id: string; resource: Resource | null }[];
  pendingResourceIds: string[];
  missingResourceIds: string[];
  onTitleChange: (stepId: string, title: string) => void;
  onNotesChange: (stepId: string, notes: string) => void;
  onRemoveResource: (stepId: string, resourceId: string) => void;
  onMoveResource: (stepId: string, resourceId: string, direction: "up" | "down") => void;
}

type LibraryResourceDragData = {
  type: "library-resource";
  resource: Resource;
  resourceId: string;
  source: "sidebar";
};

type StepResourceDragData = {
  type: "step-resource";
  stepId: string;
  resourceId: string;
  resource: Resource | null;
};

type StepDropData = {
  type: "step-dropzone";
  stepId: string;
};

interface SortableStepResourceCardProps {
  stepId: string;
  resourceId: string;
  resource: Resource;
  index: number;
  total: number;
  onRemove: (resourceId: string) => void;
  onMove: (resourceId: string, direction: "up" | "down") => void;
}

const SortableStepResourceCard = ({
  stepId,
  resourceId,
  resource,
  index,
  total,
  onRemove,
  onMove,
}: SortableStepResourceCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable<StepResourceDragData>({
      id: resourceId,
      data: {
        type: "step-resource",
        stepId,
        resourceId,
        resource,
      },
    });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  } as CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border/70 bg-background/80 p-3 shadow-sm",
        isDragging && "opacity-70",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex flex-col gap-3">
        <ResourceCard resource={resource} layout="horizontal" />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMove(resourceId, "up")}
            disabled={index === 0}
            aria-label={`Move ${resource.title} earlier in step`}
          >
            <ArrowUp className="mr-1.5 h-4 w-4" aria-hidden /> Move up
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMove(resourceId, "down")}
            disabled={index === total - 1}
            aria-label={`Move ${resource.title} later in step`}
          >
            <ArrowDown className="mr-1.5 h-4 w-4" aria-hidden /> Move down
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onRemove(resourceId)}
            aria-label={`Remove ${resource.title} from this step`}
          >
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden /> Remove
          </Button>
        </div>
      </div>
    </div>
  );
};

const StepForm = ({
  step,
  index,
  onRemove,
  onRequestResources,
  isResourceSearchOpen,
  isResourceSearchOpenForStep,
  resourceEntries,
  pendingResourceIds,
  missingResourceIds,
  onTitleChange,
  onNotesChange,
  onRemoveResource,
  onMoveResource,
}: StepFormProps) => {
  const titleFieldId = `lesson-step-${step.id}-title`;
  const notesFieldId = `lesson-step-${step.id}-notes`;
  const helperId = `${titleFieldId}-helper`;
  const trimmedTitle = step.title.trim();
  const isTitleEmpty = trimmedTitle.length === 0;
  const displayTitle = trimmedTitle.length > 0 ? step.title : "New step";
  const notesValue = step.notes ?? "";
  const dropZone = useDroppable<StepDropData>({
    id: `lesson-step-${step.id}-dropzone`,
    data: { type: "step-dropzone", stepId: step.id },
  });

  const loadedEntries = resourceEntries.filter(
    (entry): entry is { id: string; resource: Resource } => Boolean(entry.resource),
  );
  const dropMessage = resourceEntries.length
    ? "Drag to reorder cards or drop new ones from the library."
    : "Drag resource cards here or use the button below to browse the library.";

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
            {resourceCount > 0 ? "Add more resource cards" : "Add resource card"}
          </Button>
          <span className="text-sm text-muted-foreground">{resourceSummary}</span>
        </div>

        <div
          ref={dropZone.setNodeRef}
          className={cn(
            "space-y-3 rounded-lg border-2 border-dashed border-border/60 bg-muted/30 p-4",
            dropZone.isOver && "border-primary bg-primary/10",
          )}
          tabIndex={0}
          role="button"
          onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleResourceClick();
            }
          }}
          aria-label={`Resource drop zone for step ${index + 1}`}
        >
          <p className="text-sm text-muted-foreground">{dropMessage}</p>
          {loadedEntries.length > 0 ? (
            <SortableContext items={loadedEntries.map(entry => entry.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {loadedEntries.map((entry, entryIndex) => (
                  <SortableStepResourceCard
                    key={entry.id}
                    stepId={step.id}
                    resourceId={entry.id}
                    resource={entry.resource}
                    index={entryIndex}
                    total={loadedEntries.length}
                    onRemove={resourceId => onRemoveResource(step.id, resourceId)}
                    onMove={(resourceId, direction) => onMoveResource(step.id, resourceId, direction)}
                  />
                ))}
              </div>
            </SortableContext>
          ) : null}
        </div>

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
            Use the drop zone or the “Add resource card” button to attach links, files, or activities for this
            part of your lesson.
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
  const detachResource = useLessonDraftStore(state => state.detachResource);
  const insertStepResource = useLessonDraftStore(state => state.insertStepResource);
  const reorderStepResources = useLessonDraftStore(state => state.reorderStepResources);
  const moveStepResource = useLessonDraftStore(state => state.moveStepResource);
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

  useDndMonitor({
    onDragEnd: event => {
      const activeData = event.active.data.current as LibraryResourceDragData | StepResourceDragData | null;
      const overData = event.over?.data.current as StepDropData | StepResourceDragData | null;

      if (!activeData || !overData) {
        return;
      }

      if (activeData.type === "library-resource" && overData.type === "step-dropzone") {
        insertStepResource(overData.stepId, activeData.resourceId);
        return;
      }

      if (activeData.type !== "step-resource") {
        return;
      }

      const state = useLessonDraftStore.getState();
      const sourceStep = state.draft.steps.find(step => step.id === activeData.stepId);
      if (!sourceStep) {
        return;
      }

      if (overData.type === "step-resource") {
        const targetStep = state.draft.steps.find(step => step.id === overData.stepId);
        if (!targetStep) {
          return;
        }

        if (targetStep.id === sourceStep.id) {
          const fromIndex = sourceStep.resourceIds.indexOf(activeData.resourceId);
          const toIndex = sourceStep.resourceIds.indexOf(overData.resourceId);
          if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
            return;
          }
          reorderStepResources(sourceStep.id, arrayMove(sourceStep.resourceIds, fromIndex, toIndex));
          return;
        }

        const fromIndex = sourceStep.resourceIds.indexOf(activeData.resourceId);
        const targetIndex = targetStep.resourceIds.indexOf(overData.resourceId);
        if (fromIndex === -1 || targetIndex === -1) {
          return;
        }

        const nextSource = [...sourceStep.resourceIds];
        nextSource.splice(fromIndex, 1);
        reorderStepResources(sourceStep.id, nextSource);
        insertStepResource(targetStep.id, activeData.resourceId, targetIndex);
        return;
      }

      if (overData.type === "step-dropzone") {
        if (overData.stepId === sourceStep.id) {
          const fromIndex = sourceStep.resourceIds.indexOf(activeData.resourceId);
          if (fromIndex === -1 || fromIndex === sourceStep.resourceIds.length - 1) {
            return;
          }
          reorderStepResources(
            sourceStep.id,
            arrayMove(sourceStep.resourceIds, fromIndex, sourceStep.resourceIds.length - 1),
          );
          return;
        }

        const fromIndex = sourceStep.resourceIds.indexOf(activeData.resourceId);
        if (fromIndex === -1) {
          return;
        }

        const nextSource = [...sourceStep.resourceIds];
        nextSource.splice(fromIndex, 1);
        reorderStepResources(sourceStep.id, nextSource);
        insertStepResource(overData.stepId, activeData.resourceId);
      }
    },
  });

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
                resourceEntries={step.resourceIds.map(id => ({
                  id,
                  resource: resourcesById[id] ?? null,
                }))}
                pendingResourceIds={step.resourceIds.filter(id => resourcesById[id] === undefined)}
                missingResourceIds={step.resourceIds.filter(id => resourcesById[id] === null)}
                onTitleChange={renameStep}
                onNotesChange={setStepNotes}
                onRemoveResource={(stepId, resourceId) => detachResource(stepId, resourceId)}
                onMoveResource={(stepId, resourceId, direction) => moveStepResource(stepId, resourceId, direction)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
