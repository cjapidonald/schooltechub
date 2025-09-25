import { Fragment, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  listUpcomingLessonPlans,
  type UpcomingLessonPlanListItem,
} from "@/lib/data/lesson-plans";
import { cn } from "@/lib/utils";

const formatLessonDate = (value: string | null): string => {
  if (!value) {
    return "Date TBD";
  }

  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return format(parsed, "MMM d, yyyy");
  } catch (error) {
    return value;
  }
};

const createLessonSummary = (lesson: UpcomingLessonPlanListItem): string[] => {
  const date = formatLessonDate(lesson.date);
  const classTitle = lesson.classTitle.trim();
  const lessonTitle = lesson.lessonTitle.trim();

  return [date, classTitle, lessonTitle].filter(segment => segment.length > 0);
};

export type UpcomingLessonsCardProps = {
  isEnabled: boolean;
  className?: string;
};

export const UpcomingLessonsCard = ({ isEnabled, className }: UpcomingLessonsCardProps) => {
  const { language } = useLanguage();

  const query = useQuery({
    queryKey: ["upcoming-lesson-plans"],
    queryFn: () => listUpcomingLessonPlans(5),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
  });

  const lessons = query.data ?? [];

  const handleRetry = () => {
    query.refetch();
  };

  let content: ReactNode;

  if (query.isPending) {
    content = (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-muted" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  } else if (query.isError) {
    const message =
      query.error instanceof Error ? query.error.message : "Unable to load upcoming lessons.";

    content = (
      <Alert variant="destructive">
        <AlertTitle>Unable to load upcoming lessons</AlertTitle>
        <AlertDescription>
          {message}
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  } else if (lessons.length === 0) {
    content = <p className="text-sm text-muted-foreground">No upcoming lessons scheduled.</p>;
  } else {
    content = (
      <ul className="space-y-2">
        {lessons.map(lesson => {
          const summarySegments = createLessonSummary(lesson);
          const lessonBuilderPath = getLocalizedPath(
            `/lesson-builder?id=${encodeURIComponent(lesson.lessonId)}`,
            language,
          );

          return (
            <li key={`${lesson.lessonId}-${lesson.date ?? "no-date"}`}>
              <Link
                to={lessonBuilderPath}
                className="group flex items-center gap-3 rounded-md border border-transparent p-3 transition hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  {summarySegments.map((segment, index) => {
                    const key = `${segment}-${index}`;
                    const textClass =
                      index === 0 || index === summarySegments.length - 1
                        ? "font-medium text-foreground"
                        : "text-foreground";

                    return (
                      <Fragment key={key}>
                        <span className={textClass}>{segment}</span>
                        {index < summarySegments.length - 1 ? (
                          <span className="text-muted-foreground" aria-hidden="true">
                            ·
                          </span>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Card
      className={cn(
        "border border-primary/30 bg-background/80 shadow-[0_0_30px_hsl(var(--glow-primary)/0.15)]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold">Upcoming lessons</CardTitle>
          <CardDescription>Stay ready for what&apos;s next on your teaching calendar.</CardDescription>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_25px_hsl(var(--glow-primary)/0.2)]">
          <CalendarDays className="h-5 w-5 animate-pulse-glow" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
