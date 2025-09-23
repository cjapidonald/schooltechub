import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { SEO } from "@/components/SEO";
import { ResourceSearchModal } from "@/components/lesson-draft/ResourceSearchModal";
import { StepEditor } from "@/components/lesson-draft/StepEditor";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useMyClasses } from "@/hooks/useMyClasses";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUBJECTS, type Subject } from "@/lib/constants/subjects";
import { useToast } from "@/hooks/use-toast";
import { downloadPlanExport } from "@/lib/downloadPlanExport";
import { linkPlanToClass } from "@/lib/classes";
import { logActivity } from "@/lib/activity-log";
import { useLessonDraftStore } from "@/stores/lessonDraft";
import {
  clearLessonDraftContext,
  getStoredActiveStepId,
  persistActiveStepId,
  setActiveLessonDraftId,
  subscribeToResourceAttachments,
} from "@/lib/lesson-draft-bridge";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

import { LessonMetaForm, type LessonMetaFormValue } from "./components/LessonMetaForm";
import { LessonPreviewPane } from "./components/LessonPreviewPane";
import type { LessonPlanMetaDraft } from "./types";
import { createLessonPlan, getLessonPlan, updateLessonPlan } from "./api";

const AUTOSAVE_DELAY = 800;

const createInitialMeta = (): LessonPlanMetaDraft => ({
  title: "",
  subject: null,
  classId: null,
  date: null,
  objective: "",
  successCriteria: "",
});

function mapSubject(value: string | null): Subject | null {
  if (!value) {
    return null;
  }

  const match = SUBJECTS.find(subject => subject === value);
  return match ?? null;
}

const LessonBuilderPage = () => {
  const [meta, setMeta] = useState<LessonPlanMetaDraft>(createInitialMeta);
  const [planId, setPlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("id");
  const { language, t } = useLanguage();
  const { fullName, schoolName, schoolLogoUrl } = useMyProfile();
  const { classes, isLoading: areClassesLoading, error: classesError } = useMyClasses();
  const { toast } = useToast();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestMeta = useRef(meta);
  const skipNextAutosave = useRef(false);
  const isMounted = useRef(true);
  const [activeExport, setActiveExport] = useState<"pdf" | "docx" | null>(null);
  const [isLinkingToClass, setIsLinkingToClass] = useState(false);
  const [selectedClassForSave, setSelectedClassForSave] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const draftId = useLessonDraftStore(state => state.draft.id);
  const steps = useLessonDraftStore(state => state.draft.steps);
  const attachResource = useLessonDraftStore(state => state.attachResource);
  const [isResourceSearchOpen, setIsResourceSearchOpen] = useState(false);
  const [resourceSearchStepId, setResourceSearchStepId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const authPath = useMemo(() => getLocalizedPath("/auth", language), [language]);

  useEffect(() => {
    latestMeta.current = meta;
  }, [meta]);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) {
          return;
        }
        setIsAuthenticated(Boolean(data.session));
      } catch (error) {
        if (active) {
          console.error("Failed to check authentication status", error);
          setIsAuthenticated(false);
        }
      }
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedClassForSave(undefined);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPlanId(null);
      setLastSavedAt(null);
      skipNextAutosave.current = false;
      return;
    }

    let active = true;

    const initialise = async () => {
      try {
        if (planParam) {
          const record = await getLessonPlan(planParam);
          if (!active || !isMounted.current) {
            return;
          }

          setPlanId(record.id);
          setMeta({
            title: record.title,
            subject: mapSubject(record.subject),
            classId: record.classId,
            date: record.date,
            objective: record.objective,
            successCriteria: record.successCriteria,
          });

          const timestamp = record.lastSavedAt ?? record.updatedAt;
          setLastSavedAt(timestamp ? new Date(timestamp) : null);
          skipNextAutosave.current = true;
        } else {
          const record = await createLessonPlan(latestMeta.current);
          if (!active || !isMounted.current) {
            return;
          }

          setPlanId(record.id);
          const timestamp = record.lastSavedAt ?? record.updatedAt;
          setLastSavedAt(timestamp ? new Date(timestamp) : null);
          skipNextAutosave.current = false;
        }
      } catch (error) {
        console.error("Failed to initialise lesson plan", error);
      }
    };

    void initialise();

    return () => {
      active = false;
    };
  }, [planParam, isAuthenticated]);

  useEffect(() => {
    if (!planId || !isAuthenticated) {
      return;
    }

    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    let active = true;

    autosaveTimer.current = setTimeout(() => {
      const run = async () => {
        try {
          setIsSaving(true);
          const record = await updateLessonPlan(planId, latestMeta.current);
          if (!active || !isMounted.current) {
            return;
          }

          const timestamp = record.lastSavedAt ?? record.updatedAt ?? new Date().toISOString();
          setLastSavedAt(new Date(timestamp));
        } catch (error) {
          console.error("Failed to autosave lesson plan", error);
        } finally {
          if (active && isMounted.current) {
            setIsSaving(false);
          }
        }
      };

      void run();
    }, AUTOSAVE_DELAY);

    return () => {
      active = false;
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
  }, [meta, planId, isAuthenticated]);

  const metaFormValue = useMemo<LessonMetaFormValue>(
    () => ({
      title: meta.title,
      subject: meta.subject,
      classId: meta.classId,
      date: meta.date,
    }),
    [meta.title, meta.subject, meta.classId, meta.date],
  );

  const handleMetaChange = (value: LessonMetaFormValue) => {
    setMeta(prev => ({
      ...prev,
      title: value.title,
      subject: value.subject,
      classId: value.classId,
      date: value.date,
    }));
  };

  const handleObjectiveChange = (value: string) => {
    setMeta(prev => ({ ...prev, objective: value }));
  };

  const handleSuccessCriteriaChange = (value: string) => {
    setMeta(prev => ({ ...prev, successCriteria: value }));
  };

  const normalizedTitle = useMemo(() => {
    const trimmed = meta.title.trim();
    return trimmed.length > 0 ? trimmed : "Untitled lesson";
  }, [meta.title]);

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in to download",
        description: "Create a free account to export this lesson plan as a PDF or DOCX.",
      });
      return;
    }

    if (!planId) {
      toast({
        title: "Lesson not ready",
        description: "Please wait for the lesson plan to finish initialising before downloading.",
        variant: "destructive",
      });
      return;
    }

    setActiveExport(format);

    try {
      const record = await updateLessonPlan(planId, latestMeta.current);
      const timestamp = record.lastSavedAt ?? record.updatedAt ?? new Date().toISOString();
      setLastSavedAt(new Date(timestamp));
      await downloadPlanExport(planId, format, normalizedTitle);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: format === "pdf" ? "Unable to download PDF" : "Unable to download DOCX",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActiveExport(null);
    }
  };

  const handleSaveToClass = async (classId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Create a free account to save this lesson to one of your classes.",
      });
      setSelectedClassForSave(undefined);
      return;
    }

    if (!planId) {
      toast({
        title: "Lesson not ready",
        description: "Please wait for the lesson plan to finish initialising before saving to a class.",
        variant: "destructive",
      });
      setSelectedClassForSave(undefined);
      return;
    }

    setIsLinkingToClass(true);

    try {
      const record = await updateLessonPlan(planId, latestMeta.current);
      const timestamp = record.lastSavedAt ?? record.updatedAt ?? new Date().toISOString();
      setLastSavedAt(new Date(timestamp));

      await linkPlanToClass(planId, classId);
      const classSummary = classes.find(item => item.id === classId);
      toast({
        title: "Lesson linked",
        description: classSummary
          ? `Linked to ${classSummary.title}.`
          : "Lesson linked to the selected class.",
      });

      logActivity(
        "plan-saved",
        `Linked “${normalizedTitle}” to ${classSummary ? `“${classSummary.title}”` : "a class"}.`,
        {
          planId,
          planTitle: normalizedTitle,
          classId,
          classTitle: classSummary?.title ?? "",
          lessonDate: latestMeta.current.date ?? "",
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Unable to link lesson",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLinkingToClass(false);
      setSelectedClassForSave(undefined);
    }
  };

  const previewProfile = useMemo(
    () => ({
      fullName,
      schoolName,
      schoolLogoUrl,
    }),
    [fullName, schoolName, schoolLogoUrl],
  );

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

  const savingCopy = t.lessonBuilder.toolbar;
  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) {
      return null;
    }

    try {
      return `${savingCopy.lastSavedPrefix} ${format(lastSavedAt, "HH:mm")}`;
    } catch {
      return `${savingCopy.lastSavedPrefix}`;
    }
  }, [lastSavedAt, savingCopy.lastSavedPrefix]);

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
        description="Plan lesson logistics and craft each instructional step from a single workspace."
      />
      <main className="container mx-auto space-y-10 px-4">
        <header className="mx-auto max-w-3xl space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Lesson Builder</h1>
          <div className="flex justify-center text-sm text-muted-foreground">
            {isSaving ? (
              <span className="inline-flex items-center gap-2" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                {savingCopy.savingLabel}
              </span>
            ) : lastSavedLabel ? (
              <span>{lastSavedLabel}</span>
            ) : null}
          </div>
          <p className="text-base text-muted-foreground">
            Draft lesson details, attach resources, and keep everything organised from a single workspace.
          </p>
        </header>

        <section className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
          <div className="space-y-4 md:flex md:items-center md:justify-between md:space-y-0">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Save to a class</h2>
              <p className="text-sm text-muted-foreground">
                Link this lesson to one of your classes when you're ready to teach it.
              </p>
            </div>
            {isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedClassForSave}
                  onValueChange={value => {
                    setSelectedClassForSave(value);
                  }}
                  disabled={
                    isLinkingToClass ||
                    Boolean(activeExport) ||
                    !planId ||
                    areClassesLoading ||
                    Boolean(classesError) ||
                    classes.length === 0
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue
                      placeholder={
                        areClassesLoading
                          ? "Loading classes..."
                          : classesError
                            ? classesError.message
                            : classes.length === 0
                              ? "No classes available"
                              : "Select a class"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {areClassesLoading ? (
                      <SelectItem value="__loading" disabled>
                        Loading classes...
                      </SelectItem>
                    ) : classesError ? (
                      <SelectItem value="__error" disabled>
                        {classesError.message}
                      </SelectItem>
                    ) : classes.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        No classes available
                      </SelectItem>
                    ) : (
                      classes.map(classItem => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedClassForSave) {
                      void handleSaveToClass(selectedClassForSave);
                    }
                  }}
                  disabled={!selectedClassForSave || isLinkingToClass}
                >
                  {isLinkingToClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save lesson
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 text-left md:items-end md:text-right">
                <p className="text-sm text-muted-foreground">
                  Sign in to save this lesson to a class.
                </p>
                <Button type="button" asChild>
                  <Link to={authPath}>Sign in</Link>
                </Button>
              </div>
            )}
            {isAuthenticated && classesError ? (
              <p className="text-sm text-destructive">{classesError.message}</p>
            ) : null}
            {isAuthenticated && !areClassesLoading && !classesError && classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don't have any classes yet. Create one from your account dashboard to link this lesson.
              </p>
            ) : null}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Lesson details</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Adjust your lesson title, subject, class, and supporting details. Updates appear in the preview instantly.
                  </p>
                </div>

                <LessonMetaForm value={metaFormValue} onChange={handleMetaChange} />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-objective" className="text-sm font-medium text-foreground">
                      Learning objective
                    </Label>
                    <Textarea
                      id="lesson-objective"
                      rows={5}
                      value={meta.objective}
                      onChange={event => handleObjectiveChange(event.target.value)}
                      placeholder="What knowledge or skills will students gain?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lesson-success-criteria" className="text-sm font-medium text-foreground">
                      Success criteria
                    </Label>
                    <Textarea
                      id="lesson-success-criteria"
                      rows={5}
                      value={meta.successCriteria}
                      onChange={event => handleSuccessCriteriaChange(event.target.value)}
                      placeholder="How will students demonstrate mastery?"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Lesson steps</h2>
                <p className="text-sm text-muted-foreground">
                  Add learning resources to each step so everything you need for class is in one place.
                </p>
              </div>
              <StepEditor
                onRequestResourceSearch={handleRequestResourceSearch}
                activeResourceStepId={resourceSearchStepId}
                isResourceSearchOpen={isResourceSearchOpen}
              />
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <aside className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">Lesson overview preview</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                This pane mirrors what teachers see. As you update details, the summary refreshes automatically.
              </p>
              <div className="mt-6">
                <LessonPreviewPane meta={meta} profile={previewProfile} classes={classes} />
              </div>
            </aside>
codex/fix-preview-position-in-lesson-builder

            <div className="hidden lg:block">
              <div className="sticky top-6">
                <LessonPreview />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <Collapsible open={isMobilePreviewOpen} onOpenChange={setIsMobilePreviewOpen}>
            <CollapsibleTrigger asChild>

          </div>
        </div>

        <section className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
          <div className="space-y-4 md:flex md:items-center md:justify-between md:space-y-0">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Export your lesson</h2>
              <p className="text-sm text-muted-foreground">
                Download a copy of this plan to share or print.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
 main
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDownload("pdf")}
                disabled={!isAuthenticated || Boolean(activeExport) || !planId}
              >
                {activeExport === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Download PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDownload("docx")}
                disabled={!isAuthenticated || Boolean(activeExport) || !planId}
              >
                {activeExport === "docx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Download DOCX
              </Button>
            </div>
          </div>
          {!isAuthenticated ? (
            <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              <p>Sign in to download your lesson plan.</p>
              <Button type="button" variant="secondary" className="mt-3" asChild>
                <Link to={authPath}>Sign in</Link>
              </Button>
            </div>
          ) : null}
        </section>
      </main>

      <ResourceSearchModal
        open={isResourceSearchOpen}
        onOpenChange={handleResourceDialogChange}
        activeStepId={resourceSearchStepId}
      />
    </div>
  );
};

export default LessonBuilderPage;
