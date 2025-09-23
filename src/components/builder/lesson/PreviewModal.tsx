import { useCallback, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { LessonBuilderPlan } from "@/types/lesson-builder";
import { builderPlanToLessonPlan } from "@/types/lesson-builder";
import { LessonDetailContent, type LessonDetailCopy } from "@/components/lesson-plans/LessonModal";
import { downloadPlanExport } from "@/lib/downloadPlanExport";

interface PreviewModalCopy {
  title: string;
}

interface PreviewModalProps {
  plan: LessonBuilderPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copy: PreviewModalCopy;
  lessonCopy: LessonDetailCopy;
}

export const PreviewModal = ({ plan, open, onOpenChange, copy, lessonCopy }: PreviewModalProps) => {
  const lesson = plan ? builderPlanToLessonPlan(plan) : null;
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(
    async (format: "pdf" | "docx") => {
      if (!plan) {
        return;
      }

      try {
        setIsDownloading(true);
        await downloadPlanExport(plan.id, format, plan.title ?? "Lesson plan");
      } catch (error) {
        console.error("Failed to download lesson plan", error);
      } finally {
        setIsDownloading(false);
      }
    },
    [plan],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <LessonDetailContent lesson={lesson} copy={lessonCopy} />
        </ScrollArea>
        <DialogFooter className="flex flex-wrap gap-2 pt-4">
          <Button
            type="button"
            onClick={() => void handleDownload("pdf")}
            disabled={!plan || isDownloading}
          >
            {lessonCopy.downloadLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDownload("docx")}
            disabled={!plan || isDownloading}
          >
            {lessonCopy.downloadDocxLabel ?? "Download DOCX"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
