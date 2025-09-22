import { useCallback, useEffect, useState } from "react";

import { SEO } from "@/components/SEO";
import { LessonPreview } from "@/components/lesson-draft/LessonPreview";
import { StepEditor } from "@/components/lesson-draft/StepEditor";
import { ResourceSearchModal } from "@/components/lesson-draft/ResourceSearchModal";
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
          <StepEditor
            onRequestResourceSearch={handleRequestResourceSearch}
            activeResourceStepId={resourceSearchStepId}
            isResourceSearchOpen={isResourceSearchOpen}
          />
          <LessonPreview />
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
