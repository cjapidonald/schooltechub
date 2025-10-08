import type { LessonPlanMetaDraft } from "../types";

interface LessonPreviewPaneProps {
  meta: LessonPlanMetaDraft;
  profile: {
    fullName: string | null | undefined;
    schoolName: string | null | undefined;
    schoolLogoUrl: string | null | undefined;
  };
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

const renderRow = (label: string, value?: string | null, valueClassName = "") => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  return (
    <div
      key={label}
      className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm"
    >
      <dt className="font-medium text-slate-200/80">{label}</dt>
      <dd className={`text-white ${valueClassName}`.trim()}>{trimmedValue}</dd>
    </div>
  );
};

export function LessonPreviewPane({ meta, profile }: LessonPreviewPaneProps) {
  const teacherName = normalizeText(profile.fullName);
  const schoolName = normalizeText(profile.schoolName);
  const schoolLogoUrl = normalizeText(profile.schoolLogoUrl);
  const lessonTitle = normalizeText(meta.title);
  const subject = normalizeText(meta.subject ?? null);
  const objective = normalizeText(meta.objective);
  const successCriteria = normalizeText(meta.successCriteria);

  const leftSummaryRows = [
    { label: "Teacher", value: teacherName },
    { label: "School", value: schoolName },
    { label: "Lesson", value: lessonTitle },
    { label: "Date", value: formatPreviewDate(meta.date) },
  ];
  const rightSummaryRows = [
    { label: "Subject", value: subject },
  ];

  const leftSummaryElements = leftSummaryRows.map(row => renderRow(row.label, row.value));
  const rightSummaryElements = rightSummaryRows.map(row =>
    renderRow(row.label, row.value, "text-right")
  );
  const hasSummaryRows =
    leftSummaryElements.some(row => row !== null) || rightSummaryElements.some(row => row !== null);

  const showSchoolHeader = Boolean(schoolLogoUrl || schoolName);

  return (
    <div className="space-y-6">
      {showSchoolHeader ? (
        <div className="flex items-center gap-4">
          {schoolLogoUrl ? (
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-white/20 bg-white/10 backdrop-blur">
              <img src={schoolLogoUrl} alt="School logo" className="h-full w-full object-contain" />
            </div>
          ) : null}
          {schoolName ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-200/80">School</p>
              <p className="text-lg font-semibold text-white">{schoolName}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasSummaryRows ? (
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.8)] backdrop-blur">
          <div className="grid divide-y divide-white/10 md:grid-cols-2 md:divide-x">
            <dl className="divide-y divide-white/10">
              {leftSummaryElements}
            </dl>
            <dl className="divide-y divide-white/10">
              {rightSummaryElements}
            </dl>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200/80">Success Criteria</h3>
          {successCriteria ? (
            <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-slate-100 backdrop-blur">
              {successCriteria}
            </p>
          ) : (
            <p className="mt-2 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-slate-200/70 backdrop-blur">
              Outline how students will demonstrate mastery in this lesson.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200/80">Learning Objective</h3>
          {objective ? (
            <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-slate-100 backdrop-blur">
              {objective}
            </p>
          ) : (
            <p className="mt-2 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-slate-200/70 backdrop-blur">
              Add a learning objective to highlight what students will achieve.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default LessonPreviewPane;
