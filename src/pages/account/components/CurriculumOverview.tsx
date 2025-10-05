import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, Plus, BookOpen, Layers } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMyClasses } from "@/hooks/useMyClasses";
import { listCurriculumItems, listCurriculumLessonLinks } from "@/lib/data/curriculum";
import type { CurriculumItem, CurriculumLessonLink } from "@/types/platform";

interface CurriculumOverviewProps {
  onOpenPlanner: (options?: { classId?: string }) => void;
}

interface LessonPreview {
  id: string;
  title: string;
  date: string | null;
  parsedDate: Date | null;
  status: CurriculumLessonLink["status"] | "draft";
}

interface CurriculumBoardSummary {
  id: string;
  classId: string | null;
  title: string;
  subject: string | null;
  stage: string | null;
  lessonCount: number;
  statusCounts: Partial<Record<CurriculumLessonLink["status"], number>>;
  lessons: LessonPreview[];
}

const statusLabels: Record<CurriculumLessonLink["status"], string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const parseDate = (value: string | null): Date | null => {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    console.warn("Could not parse curriculum date", error, value);
    return null;
  }
};

const getBoardId = (item: CurriculumItem): string => {
  return item.classId && item.classId.length > 0 ? item.classId : `unassigned-${item.subject ?? "curriculum"}`;
};

const boardTitle = (
  classTitle: string | undefined,
  item: CurriculumItem,
  index: number,
): string => {
  if (classTitle && classTitle.trim().length > 0) {
    return classTitle;
  }
  if (item.subject) {
    return `${item.subject} curriculum`;
  }
  return index === 0 ? "Curriculum overview" : `Curriculum ${index + 1}`;
};

export const CurriculumOverview = ({ onOpenPlanner }: CurriculumOverviewProps) => {
  const { classes, isLoading: classesLoading } = useMyClasses();

  const curriculumItemsQuery = useQuery({
    queryKey: ["curriculum-items"],
    queryFn: () => listCurriculumItems(),
  });

  const curriculumLinksQuery = useQuery({
    queryKey: ["curriculum-lesson-links"],
    queryFn: () => listCurriculumLessonLinks(),
  });

  const classTitles = useMemo(() => {
    return new Map(classes.map(classItem => [classItem.id, classItem.title]));
  }, [classes]);

  const boards = useMemo<CurriculumBoardSummary[]>(() => {
    const items = curriculumItemsQuery.data ?? [];
    if (items.length === 0) {
      return [];
    }

    const linkByItemId = new Map(
      (curriculumLinksQuery.data ?? []).map(link => [link.curriculumItemId, link]),
    );

    const boardMap = new Map<string, CurriculumBoardSummary>();

    items.forEach(item => {
      const boardKey = getBoardId(item);
      if (!boardMap.has(boardKey)) {
        const classTitle = item.classId ? classTitles.get(item.classId) : undefined;
        boardMap.set(boardKey, {
          id: boardKey,
          classId: item.classId || null,
          title: boardTitle(classTitle, item, boardMap.size),
          subject: item.subject,
          stage: item.stage,
          lessonCount: 0,
          statusCounts: {},
          lessons: [],
        });
      }

      const summary = boardMap.get(boardKey)!;
      summary.lessonCount += 1;
      if (!summary.subject && item.subject) {
        summary.subject = item.subject;
      }
      if (!summary.stage && item.stage) {
        summary.stage = item.stage;
      }

      const link = linkByItemId.get(item.id) ?? null;
      const status = link?.status ?? "draft";
      summary.statusCounts[status] = (summary.statusCounts[status] ?? 0) + 1;

      summary.lessons.push({
        id: item.id,
        title: item.title,
        date: item.date,
        parsedDate: parseDate(item.date),
        status,
      });
    });

    return Array.from(boardMap.values()).map(board => {
      const sortedLessons = [...board.lessons].sort((a, b) => {
        if (a.parsedDate && b.parsedDate) {
          return a.parsedDate.getTime() - b.parsedDate.getTime();
        }
        if (a.parsedDate) return -1;
        if (b.parsedDate) return 1;
        return a.title.localeCompare(b.title);
      });

      return { ...board, lessons: sortedLessons };
    });
  }, [curriculumItemsQuery.data, curriculumLinksQuery.data, classTitles]);

  const isLoading = classesLoading || curriculumItemsQuery.isLoading || curriculumLinksQuery.isLoading;
  const hasError = Boolean(curriculumItemsQuery.error || curriculumLinksQuery.error);
  const errorMessage =
    curriculumItemsQuery.error instanceof Error
      ? curriculumItemsQuery.error.message
      : curriculumLinksQuery.error instanceof Error
        ? curriculumLinksQuery.error.message
        : "Unable to load curriculum.";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Curriculum overview</h2>
        <p className="text-sm text-muted-foreground">
          Keep an eye on your upcoming lessons and curriculum progress at a glance.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-primary/20 bg-background/60">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : hasError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {boards.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-primary/30 bg-background/60 p-6 text-center text-sm text-muted-foreground">
              No curriculum boards yet. Open the planner to create your first outline.
            </div>
          ) : null}
          {boards.map(board => {
            const now = Date.now();
            const nextScheduled = board.lessons.find(
              lesson => lesson.parsedDate && lesson.parsedDate.getTime() >= now,
            );
            const fallbackLesson = board.lessons[0] ?? null;
            const nextLesson = nextScheduled ?? fallbackLesson;
            const previewLessons = board.lessons.slice(0, 3);

            return (
              <Card
                key={board.id}
                className="flex h-full flex-col justify-between border border-primary/30 bg-background/75 shadow-[0_0_35px_hsl(var(--glow-primary)/0.12)] backdrop-blur"
              >
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-foreground">{board.title}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-x-2 text-xs">
                    {board.subject ? <span>{board.subject}</span> : null}
                    {board.stage ? <span>· {board.stage}</span> : null}
                    {!board.subject && !board.stage ? <span>Curriculum board</span> : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-4 w-4" /> Lessons
                      </dt>
                      <dd className="font-semibold text-foreground">{board.lessonCount}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" /> Next lesson
                      </dt>
                      <dd className="text-right text-foreground">
                        {nextLesson?.parsedDate
                          ? format(nextLesson.parsedDate, "PPP")
                          : nextLesson?.date
                            ? nextLesson.date
                            : "Set a date"}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(board.statusCounts) as Array<[
                      CurriculumLessonLink["status"],
                      number,
                    ]>).map(([status, count]) => {
                      if (!count) return null;
                      return (
                        <Badge key={`${board.id}-${status}`} variant="secondary" className="text-xs font-medium">
                          {statusLabels[status]} · {count}
                        </Badge>
                      );
                    })}
                  </div>

                  <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" /> Upcoming lessons
                    </p>
                    <ul className="space-y-1">
                      {previewLessons.length === 0 ? (
                        <li className="text-sm text-muted-foreground">No lessons added yet.</li>
                      ) : (
                        previewLessons.map(lesson => (
                          <li key={lesson.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate font-medium text-foreground" title={lesson.title}>
                              {lesson.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {lesson.parsedDate ? format(lesson.parsedDate, "MMM d") : "TBC"}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full" onClick={() => onOpenPlanner({ classId: board.classId ?? undefined })}>
                    Open curriculum
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          <button
            type="button"
            onClick={() => onOpenPlanner()}
            className={cn(
              "group flex h-full flex-col items-center justify-center rounded-xl border border-primary/30",
              "bg-background/70 p-6 text-center shadow-[0_0_35px_hsl(var(--glow-primary)/0.12)] backdrop-blur transition",
              "hover:border-primary/60 hover:shadow-[0_0_45px_hsl(var(--glow-primary)/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary shadow-[0_0_45px_hsl(var(--glow-primary)/0.3)] transition group-hover:scale-105">
              <Plus className="h-10 w-10" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">Open curriculum planner</p>
            <p className="mt-1 text-sm text-muted-foreground">Add lessons or update plans in one place.</p>
          </button>
        </div>
      )}
    </section>
  );
};

export default CurriculumOverview;
