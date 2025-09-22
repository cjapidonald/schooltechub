import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ActivitySearchPanel,
} from "@/components/builder/lesson/ActivitySearchPanel";
import { MetaBar } from "@/components/builder/lesson/MetaBar";
import { PartsSidebar } from "@/components/builder/lesson/PartsSidebar";
import { PlanCanvas } from "@/components/builder/lesson/PlanCanvas";
import { StandardsPicker } from "@/components/builder/lesson/StandardsPicker";
import { Toolbar } from "@/components/builder/lesson/Toolbar";
import { PreviewModal } from "@/components/builder/lesson/PreviewModal";
import type { LessonDetailCopy } from "@/components/lesson-plans/LessonModal";
import {
  autosaveLessonBuilderPlan,
  fetchLessonBuilderHistory,
  fetchLessonBuilderPlan,
  searchLessonBuilderActivities,
} from "@/lib/builder-api";
import type {
  LessonBuilderActivity,
  LessonBuilderPlan,
  LessonBuilderVersionEntry,
} from "@/types/lesson-builder";
import { mergeStepValues } from "@/types/lesson-builder";

const AUTOSAVE_DELAY = 1500;

const BuilderLessonPlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const planQuery = useQuery({
    queryKey: ["builder-plan", id],
    enabled: Boolean(id),
    queryFn: () => fetchLessonBuilderPlan(id as string),
  });

  const historyQuery = useQuery({
    queryKey: ["builder-plan-history", id],
    enabled: Boolean(id),
    queryFn: () => fetchLessonBuilderHistory(id as string),
  });

  const [plan, setPlan] = useState<LessonBuilderPlan | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [activityQuery, setActivityQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPlan = useRef<LessonBuilderPlan | null>(null);

  useEffect(() => {
    if (planQuery.data) {
      setPlan(planQuery.data);
      latestPlan.current = planQuery.data;
      if (!selectedPart && planQuery.data.parts.length > 0) {
        setSelectedPart(planQuery.data.parts[0].id);
      }
      if (!selectedStepId && planQuery.data.steps.length > 0) {
        setSelectedStepId(planQuery.data.steps[0].id);
      }
    }
  }, [planQuery.data, selectedPart, selectedStepId]);

  useEffect(() => () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
  }, []);

  const autosaveMutation = useMutation({
    mutationFn: (updatedPlan: LessonBuilderPlan) => autosaveLessonBuilderPlan(id as string, updatedPlan),
    onSuccess: (updated) => {
      latestPlan.current = updated;
      setPlan(updated);
      queryClient.setQueryData(["builder-plan", id], updated);
      queryClient.setQueryData(["builder-plan-history", id], updated.history);
    },
  });

  const isSaving = autosaveMutation.isPending;

  const scheduleAutosave = useCallback(
    (nextPlan: LessonBuilderPlan) => {
      latestPlan.current = nextPlan;
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
      autosaveTimer.current = setTimeout(() => {
        if (latestPlan.current) {
          autosaveMutation.mutate(latestPlan.current);
        }
      }, AUTOSAVE_DELAY);
    },
    [autosaveMutation]
  );

  const updatePlan = useCallback(
    (updater: (plan: LessonBuilderPlan) => LessonBuilderPlan) => {
      setPlan((current) => {
        if (!current) {
          return current;
        }
        const next = updater(current);
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave]
  );

  const handleAddStep = () => {
    const newStep = mergeStepValues({ title: "" });
    updatePlan((current) => ({
      ...current,
      steps: [...current.steps, newStep],
    }));
    setSelectedStepId(newStep.id);
  };

  const handleRemoveStep = (stepId: string) => {
    updatePlan((current) => {
      const remaining = current.steps.filter((step) => step.id !== stepId);
      setSelectedStepId((prev) => {
        if (prev === stepId) {
          return remaining[0]?.id ?? null;
        }
        return prev;
      });
      return {
        ...current,
        steps: remaining,
      };
    });
  };

  const handleStepChange = (stepId: string, updater: (step: LessonBuilderPlan["steps"][number]) => LessonBuilderPlan["steps"][number]) => {
    updatePlan((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? updater(step) : step)),
    }));
  };

  const handleAddActivity = (activity: LessonBuilderActivity) => {
    if (!selectedStepId) {
      return;
    }
    updatePlan((current) => ({
      ...current,
      steps: current.steps.map((step) => {
        if (step.id !== selectedStepId) {
          return step;
        }
        const exists = step.activities.some((item) => item.id === activity.id);
        return exists
          ? step
          : { ...step, activities: [...step.activities, activity] };
      }),
    }));
  };

  const handleToggleStandard = (standard: LessonBuilderPlan["standards"][number]) => {
    updatePlan((current) => {
      const exists = current.standards.some((item) => item.id === standard.id);
      const standards = exists
        ? current.standards.filter((item) => item.id !== standard.id)
        : [...current.standards, standard];
      const available = current.availableStandards.some((item) => item.id === standard.id)
        ? current.availableStandards
        : [...current.availableStandards, standard];
      return {
        ...current,
        standards,
        availableStandards: available,
      };
    });
  };

  const activitiesQuery = useQuery({
    queryKey: ["builder-plan-activities", id, activityQuery],
    enabled: Boolean(id) && activityQuery.trim().length >= 3,
    queryFn: () => searchLessonBuilderActivities(id as string, activityQuery),
  });

  const activityResults = activityQuery.trim().length >= 3 ? activitiesQuery.data ?? [] : [];
  const history = historyQuery.data ?? plan?.history ?? [];

  const lessonCopy = useMemo<LessonDetailCopy>(() => ({
    stageLabel: t.lessonPlans.modal.stage,
    subjectsLabel: t.lessonPlans.modal.subjects,
    deliveryLabel: t.lessonPlans.modal.delivery,
    technologyLabel: t.lessonPlans.modal.technology,
    durationLabel: t.lessonPlans.modal.duration,
    summaryLabel: t.lessonPlans.modal.summary,
    overviewTitle: t.lessonPlans.modal.overview,
    objectivesLabel: t.lessonPlans.modal.objectives,
    materialsLabel: t.lessonPlans.modal.materials,
    assessmentLabel: t.lessonPlans.modal.assessment,
    technologyOverviewLabel: t.lessonPlans.modal.technologyOverview,
    deliveryOverviewLabel: t.lessonPlans.modal.deliveryOverview,
    durationOverviewLabel: t.lessonPlans.modal.durationOverview,
    structureTitle: t.lessonPlans.modal.structure,
    resourcesTitle: t.lessonPlans.modal.resources,
    resourceLinkLabel: t.lessonPlans.modal.resourceLink,
    noResourcesLabel: t.lessonPlans.modal.empty,
    errorLabel: t.lessonPlans.states.error,
    downloadLabel: t.lessonPlans.modal.download,
    openFullLabel: t.lessonPlans.modal.openFull,
    closeLabel: t.lessonPlans.modal.close,
    loadingLabel: t.lessonPlans.states.loading,
    minutesFormatter: (minutes: number) =>
      t.lessonPlans.card.durationLabel.replace("{minutes}", String(minutes)),
  }), [t]);

  if (planQuery.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Toolbar plan={plan ?? null} history={history} isSaving={false} onPreview={() => undefined} copy={t.lessonBuilder.toolbar} />
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t.lessonBuilder.states.loading}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (planQuery.isError || !plan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="flex justify-center">
              <RefreshCw className="h-10 w-10 text-destructive" />
            </div>
            <p className="text-base font-medium text-foreground">{t.lessonBuilder.states.error}</p>
            <p className="text-sm text-muted-foreground">{t.lessonBuilder.states.errorDescription}</p>
            <Button onClick={() => planQuery.refetch()}>{t.lessonBuilder.states.retry}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Toolbar
        plan={plan}
        history={history as LessonBuilderVersionEntry[]}
        isSaving={isSaving}
        onPreview={() => setIsPreviewOpen(true)}
        copy={t.lessonBuilder.toolbar}
      />
      <div className="grid gap-6 lg:grid-cols-[280px,1fr,320px]">
        <div className="space-y-6">
          <PartsSidebar
            parts={plan.parts}
            selectedPart={selectedPart}
            onSelect={setSelectedPart}
            copy={t.lessonBuilder.parts}
            history={history as LessonBuilderVersionEntry[]}
            historyCopy={t.lessonBuilder.history}
          />
        </div>
        <div className="space-y-6">
          <MetaBar plan={plan} copy={t.lessonBuilder.meta} onUpdate={updatePlan} />
          <PlanCanvas
            steps={plan.steps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            onAddStep={handleAddStep}
            onRemoveStep={handleRemoveStep}
            onStepChange={handleStepChange}
            copy={t.lessonBuilder.canvas}
          />
        </div>
        <div className="space-y-6">
          <ActivitySearchPanel
            query={activityQuery}
            onQueryChange={setActivityQuery}
            results={activityResults}
            onAdd={handleAddActivity}
            isLoading={activitiesQuery.isFetching}
            copy={t.lessonBuilder.activities}
          />
          <StandardsPicker
            available={plan.availableStandards}
            selected={plan.standards}
            onToggle={handleToggleStandard}
            copy={t.lessonBuilder.standards}
          />
        </div>
      </div>
      <PreviewModal
        plan={plan}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        copy={t.lessonBuilder.preview}
        lessonCopy={lessonCopy}
      />
    </div>
  );
};

export default BuilderLessonPlanDetail;
