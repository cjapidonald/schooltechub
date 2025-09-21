import { useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { Worksheet, WorksheetCard } from "@/types/worksheets";

export interface WorksheetDetailCopy {
  stageLabel: string;
  subjectsLabel: string;
  skillsLabel: string;
  typeLabel: string;
  difficultyLabel: string;
  formatLabel: string;
  formatPdfValue: string;
  formatDigitalValue: string;
  techLabel: string;
  answersLabel: string;
  tagsLabel: string;
  previewLabel: string;
  noPreviewLabel: string;
  downloadLabel: string;
  downloadAnswersLabel: string;
  openFullLabel: string;
  closeLabel: string;
  loadingLabel: string;
  errorLabel: string;
  yesLabel: string;
  noLabel: string;
}

interface WorksheetDetailContentProps {
  worksheet?: Worksheet | null;
  initialWorksheet?: WorksheetCard | null;
  copy: WorksheetDetailCopy;
  isLoading?: boolean;
  errorMessage?: string | null;
}

interface WorksheetModalProps extends WorksheetDetailContentProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf?: () => void;
  onDownloadAnswers?: () => void;
  onOpenFullPage?: () => void;
}

function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;

    if (isLocked) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = previousOverflow;
    }

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isLocked]);
}

function normalizeList(values: string[] | undefined | null): string[] {
  return Array.isArray(values)
    ? values.filter((value) => typeof value === "string" && value.length > 0)
    : [];
}

export function WorksheetDetailContent({
  worksheet,
  initialWorksheet,
  copy,
  isLoading = false,
  errorMessage = null,
}: WorksheetDetailContentProps) {
  const activeWorksheet = worksheet ?? initialWorksheet ?? null;

  const metaSections = useMemo(() => {
    if (!activeWorksheet) {
      return [];
    }

    const sections: Array<{ label: string; values: string[] }> = [
      { label: copy.stageLabel, values: [activeWorksheet.stage] },
      {
        label: copy.subjectsLabel,
        values: normalizeList(activeWorksheet.subjects),
      },
      {
        label: copy.skillsLabel,
        values: normalizeList(activeWorksheet.skills),
      },
    ];

    if (activeWorksheet.worksheet_type) {
      sections.push({
        label: copy.typeLabel,
        values: [activeWorksheet.worksheet_type],
      });
    }

    if (activeWorksheet.difficulty) {
      sections.push({
        label: copy.difficultyLabel,
        values: [activeWorksheet.difficulty],
      });
    }

    if (activeWorksheet.format) {
      sections.push({
        label: copy.formatLabel,
        values: [
          activeWorksheet.format === "pdf"
            ? copy.formatPdfValue
            : copy.formatDigitalValue,
        ],
      });
    }

    if (worksheet) {
      sections.push({
        label: copy.techLabel,
        values: [worksheet.tech_integrated ? copy.yesLabel : copy.noLabel],
      });
    }

    if (activeWorksheet) {
      const hasAnswerKey = worksheet?.hasAnswerKey ?? activeWorksheet.hasAnswerKey;
      sections.push({
        label: copy.answersLabel,
        values: [hasAnswerKey ? copy.yesLabel : copy.noLabel],
      });
    }

    if (worksheet?.tags?.length) {
      sections.push({
        label: copy.tagsLabel,
        values: worksheet.tags,
      });
    }

    return sections.filter((section) => section.values.length > 0);
  }, [
    activeWorksheet,
    copy.answersLabel,
    copy.difficultyLabel,
    copy.formatDigitalValue,
    copy.formatLabel,
    copy.formatPdfValue,
    copy.skillsLabel,
    copy.stageLabel,
    copy.subjectsLabel,
    copy.tagsLabel,
    copy.techLabel,
    copy.yesLabel,
    copy.noLabel,
    copy.typeLabel,
    worksheet,
  ]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{copy.loadingLabel}</p>
      ) : errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      {activeWorksheet ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {metaSections.map((section) => (
              <div key={section.label}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {section.label}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {section.values.map((value) => (
                    <Badge key={value} variant="secondary">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {worksheet?.overview ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {worksheet.overview}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function WorksheetPreview({
  worksheet,
  copy,
}: {
  worksheet: Worksheet | null;
  copy: WorksheetDetailCopy;
}) {
  if (!worksheet) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">{copy.noPreviewLabel}</p>
      </div>
    );
  }

  const images = normalizeList(worksheet.page_images);

  if (images.length === 0) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">{copy.noPreviewLabel}</p>
      </div>
    );
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {images.map((src, index) => (
          <CarouselItem key={src ?? index} className="flex justify-center">
            <AspectRatio ratio={8 / 11} className="w-full max-w-xl overflow-hidden rounded-xl border">
              <img
                src={src}
                alt={`${copy.previewLabel} ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </AspectRatio>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-3" aria-label="Previous page" />
      <CarouselNext className="-right-3" aria-label="Next page" />
    </Carousel>
  );
}

export function WorksheetModal({
  isOpen,
  onClose,
  worksheet,
  initialWorksheet,
  copy,
  isLoading = false,
  errorMessage = null,
  onDownloadPdf,
  onDownloadAnswers,
  onOpenFullPage,
}: WorksheetModalProps) {
  useLockBodyScroll(isOpen);

  const activeWorksheet = worksheet ?? initialWorksheet ?? null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-hidden p-0">
        <DialogHeader className="space-y-1 border-b px-6 py-4">
          <DialogTitle className="text-2xl font-semibold">
            {activeWorksheet?.title ?? copy.previewLabel}
          </DialogTitle>
          <DialogDescription>
            {worksheet?.overview ?? activeWorksheet?.overview ?? ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 overflow-y-auto px-6 py-6 md:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <WorksheetPreview worksheet={worksheet ?? null} copy={copy} />
          </div>

          <WorksheetDetailContent
            worksheet={worksheet ?? null}
            initialWorksheet={initialWorksheet}
            copy={copy}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={onDownloadPdf} disabled={!activeWorksheet}>
              {copy.downloadLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onDownloadAnswers}
              disabled={!(worksheet?.hasAnswerKey ?? initialWorksheet?.hasAnswerKey)}
            >
              {copy.downloadAnswersLabel}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onOpenFullPage}>
              {copy.openFullLabel}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              {copy.closeLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
