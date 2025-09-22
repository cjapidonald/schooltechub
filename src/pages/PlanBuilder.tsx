import { useMemo } from "react";

import { SEO } from "@/components/SEO";
import { PlanBuilderWorkspace } from "@/components/plan-builder/PlanBuilderWorkspace";
import { PlanEditorProvider } from "@/contexts/PlanEditorContext";
import type { PlanSnapshot } from "@/types/plan-builder";

const INITIAL_PLAN_ID = "plan-builder-draft";

const PlanBuilderPage = () => {
  const initialSnapshot = useMemo<PlanSnapshot>(
    () => ({
      id: INITIAL_PLAN_ID,
      title: "New Lesson Plan",
      targetMinutes: 60,
      steps: [
        {
          id: "step-warmup",
          type: "timer",
          title: "Warm-up Prompt",
          description: "Invite students to share a quick idea to activate prior knowledge.",
          durationMinutes: 5,
          notes: "Invite two students to share aloud",
        },
        {
          id: "step-mini-lesson",
          type: "activity",
          title: "Mini Lesson",
          description: "Introduce the core concept with modeling and guided practice.",
          durationMinutes: 15,
          notes: "Use visuals and think-aloud",
        },
      ],
      updatedAt: new Date().toISOString(),
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Lesson Plan Builder"
        description="Design interactive, standards-aligned lessons with drag-and-drop sequencing, command palette actions, and autosave."
        canonicalUrl="https://schooltechhub.com/lesson-plans/builder"
        type="website"
        lang="en"
      />
      <main className="container py-12">
        <div className="space-y-6">
          <header className="space-y-2 text-center sm:text-left">
            <h1 className="text-4xl font-bold tracking-tight">Lesson Plan Builder</h1>
            <p className="text-muted-foreground">
              Drag activities, timers, and objectives into your lesson, track your time budget, and keep work synced automatically.
            </p>
          </header>
          <PlanEditorProvider initialSnapshot={initialSnapshot}>
            <PlanBuilderWorkspace />
          </PlanEditorProvider>
        </div>
      </main>
    </div>
  );
};

export default PlanBuilderPage;
