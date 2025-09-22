import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { SEO } from "@/components/SEO";
import { LessonDetailContent, LessonDetailCopy } from "@/components/lesson-plans/LessonModal";
import { LessonPlanToolbar } from "@/components/lesson-plans/LessonPlanToolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import type { LessonPlan } from "@/types/lesson-plans";

async function fetchLessonPlanDetail(slug: string): Promise<LessonPlan> {
  const response = await fetch(`/api/lesson-plans/${slug}`);
  if (!response.ok) {
    throw new Error("Failed to load lesson plan");
  }
  return response.json() as Promise<LessonPlan>;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

const LessonPlanPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const lessonCopy = useMemo<LessonDetailCopy>(
    () => ({
      stageLabel: t.lessonPlans.modal.stage,
      subjectsLabel: t.lessonPlans.modal.subjects,
      deliveryLabel: t.lessonPlans.modal.delivery,
      technologyLabel: t.lessonPlans.modal.technology,
      durationLabel: t.lessonPlans.modal.duration,
      summaryLabel: t.lessonPlans.modal.summary,
      overviewTitle: t.lessonPlans.modal.overview,
      objectivesLabel: t.lessonPlans.modal.objectives,
      materialsLabel: t.lessonPlans.modal.materials,
      assessmentLabel: t.lessonPlans.modal.assessment,
      technologyOverviewLabel: t.lessonPlans.modal.technologyOverview,
      deliveryOverviewLabel: t.lessonPlans.modal.deliveryOverview,
      durationOverviewLabel: t.lessonPlans.modal.durationOverview,
      structureTitle: t.lessonPlans.modal.structure,
      resourcesTitle: t.lessonPlans.modal.resources,
      resourceLinkLabel: t.lessonPlans.modal.resourceLink,
      noResourcesLabel: t.lessonPlans.modal.empty,
      errorLabel: t.lessonPlans.states.error,
      downloadLabel: t.lessonPlans.modal.download,
      openFullLabel: t.lessonPlans.modal.openFull,
      closeLabel: t.lessonPlans.modal.close,
      loadingLabel: t.lessonPlans.states.loading,
      minutesFormatter: (minutes: number) =>
        t.lessonPlans.card.durationLabel.replace("{minutes}", String(minutes)),
    }),
    [t],
  );

  const lessonQuery = useQuery({
    queryKey: ["lesson-plan", slug],
    enabled: Boolean(slug),
    queryFn: () => fetchLessonPlanDetail(slug as string),
  });

  const lesson = lessonQuery.data ?? null;

  const pageTitle = lesson
    ? `${lesson.title} | ${t.lessonPlans.seo.title}`
    : t.lessonPlans.seo.title;
  const pageDescription = lesson?.summary ?? t.lessonPlans.seo.description;

  const handleBack = () => {
    navigate(getLocalizedPath("/lesson-plans", language));
  };

  const canonicalUrl = lesson
    ? `https://schooltechhub.com${getLocalizedPath(`/lesson-plans/${lesson.slug}`, language)}`
    : `https://schooltechhub.com${getLocalizedPath("/lesson-plans", language)}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={canonicalUrl}
        type="article"
        lang={language}
      />

      <main className="container py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleBack} className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t.lessonPlans.detail.backToList}
            </Button>
          </div>

          <LessonPlanToolbar lesson={lesson} slug={slug ?? null} />
        </div>

        {lessonQuery.isLoading ? (
          <DetailSkeleton />
        ) : lessonQuery.isError ? (
          <div className="rounded-2xl border bg-card/40 p-10 text-center">
            <p className="text-lg font-semibold text-destructive">{t.lessonPlans.states.error}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t.lessonPlans.detail.errorDescription}</p>
            <Button type="button" className="mt-6" onClick={handleBack}>
              {t.lessonPlans.detail.backToList}
            </Button>
          </div>
        ) : lesson ? (
          <article className="space-y-8">
            <header className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight">{lesson.title}</h1>
              {lesson.summary ? (
                <p className="text-lg text-muted-foreground">{lesson.summary}</p>
              ) : null}
            </header>

            <LessonDetailContent
              lesson={lesson}
              copy={lessonCopy}
              isLoading={false}
              errorMessage={null}
            />
          </article>
        ) : (
          <div className="rounded-2xl border bg-card/40 p-10 text-center">
            <p className="text-lg font-semibold">{t.lessonPlans.detail.notFoundTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t.lessonPlans.detail.notFoundDescription}</p>
            <Button type="button" className="mt-6" onClick={handleBack}>
              {t.lessonPlans.detail.backToList}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LessonPlanPage;
