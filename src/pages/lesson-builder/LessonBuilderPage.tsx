import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { DndContext, DragOverlay, type DragCancelEvent, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";

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
import { linkPlanToClass, listClassLessons, type ClassLessonSummary } from "@/lib/classes";
import { LessonMetaForm, type LessonMetaFormValue } from "./components/LessonMetaForm";
import { LessonPreviewPane } from "./components/LessonPreviewPane";
import { LessonPreview } from "@/components/lesson-draft/LessonPreview";
import { LessonDocEditor } from "@/pages/account/LessonDocEditor";
import type { LessonPlanMetaDraft } from "./types";
import type { Resource, ResourceDetail } from "@/types/resources";
import { createLessonPlan, getLessonPlan, updateLessonPlan } from "./api";
import { LessonResourceSidebar } from "./components/LessonResourceSidebar";
import { ResourceCard } from "@/components/lesson-draft/ResourceCard";

const AUTOSAVE_DELAY = 800;

const createInitialMeta = (): LessonPlanMetaDraft => ({
  title: "",
  teacher: null,
  subject: null,
  date: null,
  objective: "",
  successCriteria: "",
  classId: null,
  lessonId: null,
  sequence: null,
  stage: null,
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

interface LessonContextChange {
  classId: string | null;
  classTitle: string | null;
  lessonId: string | null;
  lessonTitle: string;
  subject: string | null;
  stage: string | null;
  date: string | null;
  sequence: number | null;
}

interface LessonBuilderPageProps {
  layoutMode?: "standalone" | "embedded";
  initialMeta?: Partial<LessonPlanMetaDraft> | null;
  initialClassId?: string | null;
  onLessonContextChange?: (context: LessonContextChange) => void;
}

const NO_LESSON_VALUE = "__no_lesson__";

const LessonBuilderPage = ({
  layoutMode = "standalone",
  initialMeta = null,
  initialClassId = null,
  onLessonContextChange,
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
  const metaInitialClassId =
    typeof initialMeta?.classId === "string" && initialMeta.classId.trim().length > 0
      ? initialMeta.classId
      : null;
  const resolvedInitialClassId = initialClassId ?? metaInitialClassId ?? searchParamClassId;
  const { language, t } = useLanguage();
  const contextCopy = t.lessonBuilder.contextSelector;
  const classLinkingCopy = t.lessonBuilder.classLinking;
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
  const [activeDragResource, setActiveDragResource] = useState<Resource | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const { classes, isLoading: isLoadingClasses, error: classesError } = useMyClasses();
  const [isLinkingClass, setIsLinkingClass] = useState(false);
  const [preselectedClassId, setPreselectedClassId] = useState<string | undefined>(
    resolvedInitialClassId ?? undefined,
  );
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(
    resolvedInitialClassId ?? undefined,
  );
  const [lessonsByClass, setLessonsByClass] = useState<Record<string, ClassLessonSummary[]>>({});
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialMeta) {
      return;
    }

    const sanitizedEntries = Object.entries(initialMeta).filter(([, value]) => value !== undefined);
    if (sanitizedEntries.length === 0) {
      return;
    }

    const sanitized = Object.fromEntries(sanitizedEntries) as Partial<LessonPlanMetaDraft>;

    setMeta(prev => ({
      ...prev,
      ...sanitized,
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
    const normalizedClassId = selectedClassId ?? null;
    setMeta(prev => {
      if (prev.classId === normalizedClassId) {
        return prev;
      }

      return { ...prev, classId: normalizedClassId };
    });
  }, [selectedClassId]);

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
  }, [fullName, lessonDocHtml, meta]);

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
    if (!selectedClassId) {
      setIsLoadingLessons(false);
      setLessonsError(null);
      return;
    }

    if (!isAuthenticated) {
      setLessonsByClass(prev => ({ ...prev, [selectedClassId]: prev[selectedClassId] ?? [] }));
      setIsLoadingLessons(false);
      setLessonsError(null);
      return;
    }

    let active = true;
    setIsLoadingLessons(true);
    setLessonsError(null);

    const loadLessons = async () => {
      try {
        const lessons = await listClassLessons(selectedClassId);
        if (!active || !isMounted.current) {
          return;
        }

        setLessonsByClass(prev => ({ ...prev, [selectedClassId]: lessons }));

        const currentLessonId = latestMeta.current.lessonId;
        if (currentLessonId) {
          const matchedLesson = lessons.find(lesson => lesson.id === currentLessonId);

          if (!matchedLesson) {
            setMeta(prev => {
              if (prev.lessonId === null && prev.sequence === null && prev.stage === null) {
                return prev;
              }

              return { ...prev, lessonId: null, sequence: null, stage: null };
            });
          } else {
            setMeta(prev => {
              const nextSequence = matchedLesson.sequence ?? null;
              const nextStage = matchedLesson.stage ?? null;

              if (
                prev.lessonId === matchedLesson.id &&
                prev.sequence === nextSequence &&
                prev.stage === nextStage
              ) {
                return prev;
              }

              return {
                ...prev,
                lessonId: matchedLesson.id,
                sequence: nextSequence,
                stage: nextStage,
              };
            });
          }
        }
      } catch (error) {
        if (!active || !isMounted.current) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load lessons.";
        setLessonsError(message);
        setLessonsByClass(prev => ({ ...prev, [selectedClassId]: [] }));
      } finally {
        if (active && isMounted.current) {
          setIsLoadingLessons(false);
        }
      }
    };

    void loadLessons();

    return () => {
      active = false;
    };
  }, [isAuthenticated, selectedClassId, setMeta]);

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
          setMeta(prev => ({
            ...prev,
            title: record.title,
            subject: mapSubject(record.subject),
            date: record.date,
            objective: record.objective,
            successCriteria: record.successCriteria,
            classId: record.classId ?? prev.classId ?? null,
          }));

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
      let nextMetaSnapshot: LessonPlanMetaDraft | null = null;
      setMeta(prev => {
        if (prev.classId === classId && prev.lessonId === null && prev.sequence === null && prev.stage === null) {
          nextMetaSnapshot = prev;
          return prev;
        }

        const updated: LessonPlanMetaDraft = {
          ...prev,
          classId,
          lessonId: null,
          sequence: null,
          stage: null,
        };
        nextMetaSnapshot = updated;
        return updated;
      });

      setLessonsError(null);

      const selectedClass = classes.find(classItem => classItem.id === classId);
      const classTitle = selectedClass?.title ?? null;

      if (!planId) {
        toast({
          title: "Lesson not ready",
          description: "Save or export your lesson before linking it to a class.",
        });
        setSelectedClassId(classId);
        if (nextMetaSnapshot && onLessonContextChange) {
          onLessonContextChange({
            classId,
            classTitle,
            lessonId: null,
            lessonTitle: nextMetaSnapshot.title,
            subject: nextMetaSnapshot.subject ?? null,
            stage: nextMetaSnapshot.stage ?? null,
            date: nextMetaSnapshot.date ?? null,
            sequence: null,
          });
        }
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
        if (nextMetaSnapshot && onLessonContextChange) {
          onLessonContextChange({
            classId,
            classTitle,
            lessonId: null,
            lessonTitle: nextMetaSnapshot.title,
            subject: nextMetaSnapshot.subject ?? null,
            stage: nextMetaSnapshot.stage ?? null,
            date: nextMetaSnapshot.date ?? null,
            sequence: null,
          });
        }
      }
    },
    [classes, planId, toast, onLessonContextChange, setMeta],
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

  const handleLessonSelection = useCallback(
    (lessonId: string | null) => {
      const classId = selectedClassId ?? null;
      const selectedClass = classId ? classes.find(classItem => classItem.id === classId) : null;
      const classTitle = selectedClass?.title ?? null;

      if (!lessonId) {
        let nextMetaSnapshot: LessonPlanMetaDraft | null = null;
        setMeta(prev => {
          const updated: LessonPlanMetaDraft = {
            ...prev,
            lessonId: null,
            sequence: null,
            stage: null,
          };
          nextMetaSnapshot = updated;
          return updated;
        });

        if (nextMetaSnapshot && onLessonContextChange) {
          onLessonContextChange({
            classId,
            classTitle,
            lessonId: null,
            lessonTitle: nextMetaSnapshot.title,
            subject: nextMetaSnapshot.subject ?? null,
            stage: nextMetaSnapshot.stage ?? null,
            date: nextMetaSnapshot.date ?? null,
            sequence: null,
          });
        }
        return;
      }

      const lessons = classId ? lessonsByClass[classId] ?? [] : [];
      const matchedLesson = lessons.find(lesson => lesson.id === lessonId) ?? null;

      let nextMetaSnapshot: LessonPlanMetaDraft | null = null;
      setMeta(prev => {
        if (!matchedLesson) {
          const updated: LessonPlanMetaDraft = {
            ...prev,
            classId,
            lessonId,
          };
          nextMetaSnapshot = updated;
          return updated;
        }

        const lessonTitle = matchedLesson.title.trim();
        const subjectFromLesson = mapSubject(matchedLesson.subject ?? null);

        const updated: LessonPlanMetaDraft = {
          ...prev,
          title: lessonTitle.length > 0 ? lessonTitle : prev.title,
          subject: subjectFromLesson ?? prev.subject,
          date: matchedLesson.scheduledOn ?? prev.date,
          lessonId: matchedLesson.id,
          classId,
          sequence: matchedLesson.sequence ?? null,
          stage: matchedLesson.stage ?? prev.stage ?? null,
        };
        nextMetaSnapshot = updated;
        return updated;
      });

      if (nextMetaSnapshot && onLessonContextChange) {
        onLessonContextChange({
          classId,
          classTitle,
          lessonId: matchedLesson?.id ?? lessonId,
          lessonTitle: nextMetaSnapshot.title,
          subject: nextMetaSnapshot.subject ?? null,
          stage: nextMetaSnapshot.stage ?? null,
          date: nextMetaSnapshot.date ?? null,
          sequence: matchedLesson?.sequence ?? null,
        });
      }
    },
    [classes, lessonsByClass, onLessonContextChange, selectedClassId, setMeta],
  );

  const selectedClass = useMemo(
    () => classes.find(classItem => classItem.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const availableLessons = useMemo(
    () => (selectedClassId ? lessonsByClass[selectedClassId] ?? [] : []),
    [lessonsByClass, selectedClassId],
  );

  const lessonPlaceholder = useMemo(() => {
    if (!selectedClassId) {
      return contextCopy.lessonDisabled;
    }
    if (isLoadingLessons) {
      return contextCopy.lessonLoading;
    }
    if (lessonsError) {
      return contextCopy.lessonError;
    }
    if (availableLessons.length === 0) {
      return contextCopy.lessonEmpty;
    }
    return contextCopy.lessonPlaceholder;
  }, [
    availableLessons.length,
    contextCopy.lessonDisabled,
    contextCopy.lessonEmpty,
    contextCopy.lessonError,
    contextCopy.lessonLoading,
    contextCopy.lessonPlaceholder,
    isLoadingLessons,
    lessonsError,
    selectedClassId,
  ]);

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as { resource?: Resource | null } | null;
    if (data && data.resource) {
      setActiveDragResource(data.resource);
    } else {
      setActiveDragResource(null);
    }
  }, []);

  const clearActiveDrag = useCallback(() => {
    setActiveDragResource(null);
  }, []);

  const handleDragEnd = useCallback((_: DragEndEvent) => {
    clearActiveDrag();
  }, [clearActiveDrag]);

  const handleDragCancel = useCallback((_: DragCancelEvent) => {
    clearActiveDrag();
  }, [clearActiveDrag]);

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
    layoutMode === "embedded"
      ? "space-y-10"
      : "relative min-h-screen overflow-hidden bg-slate-950/90 py-10";
  const mainClasses =
    layoutMode === "embedded"
      ? "space-y-10"
      : "relative container mx-auto space-y-10 px-4";

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className={containerClasses}>
        {layoutMode === "standalone" ? (
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_rgba(15,23,42,0.92))]" />
        ) : null}
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

        <section className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{contextCopy.title}</h2>
            <p className="text-sm text-muted-foreground">{contextCopy.description}</p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-context-class" className="text-sm font-medium text-foreground">
                {contextCopy.classLabel}
              </Label>
              <Select
                value={selectedClassId}
                onValueChange={value => {
                  if (value === selectedClassId) {
                    return;
                  }
                  setSelectedClassId(value);
                  setLessonsError(null);
                  void handleClassSelection(value);
                }}
                disabled={
                  !isAuthenticated || isLinkingClass || isLoadingClasses || classes.length === 0
                }
              >
                <SelectTrigger id="lesson-context-class" aria-label={classLinkingCopy.ariaLabel}>
                  <SelectValue
                    placeholder={
                      isLoadingClasses ? classLinkingCopy.loading : classLinkingCopy.placeholder
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <SelectItem value="no-classes" disabled>
                      {isLoadingClasses ? classLinkingCopy.loading : classLinkingCopy.noClasses}
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
              <p className="text-xs text-muted-foreground">
                {isAuthenticated ? classLinkingCopy.signedInHelp : classLinkingCopy.signedOutHelp}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-context-lesson" className="text-sm font-medium text-foreground">
                {contextCopy.lessonLabel}
              </Label>
              <Select
                value={meta.lessonId ?? undefined}
                onValueChange={value => {
                  const normalized = value === NO_LESSON_VALUE ? null : value;
                  handleLessonSelection(normalized);
                }}
                disabled={!selectedClassId || isLoadingLessons}
              >
                <SelectTrigger id="lesson-context-lesson">
                  <SelectValue placeholder={lessonPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LESSON_VALUE}>{contextCopy.newLesson}</SelectItem>
                  {isLoadingLessons ? (
                    <SelectItem value="__loading" disabled>
                      {contextCopy.lessonLoading}
                    </SelectItem>
                  ) : lessonsError ? (
                    <SelectItem value="__error" disabled>
                      {lessonsError}
                    </SelectItem>
                  ) : availableLessons.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      {contextCopy.lessonEmpty}
                    </SelectItem>
                  ) : (
                    availableLessons.map(lesson => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.sequence ? `#${lesson.sequence} • ${lesson.title}` : lesson.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {lessonsError ? <p className="text-xs text-destructive">{lessonsError}</p> : null}
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] xl:items-start">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
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
                      className="border-white/20 bg-white/10 text-foreground placeholder:text-slate-200/60 backdrop-blur"
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
                      className="border-white/20 bg-white/10 text-foreground placeholder:text-slate-200/60 backdrop-blur"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Lesson plan document</h2>
                <p className="text-sm text-muted-foreground">
                  Draft the lesson narrative while exploring resources alongside your document. Fields are prefilled from your
                  saved context to keep everything aligned.
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

            <section className="space-y-6 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
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
            <aside className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
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

        <section className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
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
                className="border-white/20 bg-white/10 text-foreground shadow-[0_12px_40px_-20px_rgba(56,189,248,0.85)] backdrop-blur"
              >
                {activeExport === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Download PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDownload("docx")}
                disabled={Boolean(activeExport)}
                className="border-white/20 bg-white/10 text-foreground shadow-[0_12px_40px_-20px_rgba(129,140,248,0.85)] backdrop-blur"
              >
                {activeExport === "docx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Download DOCX
              </Button>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Downloads are not saved to your account. Save or share the file once it finishes downloading.
          </p>
        </section>
      </div>

      <ResourceSearchModal
        open={isResourceSearchOpen}
        onOpenChange={handleResourceDialogChange}
        activeStepId={resourceSearchStepId}
      />
      </div>
      <DragOverlay>
        {activeDragResource ? (
          <div className="w-72 max-w-full">
            <ResourceCard resource={activeDragResource} layout="vertical" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default LessonBuilderPage;
