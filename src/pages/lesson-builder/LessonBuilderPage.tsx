import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

import { SEO } from "@/components/SEO";
import { ResourceSearchModal } from "@/components/lesson-draft/ResourceSearchModal";
import { StepEditor } from "@/components/lesson-draft/StepEditor";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUBJECTS, type Subject } from "@/lib/constants/subjects";
import { useToast } from "@/hooks/use-toast";
import { downloadPlanExport } from "@/lib/downloadPlanExport";
import { useLessonDraftStore } from "@/stores/lessonDraft";
import {
  clearLessonDraftContext,
  getStoredActiveStepId,
  persistActiveStepId,
  setActiveLessonDraftId,
  subscribeToResourceAttachments,
} from "@/lib/lesson-draft-bridge";
import { supabase } from "@/integrations/supabase/client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMyClasses } from "@/hooks/useMyClasses";
import { linkPlanToClass } from "@/lib/classes";
import { LessonMetaForm, type LessonMetaFormValue } from "./components/LessonMetaForm";
import { LessonPreviewPane } from "./components/LessonPreviewPane";
import { LessonPreview } from "@/components/lesson-draft/LessonPreview";
import { LessonDocEditor } from "@/pages/account/LessonDocEditor";
import type { LessonPlanMetaDraft } from "./types";
import type { ResourceDetail } from "@/types/resources";
import { createLessonPlan, getLessonPlan, updateLessonPlan } from "./api";
import { LessonResourceSidebar } from "./components/LessonResourceSidebar";

const AUTOSAVE_DELAY = 800;

const createInitialMeta = (): LessonPlanMetaDraft => ({
  title: "",
  teacher: null,
  subject: null,
  date: null,
  objective: "",
  successCriteria: "",
});

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatMultiline = (value: string): string => escapeHtml(value).replace(/\n/g, "<br />");

const formatDocumentDate = (value: string | null): string => {
  if (!value) {
    return "Not set";
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return escapeHtml(value);
  }

  try {
    return escapeHtml(format(parsed, "PPP"));
  } catch {
    return escapeHtml(value);
  }
};

const createLessonDocTemplate = (meta: LessonPlanMetaDraft, fallbackTeacher: string | null): string => {
  const teacherName = meta.teacher?.trim() || fallbackTeacher?.trim() || "";
  const rows = [
    { label: "Lesson title", value: meta.title.trim() || "Untitled lesson" },
    { label: "Teacher", value: teacherName || "Not assigned" },
    { label: "Subject", value: meta.subject ?? "Not set" },
    { label: "Lesson date", value: formatDocumentDate(meta.date) },
  ];

  const renderRows = rows
    .map(row => {
      const value = typeof row.value === "string" ? escapeHtml(row.value) : "";
      return `
        <tr>
          <th style="text-align:left;padding:0.5rem;border:1px solid #d8dee6;background:#f1f5f9;font-weight:600;">${escapeHtml(
            row.label,
          )}</th>
          <td style="padding:0.5rem;border:1px solid #d8dee6;background:#f1f5f9;">${value}</td>
        </tr>
      `;
    })
    .join("");

  const objectiveContent = meta.objective.trim()
    ? formatMultiline(meta.objective)
    : "<em>Add your learning objectives here.</em>";
  const successCriteriaContent = meta.successCriteria.trim()
    ? formatMultiline(meta.successCriteria)
    : "<em>Describe how students will demonstrate success.</em>";

  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
      <tbody>
        ${renderRows}
      </tbody>
    </table>
    <section style="margin-bottom:1.5rem;">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem;">Learning objectives</h3>
      <p>${objectiveContent}</p>
    </section>
    <section style="margin-bottom:1.5rem;">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem;">Success criteria</h3>
      <p>${successCriteriaContent}</p>
    </section>
    <section style="margin-bottom:1.5rem;">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem;">Lesson narrative</h3>
      <p><em>Use this space to outline your teaching sequence, key questions, and differentiation strategies.</em></p>
    </section>
  `;
};

const createResourceTableMarkup = (resource: ResourceDetail): string => {
  const instructions = resource.instructionalNotes?.trim()
    ? formatMultiline(resource.instructionalNotes)
    : "<em>No specific instructions provided.</em>";
  const description = resource.description?.trim()
    ? formatMultiline(resource.description)
    : "<em>No description available.</em>";
  const details: Array<{ label: string; value: string | null }> = [
    { label: "Format", value: resource.format },
    { label: "Stage", value: resource.stage },
    { label: "Subject", value: resource.subject },
    { label: "Type", value: resource.type },
  ];

  const detailRows = details
    .filter(detail => detail.value && detail.value.trim().length > 0)
    .map(detail => `
      <tr>
        <th style="text-align:left;padding:0.5rem;border:1px solid #d8dee6;background:#f8fafc;">${escapeHtml(detail.label)}</th>
        <td style="padding:0.5rem;border:1px solid #d8dee6;">${escapeHtml(detail.value ?? "")}</td>
      </tr>
    `)
    .join("");

  const link = resource.url
    ? `<a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">Open resource</a>`
    : "<em>Link not available</em>";

  const resourceHeader = escapeHtml(resource.title || "Resource");

  return `
    <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;">
      <caption style="caption-side:top;text-align:left;font-weight:600;margin-bottom:0.5rem;">${resourceHeader}</caption>
      <tbody>
        <tr>
          <th style="text-align:left;padding:0.5rem;border:1px solid #d8dee6;background:#f8fafc;">Instructions</th>
          <td style="padding:0.5rem;border:1px solid #d8dee6;">${instructions}</td>
        </tr>
        <tr>
          <th style="text-align:left;padding:0.5rem;border:1px solid #d8dee6;background:#f8fafc;">Resource</th>
          <td style="padding:0.5rem;border:1px solid #d8dee6;">${link}</td>
        </tr>
        <tr>
          <th style="text-align:left;padding:0.5rem;border:1px solid #d8dee6;background:#f8fafc;">Summary</th>
          <td style="padding:0.5rem;border:1px solid #d8dee6;">${description}</td>
        </tr>
        ${detailRows}
      </tbody>
    </table>
  `;
};

function mapSubject(value: string | null): Subject | null {
  if (!value) {
    return null;
  }

  const match = SUBJECTS.find(subject => subject === value);
  return match ?? null;
}

interface LessonBuilderPageProps {
  layoutMode?: "standalone" | "embedded";
  initialMeta?: Partial<LessonPlanMetaDraft> | null;
  initialClassId?: string | null;
}

const LessonBuilderPage = ({
  layoutMode = "standalone",
  initialMeta = null,
  initialClassId = null,
}: LessonBuilderPageProps = {}) => {
  const [meta, setMeta] = useState<LessonPlanMetaDraft>(() => ({
    ...createInitialMeta(),
    ...(initialMeta ?? {}),
  }));
  const [planId, setPlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [searchParams] = useSearchParams();
  const planParam = layoutMode === "standalone" ? searchParams.get("id") : null;
  const searchParamClassId = layoutMode === "standalone" ? searchParams.get("classId") : null;
  const resolvedInitialClassId = initialClassId ?? searchParamClassId;
  const { language, t } = useLanguage();
  const { fullName, schoolName, schoolLogoUrl } = useMyProfile();
  const { toast } = useToast();
  const docTemplateRef = useRef<string>("");
  if (docTemplateRef.current === "") {
    docTemplateRef.current = createLessonDocTemplate(meta, fullName ?? null);
  }
  const [lessonDocHtml, setLessonDocHtml] = useState<string>(docTemplateRef.current);
  const [lessonDocBackground, setLessonDocBackground] = useState<string>("default");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestMeta = useRef(meta);
  const skipNextAutosave = useRef(false);
  const isMounted = useRef(true);
  const isDocDirty = useRef(false);
  const [activeExport, setActiveExport] = useState<"pdf" | "docx" | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const draftId = useLessonDraftStore(state => state.draft.id);
  const steps = useLessonDraftStore(state => state.draft.steps);
  const attachResource = useLessonDraftStore(state => state.attachResource);
  const [isResourceSearchOpen, setIsResourceSearchOpen] = useState(false);
  const [resourceSearchStepId, setResourceSearchStepId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const { classes, isLoading: isLoadingClasses, error: classesError } = useMyClasses();
  const [isLinkingClass, setIsLinkingClass] = useState(false);
  const [preselectedClassId, setPreselectedClassId] = useState<string | undefined>(
    resolvedInitialClassId ?? undefined,
  );
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(
    resolvedInitialClassId ?? undefined,
  );

  useEffect(() => {
    if (!initialMeta) {
      return;
    }

    setMeta(prev => ({
      ...prev,
      ...initialMeta,
    }));
  }, [initialMeta]);

  useEffect(() => {
    if (!resolvedInitialClassId) {
      return;
    }

    setPreselectedClassId(resolvedInitialClassId ?? undefined);
    setSelectedClassId(current => {
      if (current === resolvedInitialClassId) {
        return current;
      }
      return resolvedInitialClassId ?? undefined;
    });
  }, [resolvedInitialClassId]);

  useEffect(() => {
    latestMeta.current = meta;
  }, [meta]);

  useEffect(() => {
    const trimmedTeacher = meta.teacher?.trim();
    const profileName = fullName?.trim();
    if (!trimmedTeacher && profileName) {
      setMeta(prev => {
        if (prev.teacher?.trim()) {
          return prev;
        }
        return { ...prev, teacher: profileName };
      });
    }
  }, [fullName, meta.teacher]);

  useEffect(() => {
    const template = createLessonDocTemplate(meta, fullName ?? null);
    const currentHtml = lessonDocHtml;
    const previousTemplate = docTemplateRef.current;
    const isMatch = currentHtml.trim() === previousTemplate.trim();

    if (!isDocDirty.current || isMatch || currentHtml.trim().length === 0) {
      docTemplateRef.current = template;
      if (currentHtml !== template) {
        setLessonDocHtml(template);
      }
      isDocDirty.current = false;
    } else {
      docTemplateRef.current = template;
    }
  }, [
    fullName,
    lessonDocHtml,
    meta.date,
    meta.objective,
    meta.subject,
    meta.successCriteria,
    meta.teacher,
    meta.title,
  ]);

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
    return () => {
      isMounted.current = false;
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!classesError || !isAuthenticated) {
      return;
    }

    toast({
      title: "Unable to load classes",
      description: classesError.message,
      variant: "destructive",
    });
  }, [classesError, isAuthenticated, toast]);

  useEffect(() => {
    if (!preselectedClassId) {
      return;
    }

    if (selectedClassId) {
      return;
    }

    if (classes.some(classItem => classItem.id === preselectedClassId)) {
      setSelectedClassId(preselectedClassId);
    }
  }, [classes, preselectedClassId, selectedClassId]);

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
      teacher: meta.teacher,
      subject: meta.subject,
      date: meta.date,
    }),
    [meta.date, meta.subject, meta.teacher, meta.title],
  );

  const handleMetaChange = (value: LessonMetaFormValue) => {
    setMeta(prev => ({
      ...prev,
      title: value.title,
      teacher: value.teacher,
      subject: value.subject,
      date: value.date,
    }));
  };

  const handleObjectiveChange = (value: string) => {
    setMeta(prev => ({ ...prev, objective: value }));
  };

  const handleSuccessCriteriaChange = (value: string) => {
    setMeta(prev => ({ ...prev, successCriteria: value }));
  };

  const handleLessonDocChange = useCallback((value: string) => {
    isDocDirty.current = true;
    setLessonDocHtml(value);
  }, []);

  const handleResourceInsert = useCallback(
    (resource: ResourceDetail) => {
      isDocDirty.current = true;
      const markup = createResourceTableMarkup(resource);
      setLessonDocHtml(current => {
        const trimmed = current.trim();
        if (!trimmed) {
          return markup;
        }
        return `${current.trimEnd()}\n${markup}`;
      });
      toast({
        title: "Resource added",
        description: `${resource.title} was inserted into your lesson plan document.`,
      });
    },
    [toast],
  );

  const normalizedTitle = useMemo(() => {
    const trimmed = meta.title.trim();
    return trimmed.length > 0 ? trimmed : "Untitled lesson";
  }, [meta.title]);

  const handleClassSelection = useCallback(
    async (classId: string) => {
      if (!planId) {
        toast({
          title: "Lesson not ready",
          description: "Save or export your lesson before linking it to a class.",
        });
        setSelectedClassId(classId);
        return;
      }

      setIsLinkingClass(true);

      try {
        await linkPlanToClass(planId, classId);
        toast({
          title: "Lesson linked",
          description: "This lesson plan is now available in the selected class.",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Please try again.";
        toast({
          title: "Unable to link lesson",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLinkingClass(false);
        setSelectedClassId(classId);
      }
    },
    [planId, toast],
  );

  const handleDownload = async (format: "pdf" | "docx") => {
    setActiveExport(format);

    try {
      let targetPlanId = planId;
      let recordTimestamp: string | null = null;

      if (!targetPlanId) {
        const record = await createLessonPlan(latestMeta.current);
        targetPlanId = record.id;
        setPlanId(record.id);
        recordTimestamp = record.lastSavedAt ?? record.updatedAt ?? new Date().toISOString();
      } else {
        try {
          const record = await updateLessonPlan(targetPlanId, latestMeta.current);
          recordTimestamp = record.lastSavedAt ?? record.updatedAt ?? new Date().toISOString();
        } catch (error) {
          if (isAuthenticated) {
            throw error;
          }
          // Anonymous users may not be able to persist updates; fall back to
          // using the existing draft without blocking the download.
          recordTimestamp = new Date().toISOString();
        }
      }

      if (recordTimestamp) {
        setLastSavedAt(new Date(recordTimestamp));
      }

      if (!targetPlanId) {
        throw new Error("Lesson plan could not be prepared for download.");
      }

      await downloadPlanExport(targetPlanId, format, normalizedTitle);
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

  const containerClasses =
    layoutMode === "embedded" ? "space-y-10" : "min-h-screen bg-muted/20 py-10";
  const mainClasses =
    layoutMode === "embedded"
      ? "space-y-10"
      : "container mx-auto space-y-10 px-4";

  return (
    <div className={containerClasses}>
      {layoutMode === "standalone" ? (
        <SEO
          title="Lesson Builder"
          description="Plan lesson logistics and craft each instructional step from a single workspace."
        />
      ) : null}
      <div className={mainClasses}>
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

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] xl:items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Lesson details</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Adjust your lesson title, subject, and supporting details. Updates appear in the preview instantly.
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
                <h2 className="text-xl font-semibold text-foreground">Lesson plan document</h2>
                <p className="text-sm text-muted-foreground">
                  Draft the lesson narrative while exploring resources alongside your document. Fields are prefilled from your
                  curriculum entry to keep everything aligned.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
                <div className="space-y-3">
                  <LessonDocEditor
                    value={lessonDocHtml}
                    onChange={handleLessonDocChange}
                    background={lessonDocBackground}
                    onBackgroundChange={setLessonDocBackground}
                  />
                </div>

                <LessonResourceSidebar
                  subject={meta.subject}
                  onInsertResource={handleResourceInsert}
                  isAuthenticated={isAuthenticated}
                />
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

          <div className="space-y-6 xl:sticky xl:top-6">
            <aside className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">Lesson overview preview</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                This pane mirrors what teachers see. As you update details, the summary refreshes automatically.
              </p>
              <div className="mt-6 space-y-6">
                <LessonPreviewPane meta={meta} profile={previewProfile} />
                <LessonPreview />
              </div>
            </aside>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDownload("pdf")}
                disabled={Boolean(activeExport)}
              >
                {activeExport === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Download PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDownload("docx")}
                disabled={Boolean(activeExport)}
              >
                {activeExport === "docx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Download DOCX
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="md:w-72">
              <Select
                value={selectedClassId}
                onValueChange={value => {
                  setSelectedClassId(value);
                  void handleClassSelection(value);
                }}
                disabled={
                  !isAuthenticated ||
                  !planId ||
                  isLinkingClass ||
                  isLoadingClasses ||
                  classes.length === 0
                }
              >
                <SelectTrigger aria-label={t.lessonBuilder.classLinking.ariaLabel}>
                  <SelectValue
                    placeholder={
                      isLoadingClasses
                        ? t.lessonBuilder.classLinking.loading
                        : t.lessonBuilder.classLinking.placeholder
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <SelectItem value="no-classes" disabled>
                      {isLoadingClasses
                        ? t.lessonBuilder.classLinking.loading
                        : t.lessonBuilder.classLinking.noClasses}
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
              <p className="mt-2 text-xs text-muted-foreground">
                {isAuthenticated
                  ? t.lessonBuilder.classLinking.signedInHelp
                  : t.lessonBuilder.classLinking.signedOutHelp}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Downloads are not saved to your account. Save or share the file once it finishes downloading.
            </p>
          </div>
        </section>
      </div>

      <ResourceSearchModal
        open={isResourceSearchOpen}
        onOpenChange={handleResourceDialogChange}
        activeStepId={resourceSearchStepId}
      />
    </div>
  );
};

export default LessonBuilderPage;
