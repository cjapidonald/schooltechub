import { useMemo, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useMyClasses } from "@/hooks/useMyClasses";

import { LessonMetaForm, type LessonMetaFormValue } from "./components/LessonMetaForm";
import { LessonPreviewPane } from "./components/LessonPreviewPane";
import type { LessonPlanMetaDraft } from "./types";

const createInitialMeta = (): LessonPlanMetaDraft => ({
  title: "",
  subject: null,
  classId: null,
  date: null,
  objective: "",
  successCriteria: "",
});

const LessonBuilderPage = () => {
  const [meta, setMeta] = useState<LessonPlanMetaDraft>(createInitialMeta);
  const { fullName, schoolName, schoolLogoUrl } = useMyProfile();
  const { classes } = useMyClasses();

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

  return (
    <main className="bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Lesson Builder</h1>
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
