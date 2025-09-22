import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceCard } from "./ResourceCard";
import { useLessonDraftStore } from "@/stores/lessonDraft";
import { getResourcesByIds } from "@/lib/resources";
import type { Resource } from "@/types/resources";

const getStepDisplayTitle = (title: string) => {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : "New step";
};

type LessonPreviewProps = {
  headingId?: string;
};

export const LessonPreview = ({ headingId = "lesson-draft-preview-heading" }: LessonPreviewProps) => {
  const steps = useLessonDraftStore(state => state.draft.steps);
  const [resourcesById, setResourcesById] = useState<Record<string, Resource | null>>({});

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
    if (uniqueResourceIds.length === 0) {
      return;
    }

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
      .catch(error => {
        console.error(error);
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
    <Card aria-labelledby={headingId}>
      <CardHeader>
        <CardTitle id={headingId} className="text-xl">
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
            {steps.map((step, index) => {
              const trimmedNotes = step.notes?.trim() ?? "";
              const hasNotes = trimmedNotes.length > 0;
              const hasResourceIds = step.resourceIds.length > 0;
              const resourceCountLabel = step.resourceIds.length;

              const hasResolvedResources = step.resourceIds.some(id => Boolean(resourcesById[id]));
              const shouldRenderResources = hasResourceIds && (hasResolvedResources || step.resourceIds.some(id => resourcesById[id] === undefined));

              return (
                <li
                  key={step.id}
                  className="space-y-3 rounded-lg border border-border/70 bg-background/80 p-4"
                  data-testid={`lesson-draft-preview-step-${index + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      Step {index + 1}: {getStepDisplayTitle(step.title)}
                    </h3>
                    {hasResourceIds ? (
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {resourceCountLabel} resource{resourceCountLabel === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>

                  {hasNotes ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{trimmedNotes}</p>
                  ) : null}

                  {shouldRenderResources ? (
                    <div className="space-y-3">
                      {step.resourceIds.map(resourceId => {
                        const resource = resourcesById[resourceId];
                        if (resource === undefined) {
                          return (
                            <div
                              key={`${step.id}-${resourceId}-skeleton`}
                              className="flex gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 p-3"
                            >
                              <Skeleton className="h-16 w-24 rounded-md" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-2/3" />
                                <div className="flex gap-2">
                                  <Skeleton className="h-4 w-16 rounded-full" />
                                  <Skeleton className="h-4 w-16 rounded-full" />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (resource === null) {
                          return null;
                        }

                        return <ResourceCard key={`${step.id}-${resource.id}`} resource={resource} />;
                      })}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
