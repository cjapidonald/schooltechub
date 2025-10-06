import { cn } from "@/lib/utils";
import { CurriculaList } from "@/components/dashboard/CurriculaList";
import { CurriculumEditor } from "@/components/dashboard/CurriculumEditor";
import type { DashboardCurriculumItem, DashboardCurriculumSummary } from "@/features/dashboard/examples";

import type { DashboardTranslations } from "./dashboard-utils";

interface CurriculumTabContentProps {
  panelClassName: string;
  translations: DashboardTranslations;
  curricula: DashboardCurriculumSummary[];
  curriculaLoading: boolean;
  selectedCurriculum: DashboardCurriculumSummary | null;
  curriculumItems: DashboardCurriculumItem[];
  curriculumItemsLoading: boolean;
  reorderPending: boolean;
  canReorderSelectedCurriculum: boolean;
  onNewCurriculum: () => void;
  onOpenCurriculum: (curriculumId: string) => void;
  onExportCurriculum: (curriculumId: string) => void;
  onPlanLesson: (item: DashboardCurriculumItem) => void;
  onOpenLessonPlan: (item: DashboardCurriculumItem) => void;
  onReorderCurriculumItems: (orderedIds: string[]) => void;
}

export function CurriculumTabContent({
  panelClassName,
  translations,
  curricula,
  curriculaLoading,
  selectedCurriculum,
  curriculumItems,
  curriculumItemsLoading,
  reorderPending,
  canReorderSelectedCurriculum,
  onNewCurriculum,
  onOpenCurriculum,
  onExportCurriculum,
  onPlanLesson,
  onOpenLessonPlan,
  onReorderCurriculumItems,
}: CurriculumTabContentProps) {
  return (
    <>
      <CurriculaList
        className={cn(panelClassName, "space-y-6")}
        curricula={curricula}
        loading={curriculaLoading}
        onNewCurriculum={onNewCurriculum}
        onOpenCurriculum={onOpenCurriculum}
        onExportCurriculum={onExportCurriculum}
      />
      {selectedCurriculum ? (
        <div className={cn(panelClassName, "space-y-4")}>
          <h3 className="text-lg font-semibold">
            {translations.dashboard.curriculumView.title.replace(
              "{title}",
              selectedCurriculum.title,
            )}
          </h3>
          <CurriculumEditor
            items={curriculumItems}
            loading={curriculumItemsLoading}
            reordering={reorderPending}
            onPlanLesson={onPlanLesson}
            onOpenLessonPlan={onOpenLessonPlan}
            onReorder={
              canReorderSelectedCurriculum ? onReorderCurriculumItems : undefined
            }
          />
        </div>
      ) : null}
    </>
  );
}
