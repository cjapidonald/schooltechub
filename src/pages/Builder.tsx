import { useCallback, useEffect, useState } from "react";

import { ChevronDown } from "lucide-react";

import { SEO } from "@/components/SEO";
import { LessonPreview } from "@/components/lesson-draft/LessonPreview";
import { StepEditor } from "@/components/lesson-draft/StepEditor";
import { ResourceSearchModal } from "@/components/lesson-draft/ResourceSearchModal";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLessonDraftStore } from "@/stores/lessonDraft";
import {
  clearLessonDraftContext,
  getStoredActiveStepId,
  persistActiveStepId,
  setActiveLessonDraftId,
  subscribeToResourceAttachments,
} from "@/lib/lesson-draft-bridge";

const BuilderPage = () => {
  const draftId = useLessonDraftStore(state => state.draft.id);
  const steps = useLessonDraftStore(state => state.draft.steps);
  const attachResource = useLessonDraftStore(state => state.attachResource);
  const [isResourceSearchOpen, setIsResourceSearchOpen] = useState(false);
  const [resourceSearchStepId, setResourceSearchStepId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const stepSummaryLabel = steps.length === 0 ? "No steps yet" : `${steps.length} step${steps.length === 1 ? "" : "s"}`;

  const handleRequestResourceSearch = useCallback((stepId: string) => {
    setActiveStepId(stepId);
    setResourceSearchStepId(stepId);
    setIsResourceSearchOpen(true);
  }, []);

  const handleResourceDialogChange = useCallback((open: boolean) => {
    setIsResourceSearchOpen(open);
    if (!open) {
      setResourceSearchStepId(null);
    }
  }, []);

  useEffect(() => {
    if (!draftId) {
      return;
    }

    setActiveLessonDraftId(draftId);
    return () => {
      clearLessonDraftContext(draftId);
    };
  }, [draftId]);

  useEffect(() => {
    if (!isMobilePreviewOpen) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobilePreviewOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobilePreviewOpen]);

  useEffect(() => {
    if (!draftId) {
      return;
    }

    setActiveStepId(prev => {
      if (steps.length === 0) {
        return prev === null ? prev : null;
      }

      if (prev && steps.some(step => step.id === prev)) {
        return prev;
      }

      const stored = getStoredActiveStepId(draftId);
      if (stored && steps.some(step => step.id === stored)) {
        return stored;
      }

      return steps[0].id;
    });
  }, [draftId, steps]);

  useEffect(() => {
    if (!draftId) {
      return;
    }

    persistActiveStepId(draftId, activeStepId);
  }, [draftId, activeStepId]);

  useEffect(() => {
    if (!draftId) {
      return;
    }

    const unsubscribe = subscribeToResourceAttachments(({ draftId: targetDraftId, stepId, resourceId }) => {
      if (targetDraftId !== draftId) {
        return;
      }

      const state = useLessonDraftStore.getState();
      const stepExists = state.draft.steps.some(step => step.id === stepId);
      if (!stepExists) {
        return;
      }

      attachResource(stepId, resourceId);
      setActiveStepId(stepId);
    });

    return unsubscribe;
  }, [attachResource, draftId]);

  return (
    <div className="min-h-screen bg-muted/20 py-10">
      <SEO
        title="Lesson Builder"
        description="Design each step of your lesson and watch the live preview update in real time."
      />
      <main className="container mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Lesson draft builder</h1>
          <p className="max-w-2xl text-muted-foreground">
            Capture the flow of your lesson, keep notes for yourself, and prepare the resources students will need.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-6">
            <StepEditor
              onRequestResourceSearch={handleRequestResourceSearch}
              activeResourceStepId={resourceSearchStepId}
              isResourceSearchOpen={isResourceSearchOpen}
            />
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <LessonPreview />
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <Collapsible open={isMobilePreviewOpen} onOpenChange={setIsMobilePreviewOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="flex w-full items-center justify-between"
                aria-expanded={isMobilePreviewOpen}
                aria-controls="lesson-preview-collapsible"
              >
                <span>{isMobilePreviewOpen ? "Hide live preview" : "Show live preview"}</span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {stepSummaryLabel}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isMobilePreviewOpen ? "rotate-180" : "rotate-0"}`}
                  />
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent id="lesson-preview-collapsible">
              <div className="mt-4">
                <LessonPreview />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>

      <ResourceSearchModal
        open={isResourceSearchOpen}
        onOpenChange={handleResourceDialogChange}
        activeStepId={resourceSearchStepId}
      />
    </div>
  );
};

export default BuilderPage;
