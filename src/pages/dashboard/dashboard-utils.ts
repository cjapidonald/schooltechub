import { format } from "date-fns";

type DashboardTranslations = typeof import("@/translations/en").en;

export const normalizeName = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const deriveNamePartsFromFullName = (fullName: string | null | undefined) => {
  const normalized = normalizeName(fullName);
  if (!normalized) {
    return { firstName: null, lastName: null } as const;
  }

  const segments = normalized.split(/\s+/).filter(Boolean);
  if (segments.length === 0) {
    return { firstName: null, lastName: null } as const;
  }

  if (segments.length === 1) {
    return { firstName: segments[0], lastName: null } as const;
  }

  return { firstName: segments[0], lastName: segments[segments.length - 1] } as const;
};

export const DASHBOARD_TABS = ["curriculum", "classes", "lessonBuilder", "students", "assessments"] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number];

export const isDashboardTab = (value: string | null): value is DashboardTab =>
  Boolean(value && (DASHBOARD_TABS as readonly string[]).includes(value));

export const GLASS_PANEL_CLASS =
  "rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-[0_40px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl md:p-8";

export const GLASS_TAB_TRIGGER_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition backdrop-blur-xl hover:border-white/40 hover:bg-white/15 hover:text-white data-[state=active]:border-white/60 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:shadow-[0_15px_45px_-25px_rgba(15,23,42,0.85)]";

export type LessonBuilderRouteContext = {
  title: string;
  classId: string | null;
  classTitle: string | null;
  stage: string | null;
  date: string | null;
  sequence: number | null;
  curriculumId: string | null;
};

export const formatLessonContextDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return format(new Date(value), "PPP");
  } catch {
    return value;
  }
};

export const splitLessonTitles = (input: string) =>
  input
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

export type LessonBuilderSummaryItem = {
  key: string;
  label: string;
  value: string | null;
};

export type { DashboardTranslations };
