import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LessonBuilderPlan } from "@/types/lesson-builder";
import { builderPlanToLessonPlan } from "@/types/lesson-builder";
import { LessonDetailContent, type LessonDetailCopy } from "@/components/lesson-plans/LessonModal";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <LessonDetailContent lesson={lesson} copy={lessonCopy} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
