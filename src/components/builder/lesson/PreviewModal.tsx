import { useRef } from "react";

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
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = () => {
    if (!plan || typeof window === "undefined" || !contentRef.current) {
      return;
    }

    const fileNameBase = plan.title
      ? plan.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .replace(/-+/g, "-")
      : "lesson-plan";

    const safeTitle = (plan.title ?? "Lesson plan").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 2rem; color: #111827; }
      h1, h2, h3, h4 { color: #0f172a; }
      ul { padding-left: 1.25rem; }
      .meta-badges span { display: inline-block; margin-right: 0.5rem; margin-bottom: 0.5rem; padding: 0.25rem 0.5rem; border-radius: 9999px; background: #e2e8f0; }
      .section { margin-bottom: 1.5rem; }
      .section h3 { margin-bottom: 0.75rem; }
    </style>
  </head>
  <body>
    ${contentRef.current.innerHTML}
  </body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileNameBase || "lesson-plan"}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div ref={contentRef}>
            <LessonDetailContent lesson={lesson} copy={lessonCopy} />
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button type="button" onClick={handleDownload} disabled={!plan}>
            {lessonCopy.downloadLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
