import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import type { BuilderState, BuilderStep } from "../types";

interface LessonPreviewProps {
  state: BuilderState;
}

const hasStepDetails = (step: BuilderStep) => {
  const normalizedTitle = step.title.trim().toLowerCase();
  const hasCustomTitle = normalizedTitle.length > 0 && normalizedTitle !== "new step";
  const hasLearningGoals = step.learningGoals.trim().length > 0;
  const hasDuration = step.duration.trim().length > 0;
  const hasNotes = step.notes.trim().length > 0;
  const hasResources = step.resources.length > 0;
  const hasCustomGrouping = step.grouping.trim().length > 0 && step.grouping !== "Whole Class";
  const hasCustomDelivery = step.deliveryMode.trim().length > 0 && step.deliveryMode !== "In-person";
  return (
    hasCustomTitle ||
    hasLearningGoals ||
    hasDuration ||
    hasNotes ||
    hasResources ||
    hasCustomGrouping ||
    hasCustomDelivery
  );
};

export const LessonPreview = ({ state }: LessonPreviewProps) => {
  const formattedDate = useMemo(() => {
    if (!state.lessonDate) return null;
    try {
      const parsed = new Date(state.lessonDate);
      if (Number.isNaN(parsed.getTime())) {
        return state.lessonDate;
      }
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(parsed);
    } catch (error) {
      console.error(error);
      return state.lessonDate;
    }
  }, [state.lessonDate]);

  const metadata = [
    state.stage.trim().length ? { label: "Stage", value: state.stage } : null,
    state.subject.trim().length ? { label: "Subject", value: state.subject } : null,
    formattedDate ? { label: "Date", value: formattedDate } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const stepsWithContent = state.steps.filter(hasStepDetails);
  const hasContent =
    (state.title && state.title.trim().length > 0 && state.title.trim() !== "Untitled Lesson") ||
    state.objective.trim().length > 0 ||
    metadata.length > 0 ||
    stepsWithContent.length > 0 ||
    state.schoolLogoUrl;

  return (
    <Card className="border-border/70 bg-background">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Live lesson preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Updates instantly as you add lesson details. Empty fields are hidden from this view.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasContent ? (
          <p className="text-sm text-muted-foreground">
            Begin filling in your lesson details to see a formatted preview for teachers.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {state.schoolLogoUrl ? (
                    <div className="mt-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted/40">
                      <img src={state.schoolLogoUrl} alt="School logo" className="h-full w-full object-contain" />
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold leading-tight text-foreground">
                      {state.title.trim() || "Untitled lesson"}
                    </h2>
                    {state.objective.trim().length ? (
                      <p className="text-sm text-muted-foreground">{state.objective.trim()}</p>
                    ) : null}
                  </div>
                </div>
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

            {stepsWithContent.length ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lesson structure</h3>
                <div className="space-y-4">
                  {stepsWithContent.map((step, index) => {
                    const badges: string[] = [];
                    if (step.duration.trim().length) {
                      badges.push(`Duration: ${step.duration.trim()}`);
                    }
                    if (step.grouping.trim().length) {
                      badges.push(step.grouping.trim());
                    }
                    if (step.deliveryMode.trim().length) {
                      badges.push(step.deliveryMode.trim());
                    }

                    return (
                      <div key={step.id} className="space-y-4 rounded-lg border border-border/70 bg-background/60 p-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h4 className="text-base font-semibold text-foreground">
                                {step.title.trim() || `Step ${index + 1}`}
                              </h4>
                              {step.learningGoals.trim().length ? (
                                <p className="text-sm text-muted-foreground">{step.learningGoals.trim()}</p>
                              ) : null}
                            </div>
                            {badges.length ? (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {badges.map(value => (
                                  <Badge key={value} variant="outline">
                                    {value}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {step.resources.length ? (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">Resources</p>
                            <div className="space-y-3">
                              {step.resources.map(resource => (
                                <div
                                  key={resource.id}
                                  className="space-y-2 rounded-md border border-border/60 bg-background/60 p-3"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground">{resource.title}</p>
                                    {resource.resourceType ? (
                                      <Badge variant="secondary">{resource.resourceType}</Badge>
                                    ) : null}
                                    {resource.format ? <Badge variant="outline">{resource.format}</Badge> : null}
                                  </div>
                                  {resource.description ? (
                                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                                  ) : null}
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {resource.subject ? <Badge variant="outline">{resource.subject}</Badge> : null}
                                    {resource.gradeLevel ? <Badge variant="outline">{resource.gradeLevel}</Badge> : null}
                                    {resource.tags.map(tag => (
                                      <Badge key={tag} variant="secondary">
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {step.notes.trim().length ? (
                          <div className="rounded-md bg-muted/50 p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Offline fallback</p>
                            <p className="text-sm text-muted-foreground">{step.notes.trim()}</p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {stepsWithContent.length && state.steps.some(step => step.resources.length) ? (
              <Separator />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonPreview;
