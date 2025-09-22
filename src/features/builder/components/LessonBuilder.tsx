import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivitySearchPanel } from "./ActivitySearchPanel";
import { StepCard } from "./StepCard";
import { BuilderProvider, useBuilder } from "../context/BuilderContext";
import type { BuilderActivitySummary } from "../types";
import { useAutosave } from "../hooks/useAutosave";
import { fetchLinkStatuses, type LinkHealthStatus } from "../api/linkHealth";
import { BuilderCommandPalette } from "./command/BuilderCommandPalette";
import { ExportMenu } from "./export/ExportMenu";

const BuilderShell = () => {
  const { state, setState, addStep, duplicateStep, removeStep, reorderSteps } = useBuilder();
  const [activeActivity, setActiveActivity] = useState<BuilderActivitySummary | null>(null);
  const [linkLookup, setLinkLookup] = useState<Record<string, LinkHealthStatus>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleActivitySelect = (activity: BuilderActivitySummary) => {
    setActiveActivity(activity);
    setState(prev => ({
      ...prev,
      stage: activity.schoolStages[0] ?? prev.stage,
      subject: activity.subjects[0] ?? prev.subject,
      title: prev.title === "Untitled Lesson" ? activity.name : prev.title,
      steps: prev.steps.map((step, index) =>
        index === 0
          ? {
              ...step,
              title: activity.name,
              tags: Array.from(new Set([...step.tags, ...activity.tags])),
              technology: Array.from(new Set([...step.technology, ...activity.technology])),
            }
          : step,
      ),
    }));
  };

  const lessonMetadata = useMemo(
    () => ({
      stage: state.stage,
      subject: state.subject,
      steps: state.steps.length,
    }),
    [state.stage, state.subject, state.steps.length],
  );

  useEffect(() => {
    const urls = Array.from(
      new Set(
        state.steps
          .flatMap(step => step.resources.map(resource => resource.url))
          .filter(url => Boolean(url && url.startsWith("http"))),
      ),
    );
    if (!urls.length) {
      setLinkLookup({});
      return;
    }
    fetchLinkStatuses(urls)
      .then(setLinkLookup)
      .catch(error => console.error("Failed to load link health", error));
  }, [state.steps]);

  useAutosave(state, {
    onSaving: () => setAutosaveStatus("saving"),
    onSaved: () => setAutosaveStatus("saved"),
  });

  useEffect(() => {
    if (autosaveStatus === "saved") {
      const timer = setTimeout(() => setAutosaveStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
  }, [autosaveStatus]);

  const handleStepChange = (stepId: string, patch: Partial<typeof state.steps[number]>) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step => (step.id === stepId ? { ...step, ...patch } : step)),
    }));
  };

  const handleDrop = (fromId: string, toId: string) => {
    reorderSteps(fromId, toId);
  };

  return (
    <div className="flex h-full min-h-[80vh] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson builder</h1>
          <p className="text-sm text-muted-foreground">
            Assemble a tech-integrated lesson in minutes. Drag steps, open the command palette (⌘/Ctrl+K), and export teacher or
            student views.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu state={state} linkLookup={linkLookup} />
          <span className="text-xs text-muted-foreground" data-testid="autosave-status">
            {autosaveStatus === "saving" ? "Saving..." : autosaveStatus === "saved" ? "Saved" : "Auto-save ready"}
          </span>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <ActivitySearchPanel
          activeActivitySlug={activeActivity?.slug ?? null}
          onSelectActivity={handleActivitySelect}
        />
        <Card className="border-none bg-background">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-2xl font-semibold">Lesson blueprint</CardTitle>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold uppercase text-muted-foreground"
                  htmlFor="lesson-title-input"
                >
                  Lesson title
                </label>
                <Input
                  id="lesson-title-input"
                  value={state.title}
                  onChange={event => setState(prev => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="lesson-stage-input">
                  Stage
                </label>
                <Input
                  id="lesson-stage-input"
                  value={state.stage}
                  onChange={event => setState(prev => ({ ...prev, stage: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="lesson-subject-input">
                  Subject
                </label>
                <Input
                  id="lesson-subject-input"
                  value={state.subject}
                  onChange={event => setState(prev => ({ ...prev, subject: event.target.value }))}
                />
              </div>
            </div>
            <Textarea
              id="lesson-objective-textarea"
              value={state.objective}
              onChange={event => setState(prev => ({ ...prev, objective: event.target.value }))}
              placeholder="What will students accomplish?"
              rows={3}
            />
            <div className="text-xs text-muted-foreground">
              {lessonMetadata.steps} steps • Stage: {lessonMetadata.stage || "Choose"} • Subject: {lessonMetadata.subject || "Pick"}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="steps">
              <TabsList className="border-b border-border bg-muted/30 px-6 py-2">
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="steps" className="p-0">
                <ScrollArea className="h-[65vh]">
                  <div className="space-y-4 p-6">
                    {state.steps.map((step, index) => (
                      <StepCard
                        key={step.id}
                        index={index}
                        step={step}
                        healthLookup={linkLookup}
                        onChange={handleStepChange}
                        onRemove={removeStep}
                        onDuplicate={duplicateStep}
                        onDragStart={() => undefined}
                        onDrop={(fromId, toId) => handleDrop(fromId, toId)}
                      />
                    ))}
                    <Button type="button" variant="outline" onClick={addStep} className="w-full" data-testid="add-step">
                      <Plus className="mr-2 h-4 w-4" /> Add step
                    </Button>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="notes" className="p-6">
                <Textarea
                  rows={10}
                  placeholder="Add facilitator notes, differentiation options, or reflections to revisit later."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <BuilderCommandPalette
        onAddStep={addStep}
        onDuplicateStep={() => duplicateStep(state.steps[state.steps.length - 1]?.id ?? "")}
        onFocusSearch={() => document.querySelector<HTMLInputElement>("input[placeholder='Search by keyword, skill, or tool...']")?.focus()}
      />
    </div>
  );
};

export const LessonBuilder = () => (
  <BuilderProvider>
    <BuilderShell />
  </BuilderProvider>
);

export default LessonBuilder;
