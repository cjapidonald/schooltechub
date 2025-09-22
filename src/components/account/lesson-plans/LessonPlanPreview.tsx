import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getResourcesByIds } from "@/lib/resources";
import { isBlank } from "@/lib/isBlank";
import type { LessonPlan, LessonStep } from "@/types/platform";
import type { Resource } from "@/types/resources";

const formatDate = (value: string | null): string | null => {
  if (!value || isBlank(value)) {
    return null;
  }

  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsed);
  } catch (error) {
    console.error("Failed to format date", error);
    return value;
  }
};

const extractObjective = (meta: LessonPlan["meta"]): string | null => {
  if (!meta || typeof meta !== "object") {
    return null;
  }

  const candidate = (meta as Record<string, unknown>).objective;
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate;
  }

  const listCandidate = (meta as Record<string, unknown>).objectives;
  if (Array.isArray(listCandidate)) {
    const combined = listCandidate
      .map(value => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean)
      .join("\n");

    return combined.length > 0 ? combined : null;
  }

  return null;
};

export interface LessonPlanPreviewProps {
  plan: LessonPlan;
  steps: LessonStep[];
}

export const LessonPlanPreview = ({ plan, steps }: LessonPlanPreviewProps) => {
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
  }, [resourcesById, uniqueResourceIds]);

  const formattedDate = formatDate(plan.date);

  const metadata = [
    formattedDate ? { label: "Date", value: formattedDate } : null,
    !isBlank(plan.duration) ? { label: "Duration", value: String(plan.duration) } : null,
    !isBlank(plan.grouping) ? { label: "Grouping", value: String(plan.grouping) } : null,
    !isBlank(plan.deliveryMode) ? { label: "Delivery", value: String(plan.deliveryMode) } : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));

  const previewSteps = useMemo(() => {
    return steps
      .map((step, index) => {
        const trimmedNotes = (step.notes ?? "").trim();
        const pendingResourceIds = step.resourceIds.filter(id => resourcesById[id] === undefined);
        const resolvedResources = step.resourceIds
          .map(id => resourcesById[id])
          .filter((resource): resource is Resource => Boolean(resource));

        const hasPendingResources = pendingResourceIds.length > 0;
        const hasResolvedResources = resolvedResources.length > 0;
        const shouldRenderResources = hasPendingResources || hasResolvedResources;
        const hasNotes = !isBlank(trimmedNotes);

        if (!hasNotes && !shouldRenderResources) {
          return null;
        }

        return {
          id: step.id,
          index,
          title: (step.title ?? "").trim() || `Step ${index + 1}`,
          notes: trimmedNotes,
          pendingResourceIds,
          resources: resolvedResources,
        };
      })
      .filter(
        (entry): entry is {
          id: string;
          index: number;
          title: string;
          notes: string;
          pendingResourceIds: string[];
          resources: Resource[];
        } => Boolean(entry),
      );
  }, [resourcesById, steps]);

  const objective = extractObjective(plan.meta);
  const showLogo = typeof plan.logoUrl === "string" && plan.logoUrl.trim().length > 0;
  const showTitle = !isBlank(plan.title);

  const hasContent =
    showLogo ||
    showTitle ||
    !isBlank(objective) ||
    metadata.length > 0 ||
    previewSteps.length > 0;

  if (!hasContent) {
    return (
      <Card className="border-border/70 bg-background">
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground">
            Start outlining your lesson to generate a clean, shareable preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card aria-live="polite" className="border-border/70 bg-background">
      <CardContent className="space-y-6 pt-6">
        {(showLogo || showTitle || !isBlank(objective) || metadata.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {showLogo ? (
                <div className="mt-1 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted/40">
                  <img src={plan.logoUrl ?? undefined} alt="School logo" className="h-full w-full object-contain" />
                </div>
              ) : null}
              <div className="space-y-2">
                {showTitle ? (
                  <h2 className="text-2xl font-bold leading-tight text-foreground">{plan.title}</h2>
                ) : null}
                {!isBlank(objective) ? (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{objective}</p>
                ) : null}
                {metadata.length ? (
                  <div className="flex flex-wrap gap-2">
                    {metadata.map(item => (
                      <Badge key={item.label} variant="secondary">
                        {item.label}: {item.value}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {previewSteps.length ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Lesson steps</h3>
            <div className="space-y-4">
              {previewSteps.map(step => (
                <div
                  key={step.id}
                  className="space-y-3 rounded-lg border border-border/70 bg-background/80 p-4"
                  data-testid={`lesson-plan-preview-step-${step.index + 1}`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Step {step.index + 1}
                    </p>
                    <h4 className="text-base font-semibold text-foreground">{step.title}</h4>
                  </div>

                  {!isBlank(step.notes) ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{step.notes}</p>
                  ) : null}

                  {step.resources.length || step.pendingResourceIds.length ? (
                    <div className="space-y-2">
                      {step.resources.map(resource => {
                        const type = resource.type?.trim();
                        const subject = resource.subject?.trim();
                        return (
                          <div
                            key={`${step.id}-${resource.id}`}
                            className="flex items-center gap-3 rounded-md border border-border/60 bg-background p-3"
                          >
                            {resource.thumbnail_url ? (
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                <img
                                  src={resource.thumbnail_url}
                                  alt="Resource thumbnail"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : null}
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-semibold text-foreground line-clamp-2">{resource.title}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {!isBlank(type) ? <span>{type}</span> : null}
                                {!isBlank(subject) ? <span>{subject}</span> : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {step.pendingResourceIds.map(resourceId => (
                        <div
                          key={`${step.id}-${resourceId}-pending`}
                          className="flex gap-3 rounded-md border border-dashed border-border/60 bg-muted/40 p-3"
                        >
                          <Skeleton className="h-12 w-12 flex-shrink-0 rounded-md" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default LessonPlanPreview;
