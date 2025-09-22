import { useCallback, useState } from "react";

import { SEO } from "@/components/SEO";
import { LessonPreview } from "@/components/lesson-draft/LessonPreview";
import { StepEditor } from "@/components/lesson-draft/StepEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BuilderPage = () => {
  const [isResourceSearchOpen, setIsResourceSearchOpen] = useState(false);
  const [resourceSearchStepId, setResourceSearchStepId] = useState<string | null>(null);

  const handleRequestResourceSearch = useCallback((stepId: string) => {
    setResourceSearchStepId(stepId);
    setIsResourceSearchOpen(true);
  }, []);

  const handleResourceDialogChange = useCallback((open: boolean) => {
    setIsResourceSearchOpen(open);
    if (!open) {
      setResourceSearchStepId(null);
    }
  }, []);

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

      <Dialog open={isResourceSearchOpen} onOpenChange={handleResourceDialogChange}>
        <DialogContent id="lesson-draft-resource-search">
          <DialogHeader>
            <DialogTitle>Search resources</DialogTitle>
            <DialogDescription>
              Resource search is coming soon. You&apos;ll be able to browse and attach classroom materials in the next update.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuilderPage;
