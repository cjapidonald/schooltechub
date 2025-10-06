import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import LessonBuilderPage from "@/pages/lesson-builder/LessonBuilderPage";

import type {
  DashboardTranslations,
  LessonBuilderRouteContext,
  LessonBuilderSummaryItem,
} from "./dashboard-utils";

interface LessonBuilderTabContentProps {
  panelClassName: string;
  translations: DashboardTranslations;
  lessonBuilderContext: LessonBuilderRouteContext | null;
  summaryItems: LessonBuilderSummaryItem[];
  onBrowseCurriculum: () => void;
}

export function LessonBuilderTabContent({
  panelClassName,
  translations,
  lessonBuilderContext,
  summaryItems,
  onBrowseCurriculum,
}: LessonBuilderTabContentProps) {
  if (!lessonBuilderContext) {
    return (
      <div
        className={cn(
          panelClassName,
          "border-dashed border-white/25 bg-white/5 text-center shadow-[0_25px_80px_-40px_rgba(15,23,42,0.9)]",
        )}
      >
        <h3 className="text-lg font-semibold">
          {translations.dashboard.lessonBuilder.intercept.title}
        </h3>
        <p className="mt-2 text-sm text-white/70">
          {translations.dashboard.lessonBuilder.intercept.description}
        </p>
        <Button
          className="mt-6 rounded-xl border-white/40 bg-white/90 text-slate-900 hover:bg-white"
          variant="outline"
          onClick={onBrowseCurriculum}
        >
          {translations.dashboard.lessonBuilder.intercept.cta}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn(panelClassName, "space-y-6")}>
        <h3 className="text-lg font-semibold">
          {translations.dashboard.lessonBuilder.contextTitle}
        </h3>
        <dl className="mt-4 grid gap-4 text-sm text-white/70 sm:grid-cols-2">
          {summaryItems.map(item => (
            <div key={item.key} className="space-y-1 text-left">
              <dt className="text-xs font-medium uppercase tracking-wide text-white/60">
                {item.label}
              </dt>
              <dd className="text-base font-semibold text-white">
                {item.value ?? translations.dashboard.lessonBuilder.fallback}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={cn(panelClassName, "overflow-hidden p-0 md:p-0")}>
        <LessonBuilderPage
          layoutMode="embedded"
          initialMeta={{
            title: lessonBuilderContext.title,
            date: lessonBuilderContext.date ?? null,
          }}
          initialClassId={lessonBuilderContext.classId ?? null}
        />
      </div>
    </div>
  );
}
