import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { MetaBar } from "@/components/builder/lesson/MetaBar";
import { PartsSidebar } from "@/components/builder/lesson/PartsSidebar";
import { PlanCanvas } from "@/components/builder/lesson/PlanCanvas";
import { StandardsPicker } from "@/components/builder/lesson/StandardsPicker";
import { Toolbar } from "@/components/builder/lesson/Toolbar";
import { PreviewModal } from "@/components/builder/lesson/PreviewModal";
import { ResourceSearchModal } from "@/components/builder/lesson/ResourceSearchModal";
import type { LessonDetailCopy } from "@/components/lesson-plans/LessonModal";
import {
  autosaveLessonBuilderPlan,
  fetchLessonBuilderHistory,
  fetchLessonBuilderPlan,
} from "@/lib/builder-api";
import type {
  LessonBuilderPlan,
  LessonBuilderVersionEntry,
} from "@/types/lesson-builder";
import { mergeResourceValues, mergeStepValues } from "@/types/lesson-builder";
import type { Resource } from "@/types/resources";

const AUTOSAVE_DELAY = 1500;

const BuilderLessonPlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isResourceSearchOpen, setIsResourceSearchOpen] = useState(false);
  const [resourceSearchStepId, setResourceSearchStepId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileLogoUrl, setProfileLogoUrl] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPlan = useRef<LessonBuilderPlan | null>(null);
  const defaultsApplied = useRef(false);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      setProfileLoaded(true);
      return;
    }

    let active = true;

    const loadProfile = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!active) {
          return;
        }

        const user = data?.user ?? null;
        if (!user) {
          setProfileId(null);
          setProfileLogoUrl(null);
          setProfileLoaded(true);
          return;
        }

        setProfileId(user.id);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("school_logo_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) {
          return;
        }

        const logo =
          profileData && "school_logo_url" in profileData
            ? ((profileData as { school_logo_url: string | null }).school_logo_url ?? null)
            : null;
        setProfileLogoUrl(logo);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        if (active) {
          setProfileLoaded(true);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isResourceSearchOpen) {
        setIsResourceSearchOpen(false);
        setResourceSearchStepId(null);
      }
      if (event.key === "Enter" && !isResourceSearchOpen && selectedStepId) {
        const target = event.target as HTMLElement | null;
        if (target) {
          const tagName = target.tagName;
          if (
            tagName === "INPUT" ||
            tagName === "TEXTAREA" ||
            tagName === "SELECT" ||
            target.isContentEditable
          ) {
            return;
          }
        }
        setResourceSearchStepId(selectedStepId);
        setIsResourceSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isResourceSearchOpen, selectedStepId]);

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
        latestPlan.current = next;
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave]
  );

  useEffect(() => {
    if (!plan || !profileLoaded || defaultsApplied.current) {
      return;
    }

    const todayIso = (() => {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
      } catch {
        return new Intl.DateTimeFormat("en-CA").format(new Date());
      }
    })();

    let applied = false;

    updatePlan((current) => {
      const patch: Partial<LessonBuilderPlan> = {};
      if (!current.schoolLogoUrl && profileLogoUrl) {
        patch.schoolLogoUrl = profileLogoUrl;
      }
      if (!current.lessonDate) {
        patch.lessonDate = todayIso;
      }

      if (Object.keys(patch).length === 0) {
        return current;
      }

      applied = true;
      return { ...current, ...patch } as LessonBuilderPlan;
    });

    if (!applied && plan.schoolLogoUrl && plan.lessonDate) {
      defaultsApplied.current = true;
    } else if (applied) {
      defaultsApplied.current = true;
    }
  }, [plan, profileLoaded, profileLogoUrl, updatePlan]);

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

  const handleStepChange = (
    stepId: string,
    updater: (step: LessonBuilderPlan["steps"][number]) => LessonBuilderPlan["steps"][number]
  ) => {
    updatePlan((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? updater(step) : step)),
    }));
  };

  const openResourceSearchForStep = (stepId: string) => {
    setSelectedStepId(stepId);
    setResourceSearchStepId(stepId);
    setIsResourceSearchOpen(true);
  };

  const mergeInstructionalNotes = (existing: string | null, addition: string | null) => {
    if (!addition) {
      return existing;
    }
    const trimmedAddition = addition.trim();
    if (trimmedAddition.length === 0) {
      return existing;
    }
    if (!existing || existing.trim().length === 0) {
      return trimmedAddition;
    }
    if (existing.includes(trimmedAddition)) {
      return existing;
    }
    return `${existing.trim()}\n\n${trimmedAddition}`;
  };

  const handleResourceSelect = (resource: Resource) => {
    const stepId = resourceSearchStepId ?? selectedStepId;
    if (!stepId) {
      return;
    }

    const snapshot = mergeResourceValues({
      id: resource.id,
      label: resource.title,
      title: resource.title,
      url: resource.url ?? undefined,
      type: resource.type ?? null,
      thumbnail: resource.thumbnail_url ?? null,
      domain: null,
      notes: resource.description ?? null,
    });

    let previousResource: LessonBuilderPlan["steps"][number]["resources"][number] | null = null;
    let previousNotes: string | null = null;

    handleStepChange(stepId, (step) => {
      const existingResources = Array.isArray(step.resources) ? step.resources : [];
      previousResource = existingResources[0] ?? null;
      previousNotes = step.notes ?? null;
      const filtered = existingResources.filter((item) => {
        const currentId = item.id ?? item.url;
        const incomingId = snapshot.id ?? snapshot.url;
        return currentId !== incomingId;
      });
      return {
        ...step,
        resources: [snapshot, ...filtered],
        notes: mergeInstructionalNotes(step.notes ?? null, resource.description ?? null),
      };
    });

    setIsResourceSearchOpen(false);
    setResourceSearchStepId(null);

    toast({
      description: `${resource.title} added.`,
      action: (
        <ToastAction
          altText="Undo resource"
          onClick={() => {
            handleStepChange(stepId, (step) => {
              const filtered = step.resources.filter((item) => {
                const currentId = item.id ?? item.url;
                const incomingId = snapshot.id ?? snapshot.url;
                return currentId !== incomingId;
              });
              const restored = previousResource ? [previousResource, ...filtered] : filtered;
              return {
                ...step,
                resources: restored,
                notes: previousNotes ?? null,
              };
            });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
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

  const history = historyQuery.data ?? plan?.history ?? [];

  const lessonCopy = useMemo<LessonDetailCopy>(
    () => ({
      stageLabel: t.lessonPlans.modal.stage,
      subjectsLabel: t.lessonPlans.modal.subjects,
      deliveryLabel: t.lessonPlans.modal.delivery,
      technologyLabel: t.lessonPlans.modal.technology,
      durationLabel: t.lessonPlans.modal.duration,
      summaryLabel: t.lessonPlans.modal.summary,
      overviewTitle: t.lessonPlans.modal.overview,
      objectivesLabel: t.lessonPlans.modal.objectives,
      successCriteriaLabel: t.lessonPlans.modal.successCriteria,
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
      downloadDocxLabel: t.lessonPlans.modal.downloadDocx,
      openFullLabel: t.lessonPlans.modal.openFull,
      closeLabel: t.lessonPlans.modal.close,
      loadingLabel: t.lessonPlans.states.loading,
      minutesFormatter: (minutes: number) =>
        t.lessonPlans.card.durationLabel.replace("{minutes}", String(minutes)),
    }),
    [t]
  );

  const resourceSearchCopy = t.lessonBuilder.resourceSearch;

  if (planQuery.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Toolbar
          plan={plan ?? null}
          history={history}
          isSaving={false}
          onPreview={() => undefined}
          copy={t.lessonBuilder.toolbar}
        />
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
      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <div className="space-y-6">
          <PartsSidebar
            parts={plan.parts}
            selectedPart={selectedPart}
            onSelect={setSelectedPart}
            copy={t.lessonBuilder.parts}
            history={history as LessonBuilderVersionEntry[]}
            historyCopy={t.lessonBuilder.history}
          />
          <StandardsPicker
            available={plan.availableStandards}
            selected={plan.standards}
            onToggle={handleToggleStandard}
            copy={t.lessonBuilder.standards}
          />
        </div>
        <div className="space-y-6">
          <MetaBar
            plan={plan}
            copy={t.lessonBuilder.meta}
            onUpdate={updatePlan}
            profileId={profileId}
          />
          <PlanCanvas
            steps={plan.steps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            onAddStep={handleAddStep}
            onRemoveStep={handleRemoveStep}
            onStepChange={handleStepChange}
            onSearchResources={openResourceSearchForStep}
            copy={t.lessonBuilder.canvas}
          />
        </div>
      </div>
      <ResourceSearchModal
        open={isResourceSearchOpen}
        onOpenChange={(open) => {
          setIsResourceSearchOpen(open);
          if (!open) {
            setResourceSearchStepId(null);
          }
        }}
        onSelect={handleResourceSelect}
        copy={resourceSearchCopy}
      />
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
