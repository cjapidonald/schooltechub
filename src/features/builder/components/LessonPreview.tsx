import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useBuilder } from "../context/BuilderContext";
import { isBlank } from "../utils/isBlank";

const formatDate = (input: string | null) => {
  if (!input || isBlank(input)) {
    return null;
  }

  try {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      return input;
    }

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsed);
  } catch (error) {
    console.error(error);
    return input;
  }
};

const collectUniqueValues = (values: string[], { omit }: { omit?: string[] } = {}) => {
  const normalizedOmissions = new Set((omit ?? []).map(value => value.toLowerCase()));

  return Array.from(
    new Set(
      values
        .map(value => value?.trim())
        .filter(value => value && !normalizedOmissions.has(value.toLowerCase())),
    ),
  ).join(", ");
};

export const LessonPreview = () => {
  const { state } = useBuilder();

  const formattedDate = useMemo(() => formatDate(state.lessonDate), [state.lessonDate]);

  const aggregatedDuration = useMemo(
    () => collectUniqueValues(state.steps.map(step => step.duration), { omit: [""] }),
    [state.steps],
  );

  const aggregatedGrouping = useMemo(
    () => collectUniqueValues(state.steps.map(step => step.grouping), { omit: ["", "Whole Class"] }),
    [state.steps],
  );

  const aggregatedDelivery = useMemo(
    () => collectUniqueValues(state.steps.map(step => step.deliveryMode), { omit: ["", "In-person"] }),
    [state.steps],
  );

  const metadata = [
    formattedDate ? { label: "Date", value: formattedDate } : null,
    !isBlank(aggregatedDuration) ? { label: "Duration", value: aggregatedDuration } : null,
    !isBlank(aggregatedGrouping) ? { label: "Grouping", value: aggregatedGrouping } : null,
    !isBlank(aggregatedDelivery) ? { label: "Delivery", value: aggregatedDelivery } : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));

  const previewSteps = useMemo(
    () =>
      state.steps.filter(step => {
        const hasNotes = !isBlank(step.notes);
        const hasResources = step.resources.some(resource => !isBlank(resource.title));
        return hasNotes || hasResources;
      }),
    [state.steps],
  );

  const title = state.title.trim();
  const showTitle = !isBlank(title) && title.toLowerCase() !== "untitled lesson";
  const showObjective = !isBlank(state.objective);
  const showLogo = !isBlank(state.schoolLogoUrl);

  const hasContent = showTitle || showObjective || showLogo || metadata.length > 0 || previewSteps.length > 0;

  return (
    <Card className="border-border/70 bg-background">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl font-semibold">Live lesson preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Watch your lesson take shape in real-time. Empty fields stay hidden here.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasContent ? (
          <p className="text-sm text-muted-foreground">
            Start filling in the lesson blueprint to generate a clean preview for teachers.
          </p>
        ) : (
          <div className="space-y-8">
            {(showLogo || showTitle || showObjective) && (
              <div className="flex items-start gap-4">
                {showLogo ? (
                  <div className="mt-1 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted/40">
                    <img src={state.schoolLogoUrl ?? undefined} alt="School logo" className="h-full w-full object-contain" />
                  </div>
                ) : null}

                <div className="space-y-2">
                  {showTitle ? <h2 className="text-2xl font-bold leading-tight text-foreground">{title}</h2> : null}
                  {showObjective ? <p className="text-sm text-muted-foreground">{state.objective.trim()}</p> : null}
                </div>
              </div>
            )}

            {metadata.length ? (
              <div className="flex flex-wrap gap-2">
                {metadata.map(item => (
                  <Badge key={item.label} variant="secondary">
                    {item.label}: {item.value}
                  </Badge>
                ))}
              </div>
            ) : null}

            {previewSteps.length ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lesson steps</h3>
                <div className="space-y-4">
                  {previewSteps.map(step => {
                    const duration = step.duration.trim();
                    const grouping = step.grouping.trim();
                    const delivery = step.deliveryMode.trim();
                    const notes = step.notes.trim();

                    const badges = [
                      !isBlank(duration) ? `Duration: ${duration}` : null,
                      !isBlank(grouping) && grouping.toLowerCase() !== "whole class" ? grouping : null,
                      !isBlank(delivery) && delivery.toLowerCase() !== "in-person" ? delivery : null,
                    ].filter((entry): entry is string => Boolean(entry));

                    const resources = step.resources.filter(resource => !isBlank(resource.title));

                    return (
                      <div key={step.id} className="space-y-3 rounded-lg border border-border/70 bg-background/80 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-base font-semibold text-foreground">{step.title.trim() || "New step"}</h4>
                            {badges.length ? (
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {badges.map(item => (
                                  <span key={item} className="rounded-full bg-muted px-2 py-0.5">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {!isBlank(notes) ? (
                          <p className="text-sm text-muted-foreground">{notes}</p>
                        ) : null}

                        {resources.length ? (
                          <div className="space-y-2">
                            {resources.map(resource => {
                              const thumb = (resource as { thumbnailUrl?: string | null }).thumbnailUrl ?? null;
                              const subject = resource.subject?.trim();
                              const type = resource.resourceType?.trim();

                              return (
                                <div
                                  key={resource.id}
                                  className="flex items-center gap-3 rounded-md border border-border/60 bg-background p-3"
                                >
                                  {thumb ? (
                                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                      <img src={thumb} alt="Resource thumbnail" className="h-full w-full object-cover" />
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
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonPreview;
