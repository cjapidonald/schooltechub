import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useMyClasses } from "@/hooks/useMyClasses";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUBJECTS, type Subject } from "@/lib/constants/subjects";

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
  const { t } = useLanguage();
  const { fullName, schoolName, schoolLogoUrl } = useMyProfile();
  const { classes } = useMyClasses();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestMeta = useRef(meta);
  const skipNextAutosave = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    latestMeta.current = meta;
  }, [meta]);

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
  }, [planParam]);

  useEffect(() => {
    if (!planId) {
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
  }, [meta, planId]);

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

  const previewProfile = useMemo(
    () => ({
      fullName,
      schoolName,
      schoolLogoUrl,
    }),
    [fullName, schoolName, schoolLogoUrl],
  );

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

  return (
    <main className="bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Lesson Builder</h1>
          <div className="mt-2 flex justify-center text-sm text-slate-600">
            {isSaving ? (
              <span className="inline-flex items-center gap-2" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                {savingCopy.savingLabel}
              </span>
            ) : lastSavedLabel ? (
              <span>{lastSavedLabel}</span>
            ) : null}
          </div>
          <p className="mt-2 text-base text-slate-600">
            Draft your lesson on the left and preview the experience on the right.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Lesson details</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Adjust your lesson title, subject, class, and supporting details. Updates appear in the preview instantly.
                </p>
              </div>

              <LessonMetaForm value={metaFormValue} onChange={handleMetaChange} />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lesson-objective" className="text-sm font-medium text-slate-700">
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
                  <Label htmlFor="lesson-success-criteria" className="text-sm font-medium text-slate-700">
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

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-semibold text-slate-900">Preview</h2>
            <p className="mt-3 text-sm text-slate-600">
              This pane mirrors what teachers see. As you update details, the summary refreshes automatically.
            </p>
            <div className="mt-6">
              <LessonPreviewPane meta={meta} profile={previewProfile} classes={classes} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default LessonBuilderPage;
