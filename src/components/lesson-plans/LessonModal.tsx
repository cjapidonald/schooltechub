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
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  LessonPlan,
  LessonPlanContentBlock,
  LessonPlanListItem,
} from "@/types/lesson-plans";

export interface LessonDetailCopy {
  stageLabel: string;
  subjectsLabel: string;
  deliveryLabel: string;
  technologyLabel: string;
  durationLabel: string;
  summaryLabel: string;
  overviewTitle: string;
  objectivesLabel: string;
  successCriteriaLabel: string;
  materialsLabel: string;
  assessmentLabel: string;
  technologyOverviewLabel: string;
  deliveryOverviewLabel: string;
  durationOverviewLabel: string;
  structureTitle: string;
  resourcesTitle: string;
  resourceLinkLabel: string;
  noResourcesLabel: string;
  errorLabel: string;
  downloadLabel: string;
  downloadDocxLabel: string;
  openFullLabel: string;
  closeLabel: string;
  loadingLabel: string;
  minutesFormatter: (minutes: number) => string;
}

interface LessonDetailContentProps {
  lesson?: LessonPlan | null;
  initialLesson?: LessonPlanListItem | null;
  copy: LessonDetailCopy;
  isLoading?: boolean;
  errorMessage?: string | null;
}

interface LessonModalProps extends LessonDetailContentProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf?: () => void;
  onDownloadDocx?: () => void;
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

function renderBlock(block: LessonPlanContentBlock, index: number) {
  switch (block.type) {
    case "heading": {
      const level = Math.min(Math.max(block.level ?? 3, 2), 5);
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return (
        <Tag key={index} className="text-lg font-semibold">
          {block.text}
        </Tag>
      );
    }
    case "list": {
      const ListComponent = block.ordered ? "ol" : "ul";
      return (
        <ListComponent key={index} className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ListComponent>
      );
    }
    case "quote": {
      return (
        <blockquote
          key={index}
          className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground"
        >
          {block.text}
          {block.attribution ? <footer className="mt-2 text-xs">— {block.attribution}</footer> : null}
        </blockquote>
      );
    }
    case "paragraph":
    default:
      return (
        <p key={index} className="text-sm leading-relaxed text-muted-foreground">
          {"text" in block ? block.text : null}
        </p>
      );
  }
}

export function LessonDetailContent({
  lesson,
  initialLesson,
  copy,
  isLoading = false,
  errorMessage = null,
}: LessonDetailContentProps) {
  const activeLesson = lesson ?? initialLesson ?? null;

  const metaBadges = useMemo(() => {
    if (!activeLesson) {
      return [];
    }

    const badges: Array<{ label: string; values: string[] }> = [
      { label: copy.stageLabel, values: activeLesson.stage ? [activeLesson.stage] : [] },
      { label: copy.subjectsLabel, values: activeLesson.subjects },
      { label: copy.deliveryLabel, values: activeLesson.deliveryMethods },
      { label: copy.technologyLabel, values: activeLesson.technologyTags },
    ];

    return badges.filter((badge) => badge.values.length > 0);
  }, [activeLesson, copy.deliveryLabel, copy.stageLabel, copy.subjectsLabel, copy.technologyLabel]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{copy.loadingLabel}</p>
      ) : errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      {metaBadges.length > 0 ? (
        <div className="space-y-2">
          {metaBadges.map((badge) => (
            <div key={badge.label}>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{badge.label}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {badge.values.map((value) => (
                  <Badge key={value} variant="secondary">
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeLesson?.durationMinutes != null ? (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{copy.durationLabel}</p>
          <p className="text-sm text-muted-foreground">
            {copy.minutesFormatter(activeLesson.durationMinutes)}
          </p>
        </div>
      ) : null}

      {lesson?.overview ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{copy.overviewTitle}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {lesson.overview.objectives?.length ? (
              <div>
                <h4 className="text-sm font-semibold">{copy.objectivesLabel}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {lesson.overview.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lesson.overview.successCriteria?.length ? (
              <div>
                <h4 className="text-sm font-semibold">{copy.successCriteriaLabel}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {lesson.overview.successCriteria.map((criterion, index) => (
                    <li key={index}>{criterion}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lesson.overview.materials?.length ? (
              <div>
                <h4 className="text-sm font-semibold">{copy.materialsLabel}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {lesson.overview.materials.map((material, index) => (
                    <li key={index}>{material}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lesson.overview.assessment?.length ? (
              <div>
                <h4 className="text-sm font-semibold">{copy.assessmentLabel}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {lesson.overview.assessment.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lesson.overview.technology?.length ? (
              <div>
                <h4 className="text-sm font-semibold">{copy.technologyOverviewLabel}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {lesson.overview.technology.map((tech, index) => (
                    <li key={index}>{tech}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lesson.overview.delivery?.length ? (
              <div>
                <h4 className="text-sm font-semibold">{copy.deliveryOverviewLabel}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {lesson.overview.delivery.map((delivery, index) => (
                    <li key={index}>{delivery}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lesson.overview.durationMinutes != null ? (
              <div>
                <h4 className="text-sm font-semibold">{copy.durationOverviewLabel}</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy.minutesFormatter(lesson.overview.durationMinutes)}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {lesson?.content?.length ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{copy.structureTitle}</h3>
          <div className="space-y-6">
            {lesson.content.map((section, sectionIndex) => (
              <article key={section.id ?? sectionIndex} className="space-y-3">
                {section.title ? (
                  <h4 className="text-base font-semibold">{section.title}</h4>
                ) : null}
                {section.description ? (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                ) : null}
                <div className="space-y-3">
                  {section.blocks.map((block, blockIndex) => renderBlock(block, blockIndex))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {lesson?.resources?.length ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{copy.resourcesTitle}</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {lesson.resources.map((resource, index) => (
              <li key={`${resource.title}-${index}`} className="rounded-lg border p-4">
                <p className="font-medium text-foreground">{resource.title}</p>
                {resource.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
                ) : null}
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center text-primary hover:underline"
                  >
                    {copy.resourceLinkLabel}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!isLoading && lesson && !lesson.content.length && !lesson.resources.length ? (
        <p className="text-sm text-muted-foreground">{copy.noResourcesLabel}</p>
      ) : null}
    </div>
  );
}

export function LessonModal({
  isOpen,
  onClose,
  lesson,
  initialLesson,
  onDownloadPdf,
  onDownloadDocx,
  onOpenFullPage,
  copy,
  isLoading = false,
  errorMessage = null,
}: LessonModalProps) {
  useLockBodyScroll(isOpen);

  const activeLesson = lesson ?? initialLesson ?? null;

  return (
    <Dialog open={isOpen} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="text-2xl font-bold">
            {activeLesson?.title ?? copy.loadingLabel}
          </DialogTitle>
          <DialogDescription>
            {activeLesson?.summary ?? copy.summaryLabel}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="p-6">
            <LessonDetailContent
              lesson={lesson}
              initialLesson={initialLesson}
              copy={copy}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
          </div>
        </ScrollArea>
        <DialogFooter className="border-t bg-muted/30 p-4 sm:px-6">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
            {onOpenFullPage ? (
              <Button variant="outline" onClick={onOpenFullPage}>
                {copy.openFullLabel}
              </Button>
            ) : null}
            {onDownloadPdf ? (
              <Button onClick={onDownloadPdf}>{copy.downloadLabel}</Button>
            ) : null}
            {onDownloadDocx ? (
              <Button variant="outline" onClick={onDownloadDocx}>
                {copy.downloadDocxLabel}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onClose}>
              {copy.closeLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
