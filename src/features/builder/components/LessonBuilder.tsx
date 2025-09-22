import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { StepCard } from "./StepCard";
import { BuilderProvider, useBuilder } from "../context/BuilderContext";
import { useAutosave } from "../hooks/useAutosave";
import { fetchLinkStatuses, type LinkHealthStatus } from "../api/linkHealth";
import { BuilderCommandPalette } from "./command/BuilderCommandPalette";
import { ExportMenu } from "./export/ExportMenu";

const BuilderShell = () => {
  const { state, setState, addStep, duplicateStep, removeStep, reorderSteps } = useBuilder();
  const [linkLookup, setLinkLookup] = useState<Record<string, LinkHealthStatus>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!active) return;

        const user = data?.user ?? null;
        if (!user) {
          setProfileId(null);
          return;
        }

        setProfileId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("school_logo_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) return;

        const logoUrl = profile?.school_logo_url ?? null;
        if (logoUrl) {
          setState(prev => (prev.schoolLogoUrl ? prev : { ...prev, schoolLogoUrl: logoUrl }));
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [setState]);

  const lessonMetadata = useMemo(
    () => ({
      stage: state.stage,
      subject: state.subject,
      steps: state.steps.length,
      date: state.lessonDate,
    }),
    [state.stage, state.subject, state.steps.length, state.lessonDate],
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

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileId) {
      event.target.value = "";
      if (!profileId) {
        toast({
          title: "Sign in required",
          description: "Log in to save a school logo to your profile.",
          variant: "destructive",
        });
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("profileId", profileId);

    try {
      setIsUploadingLogo(true);
      const response = await fetch("/api/profile/logo/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to upload logo");
      }

      const payload = (await response.json()) as { url?: string | null };
      const url = payload.url ?? null;
      setState(prev => ({ ...prev, schoolLogoUrl: url }));
      toast({ title: "School logo updated" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to upload logo",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
      event.target.value = "";
    }
  };

  const handleLogoRemove = async () => {
    setState(prev => ({ ...prev, schoolLogoUrl: null }));
    if (!profileId) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ school_logo_url: null })
        .eq("id", profileId);

      if (error) throw error;
      toast({ title: "Logo removed" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to update profile",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const formattedDate = useMemo(() => {
    if (!lessonMetadata.date) return null;
    try {
      const date = new Date(lessonMetadata.date);
      if (Number.isNaN(date.getTime())) {
        return lessonMetadata.date;
      }
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (error) {
      console.error(error);
      return lessonMetadata.date;
    }
  }, [lessonMetadata.date]);

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

      <Card className="border-none bg-background">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-2xl font-semibold">Lesson blueprint</CardTitle>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="lesson-title-input">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="lesson-logo-input">
                School logo
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40">
                  {state.schoolLogoUrl ? (
                    <img src={state.schoolLogoUrl} alt="School logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="px-2 text-center text-xs text-muted-foreground">Upload logo</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo || (!profileId && typeof window !== "undefined")}
                  >
                    {isUploadingLogo ? "Uploading..." : state.schoolLogoUrl ? "Replace logo" : "Upload logo"}
                  </Button>
                  {state.schoolLogoUrl ? (
                    <Button type="button" variant="ghost" size="sm" onClick={handleLogoRemove} disabled={isUploadingLogo}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <input
                id="lesson-logo-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-muted-foreground">
                {profileId ? "Saved to your profile for future lessons." : "Sign in to save your logo for future plans."}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="lesson-date-input">
                Lesson date
              </label>
              <Input
                id="lesson-date-input"
                type="date"
                value={state.lessonDate}
                onChange={event => setState(prev => ({ ...prev, lessonDate: event.target.value }))}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {lessonMetadata.steps} steps • Stage: {lessonMetadata.stage || "Choose"} • Subject: {lessonMetadata.subject || "Pick"}
            {formattedDate ? ` • Date: ${formattedDate}` : ""}
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

      <BuilderCommandPalette
        onAddStep={addStep}
        onDuplicateStep={() => duplicateStep(state.steps[state.steps.length - 1]?.id ?? "")}
        onFocusSearch={() =>
          document.querySelector<HTMLButtonElement>("button[data-builder-resource-search]")?.focus()
        }
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
