import type { LessonPlanMetaDraft } from "../types";
import type { MyClassSummary } from "@/hooks/useMyClasses";

interface LessonPreviewPaneProps {
  meta: LessonPlanMetaDraft;
  profile: {
    fullName: string | null | undefined;
    schoolName: string | null | undefined;
    schoolLogoUrl: string | null | undefined;
  };
  classes: MyClassSummary[];
}

const normalizeText = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const formatPreviewDate = (value: string | null | undefined) => {
  const today = new Date();
  if (!value) {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(today);
  }

  const parsed = new Date(value);
  const target = Number.isNaN(parsed.getTime()) ? today : parsed;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(target);
};

export function LessonPreviewPane({ meta, profile, classes }: LessonPreviewPaneProps) {
  const teacherName = normalizeText(profile.fullName);
  const schoolName = normalizeText(profile.schoolName);
  const schoolLogoUrl = normalizeText(profile.schoolLogoUrl);
  const lessonTitle = normalizeText(meta.title);
  const subject = normalizeText(meta.subject ?? null);
  const objective = normalizeText(meta.objective);
  const successCriteria = normalizeText(meta.successCriteria);

  const classTitle = normalizeText(
    meta.classId ? classes.find(classItem => classItem.id === meta.classId)?.title : null,
  );

  const summaryRows = [
    { label: "Teacher", value: teacherName },
    { label: "Class", value: classTitle },
    { label: "School", value: schoolName },
    { label: "Subject", value: subject },
    { label: "Lesson", value: lessonTitle },
    { label: "Date", value: formatPreviewDate(meta.date) },
  ].filter(row => Boolean(row.value));

  const showSchoolHeader = Boolean(schoolLogoUrl || schoolName);

  return (
    <div className="space-y-6">
      {showSchoolHeader ? (
        <div className="flex items-center gap-4">
          {schoolLogoUrl ? (
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={schoolLogoUrl} alt="School logo" className="h-full w-full object-contain" />
            </div>
          ) : null}
          {schoolName ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">School</p>
              <p className="text-lg font-semibold text-slate-900">{schoolName}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {summaryRows.length ? (
        <dl className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {summaryRows.map((row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm ${
                index > 0 ? "border-t border-slate-200/80" : ""
              }`}
            >
              <dt className="font-medium text-slate-500">{row.label}</dt>
              <dd className="text-slate-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="space-y-4">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Learning Objective</h3>
          {objective ? (
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white/80 p-4 text-sm text-slate-800">
              {objective}
            </p>
          ) : (
            <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
              Add a learning objective to highlight what students will achieve.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Success Criteria</h3>
          {successCriteria ? (
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white/80 p-4 text-sm text-slate-800">
              {successCriteria}
            </p>
          ) : (
            <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
              Outline how students will demonstrate mastery in this lesson.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default LessonPreviewPane;
