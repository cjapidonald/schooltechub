import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, BookOpen } from "lucide-react";

import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import {
  getClass,
  unlinkPlanFromClass,
  type Class,
} from "@/lib/classes";
import { ClassLessonPlanViewer } from "@/components/classes/ClassLessonPlanViewer";
import { ClassRecurringSchedule, type ClassScheduleOccurrence } from "@/components/classes/ClassRecurringSchedule";

export function ClassDashboard() {
  const params = useParams<{ id: string }>();
  const classId = params.id;
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();
  const [scheduleOccurrences, setScheduleOccurrences] = useState<ClassScheduleOccurrence[]>([]);
  const [filteredPlanCount, setFilteredPlanCount] = useState<number | null>(null);
  const [unlinkingPlanId, setUnlinkingPlanId] = useState<string | null>(null);

  const classQuery = useQuery<Class | null>({
    queryKey: ["class-detail", classId],
    enabled: Boolean(classId),
    queryFn: async () => {
      if (!classId) {
        return null;
      }
      return getClass(classId);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (lessonPlanId: string) => {
      if (!classId) {
        throw new Error("Class identifier is missing");
      }
      await unlinkPlanFromClass(lessonPlanId, classId);
    },
    onMutate: (lessonPlanId: string) => {
      setUnlinkingPlanId(lessonPlanId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-lesson-plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-classes"] });
    },
    onSettled: () => {
      setUnlinkingPlanId(null);
    },
  });

  const highlightedScheduleDates = useMemo(() => {
    return scheduleOccurrences.map(occurrence => occurrence.start.slice(0, 10));
  }, [scheduleOccurrences]);

  if (!classId) {
    return <Navigate to="/teacher" replace />;
  }

  const classData = classQuery.data;
  const planCountBadge = filteredPlanCount === null
    ? t.account.classes.dashboard.lessonCountLoading
    : t.account.classes.dashboard.lessonCount.replace("{count}", String(filteredPlanCount));

  return (
    <div className="min-h-screen bg-muted/20 py-10">
      <SEO
        title={t.account.classes.dashboard.seoTitle}
        description={t.account.classes.dashboard.seoDescription}
        canonicalUrl="https://schooltechhub.com/teacher/classes"
      />
      <div className="container mx-auto space-y-8 px-4">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" asChild>
            <Link to={getLocalizedPath("/teacher", language)} className="inline-flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              {t.account.classes.dashboard.backToOverview}
            </Link>
          </Button>
          <Button asChild>
            <Link to={getLocalizedPath(`/lesson-builder?classId=${encodeURIComponent(classId)}`, language)}>
              <BookOpen className="mr-2 h-4 w-4" />
              {t.account.classes.dashboard.addLessonPlan}
            </Link>
          </Button>
        </div>

        {classQuery.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : classQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t.account.classes.dashboard.errorTitle}</AlertTitle>
            <AlertDescription>
              {classQuery.error instanceof Error ? classQuery.error.message : t.account.classes.dashboard.errorDescription}
            </AlertDescription>
          </Alert>
        ) : !classData ? (
          <Alert>
            <AlertTitle>{t.account.classes.dashboard.notFoundTitle}</AlertTitle>
            <AlertDescription>{t.account.classes.dashboard.notFoundDescription}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            <Card className="border-primary/20 bg-background/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">{classData.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {classData.subject ? <Badge variant="secondary">{classData.subject}</Badge> : null}
                  {classData.stage ? <Badge variant="outline">{classData.stage}</Badge> : null}
                  <Badge variant="outline">{planCountBadge}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{classData.summary ?? t.account.classes.dashboard.noSummary}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t.account.classes.dashboard.overviewLessonsLabel}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{planCountBadge}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.account.classes.dashboard.overviewLessonsDescription}
                    </p>
                  </div>
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t.account.classes.dashboard.overviewCurriculumLabel}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {t.account.classes.dashboard.overviewCurriculumValue}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.account.classes.dashboard.overviewCurriculumDescription}
                    </p>
                  </div>
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t.account.classes.dashboard.overviewReportsLabel}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {t.account.classes.dashboard.overviewReportsValue}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.account.classes.dashboard.overviewReportsDescription}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
              <div className="space-y-6">
                <ClassRecurringSchedule
                  classId={classId}
                  onOccurrencesChange={occurrences => setScheduleOccurrences(occurrences)}
                />
                <Card>
                  <CardHeader>
                    <CardTitle>{t.account.classes.dashboard.lessonPlansTitle}</CardTitle>
                  </CardHeader>
                      <CardContent>
                        <ClassLessonPlanViewer
                          classId={classId}
                          onUnlink={lessonPlanId => unlinkMutation.mutate(lessonPlanId)}
                          isUnlinking={unlinkMutation.isPending}
                          unlinkingPlanId={unlinkingPlanId}
                          onPlanCountChange={count => setFilteredPlanCount(count)}
                          additionalHighlightedDates={highlightedScheduleDates}
                        />
                      </CardContent>
                </Card>
              </div>
              <aside className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.account.classes.dashboard.quickActions}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" asChild>
                      <Link to={getLocalizedPath(`/lesson-builder?classId=${encodeURIComponent(classId)}`, language)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        {t.account.classes.dashboard.addLessonPlan}
                      </Link>
                    </Button>
                    <Button className="w-full" variant="outline" asChild>
                      <Link to={getLocalizedPath("/lesson-builder", language)}>
                        {t.account.classes.dashboard.managePlans}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t.account.classes.dashboard.workspaceTipsTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{t.account.classes.dashboard.workspaceTipsDescription}</p>
                    <ul className="list-disc space-y-2 pl-5 text-xs text-muted-foreground">
                      {t.account.classes.dashboard.workspaceTips?.map(tip => (
                        <li key={tip} className="leading-relaxed">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassDashboard;
