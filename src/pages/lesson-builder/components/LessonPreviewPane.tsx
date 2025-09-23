import { format, isValid, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import { enUS, sq, vi } from "date-fns/locale";

import { useLanguage } from "@/contexts/LanguageContext";
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

const PREVIEW_DATE_FORMAT = "PPP";

const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  sq,
  vi,
};

const formatPreviewDate = (
  value: string | null | undefined,
  locale: Locale,
) => {
  const today = new Date();
  let target = today;

  if (value) {
    const isoCandidate = parseISO(value);

    if (isValid(isoCandidate)) {
      target = isoCandidate;
    } else {
      const fallbackCandidate = new Date(value);
      if (isValid(fallbackCandidate)) {
        target = fallbackCandidate;
      }
    }
  }

  try {
    return format(target, PREVIEW_DATE_FORMAT, { locale });
  } catch (error) {
    console.error("Failed to format preview date", error);
    return format(today, PREVIEW_DATE_FORMAT, { locale });
  }
};

export function LessonPreviewPane({ meta, profile, classes }: LessonPreviewPaneProps) {
  const { t, language } = useLanguage();
  const previewCopy = t.lessonBuilder.preview;
  const metaCopy = t.lessonBuilder.meta;
  const locale = LOCALE_MAP[language] ?? enUS;

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

  const summaryCopy = previewCopy.summary;
  const sectionsCopy = previewCopy.sections;

  const summaryRows = [
    { label: summaryCopy.teacherLabel, value: teacherName },
    { label: summaryCopy.classLabel, value: classTitle },
    { label: summaryCopy.schoolLabel, value: schoolName },
    { label: summaryCopy.subjectLabel, value: subject },
    { label: summaryCopy.lessonLabel, value: lessonTitle },
    { label: summaryCopy.dateLabel, value: formatPreviewDate(meta.date, locale) },
  ].filter(row => Boolean(row.value));

  const showSchoolHeader = Boolean(schoolLogoUrl || schoolName);

  return (
    <div className="space-y-6">
      {showSchoolHeader ? (
        <div className="flex items-center gap-4">
          {schoolLogoUrl ? (
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={schoolLogoUrl} alt={metaCopy.logoAlt} className="h-full w-full object-contain" />
            </div>
          ) : null}
          {schoolName ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {summaryCopy.schoolLabel}
              </p>
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {sectionsCopy.objectiveTitle}
          </h3>
          {objective ? (
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white/80 p-4 text-sm text-slate-800">
              {objective}
            </p>
          ) : (
            <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
              {sectionsCopy.objectivePlaceholder}
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {sectionsCopy.successCriteriaTitle}
          </h3>
          {successCriteria ? (
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white/80 p-4 text-sm text-slate-800">
              {successCriteria}
            </p>
          ) : (
            <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
              {sectionsCopy.successCriteriaPlaceholder}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default LessonPreviewPane;
