import { ArrowRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LessonPlanListItem } from "@/types/lesson-plans";

interface LessonCardProps {
  lesson: LessonPlanListItem;
  onSelect: (lesson: LessonPlanListItem) => void;
  openLabel: string;
  durationFormatter?: (minutes: number) => string;
}

const MAX_TAGS = 3;

function formatDuration(minutes: number, formatter?: (minutes: number) => string): string {
  if (formatter) {
    return formatter(minutes);
  }
  return `${minutes} min`;
}

export function LessonCard({ lesson, onSelect, openLabel, durationFormatter }: LessonCardProps) {
  const subjectBadges = lesson.subjects.slice(0, MAX_TAGS);
  const deliveryBadges = lesson.deliveryMethods.slice(0, MAX_TAGS);
  const techBadges = lesson.technologyTags.slice(0, MAX_TAGS);

  return (
    <Card className="group relative h-full overflow-hidden border border-border/60">
      <button
        type="button"
        onClick={() => onSelect(lesson)}
        aria-label={`${openLabel}: ${lesson.title}`}
        className="flex h-full w-full flex-col gap-4 p-6 text-left transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {lesson.stage ? <Badge variant="secondary">{lesson.stage}</Badge> : null}
          {subjectBadges.map((subject) => (
            <Badge key={subject} variant="outline">
              {subject}
            </Badge>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold leading-tight group-hover:text-primary">
            {lesson.title}
          </h3>
          {lesson.summary ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{lesson.summary}</p>
          ) : null}
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          {deliveryBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {deliveryBadges.map((mode) => (
                <Badge key={mode} variant="secondary" className="bg-primary/5 text-primary">
                  {mode}
                </Badge>
              ))}
            </div>
          ) : null}

          {techBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {techBadges.map((tag) => (
                <Badge key={tag} variant="outline" className="border-dashed">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between text-sm font-medium text-muted-foreground">
          {lesson.durationMinutes != null ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {formatDuration(lesson.durationMinutes, durationFormatter)}
            </span>
          ) : <span />}
          <span className="inline-flex items-center gap-2 text-primary">
            {openLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </button>
    </Card>
  );
}
