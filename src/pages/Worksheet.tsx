import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { SEO } from "@/components/SEO";
import {
  WorksheetDetailContent,
  WorksheetModal,
  WorksheetPreview,
} from "@/components/worksheets/WorksheetModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import type { Worksheet } from "@/types/worksheets";

async function fetchWorksheetDetail(slug: string): Promise<Worksheet> {
  const response = await fetch(`/api/worksheets/${slug}`);
  if (!response.ok) {
    throw new Error("Failed to load worksheet");
  }
  return response.json() as Promise<Worksheet>;
}

const WorksheetPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const worksheetQuery = useQuery({
    queryKey: ["worksheet", slug],
    enabled: Boolean(slug),
    queryFn: () => fetchWorksheetDetail(slug as string),
  });

  const modalCopy = useMemo(
    () => ({
      stageLabel: t.worksheets.modal.stage,
      subjectsLabel: t.worksheets.modal.subjects,
      skillsLabel: t.worksheets.modal.skills,
      typeLabel: t.worksheets.modal.type,
      difficultyLabel: t.worksheets.modal.difficulty,
      formatLabel: t.worksheets.modal.format,
      formatPdfValue: t.worksheets.modal.formatPdf,
      formatDigitalValue: t.worksheets.modal.formatDigital,
      techLabel: t.worksheets.modal.techIntegrated,
      answersLabel: t.worksheets.modal.answerKey,
      tagsLabel: t.worksheets.modal.tags,
      previewLabel: t.worksheets.modal.preview,
      noPreviewLabel: t.worksheets.modal.noPreview,
      downloadLabel: t.worksheets.modal.download,
      downloadAnswersLabel: t.worksheets.modal.downloadAnswers,
      openFullLabel: t.worksheets.modal.openFull,
      closeLabel: t.worksheets.modal.close,
      loadingLabel: t.worksheets.states.loading,
      errorLabel: t.worksheets.states.error,
      yesLabel: t.common.yes ?? "Yes",
      noLabel: t.common.no ?? "No",
    }),
    [t],
  );

  const worksheet = worksheetQuery.data ?? null;

  const handleDownloadPdf = () => {
    if (!worksheet) return;
    window.open(`/api/worksheets/${worksheet.id}/download`, "_blank", "noopener,noreferrer");
  };

  const handleDownloadAnswers = () => {
    if (!worksheet?.hasAnswerKey) return;
    window.open(`/api/worksheets/${worksheet.id}/answers`, "_blank", "noopener,noreferrer");
  };

  const pageTitle = worksheet?.title ?? t.worksheets.detail.titleFallback;
  const pageDescription = worksheet?.overview ?? t.worksheets.detail.descriptionFallback;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${pageTitle} | ${t.worksheets.seo.title}`}
        description={pageDescription}
        canonicalUrl={`https://schooltechhub.com${getLocalizedPath(`/worksheets/${slug ?? ""}`, language)}`}
        type="article"
        lang={language}
      />
      <main className="container py-12">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate(getLocalizedPath("/worksheets", language))}
          className="mb-8"
        >
          {t.worksheets.detail.backToList}
        </Button>

        {worksheetQuery.isLoading ? (
          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <Skeleton className="h-[420px] rounded-xl" />
            <Skeleton className="h-[420px] rounded-xl" />
          </div>
        ) : worksheetQuery.isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-semibold">{t.worksheets.detail.errorTitle}</h1>
              <p className="mt-2 text-muted-foreground">
                {t.worksheets.detail.errorDescription}
              </p>
            </CardContent>
          </Card>
        ) : worksheet ? (
          <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold leading-tight tracking-tight">
                  {worksheet.title}
                </h1>
                {worksheet.overview ? (
                  <p className="text-lg text-muted-foreground">{worksheet.overview}</p>
                ) : null}
              </div>

              <WorksheetPreview worksheet={worksheet} copy={modalCopy} />
            </div>

            <div className="space-y-6">
              <WorksheetDetailContent
                worksheet={worksheet}
                initialWorksheet={null}
                copy={modalCopy}
              />

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleDownloadPdf}>
                  {t.worksheets.modal.download}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadAnswers}
                  disabled={!worksheet.hasAnswerKey}
                >
                  {t.worksheets.modal.downloadAnswers}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-semibold">
                {t.worksheets.detail.notFoundTitle}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {t.worksheets.detail.notFoundDescription}
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Hidden modal ensures shared components styles tree-shake correctly */}
      <WorksheetModal
        isOpen={false}
        onClose={() => undefined}
        worksheet={null}
        initialWorksheet={null}
        copy={modalCopy}
      />
    </div>
  );
};

export default WorksheetPage;
