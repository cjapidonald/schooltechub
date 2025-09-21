import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { SEO } from "@/components/SEO";
import { EmptyState } from "@/components/lesson-plans/EmptyState";
import { LessonCard } from "@/components/lesson-plans/LessonCard";
import { LessonFilters } from "@/components/lesson-plans/LessonFilters";
import { LessonModal } from "@/components/lesson-plans/LessonModal";
import { LessonSkeletons } from "@/components/lesson-plans/Skeletons";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import type {
  DeliveryMode,
  LessonPlan,
  LessonPlanListItem,
  LessonPlanListResponse,
  Stage,
} from "@/types/lesson-plans";

const LESSON_PARAM = "lesson";

function getListParam(params: URLSearchParams, key: string): string[] {
  const values = params.getAll(key);
  if (values.length === 0) {
    const raw = params.get(key);
    if (raw) {
      values.push(raw);
    }
  }

  return Array.from(
    new Set(
      values
        .flatMap((value) =>
          value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean),
        )
        .map((value) => value.toLowerCase()),
    ),
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

async function fetchLessonPlans(
  filters: {
    search: string | null;
    stages: string[];
    delivery: string[];
    tech: string[];
  },
  cursor: string | null,
): Promise<LessonPlanListResponse> {
  const params = new URLSearchParams();
  if (filters.search) {
    params.set("q", filters.search);
  }
  filters.stages.forEach((value) => params.append("stage", value));
  filters.delivery.forEach((value) => params.append("delivery", value));
  filters.tech.forEach((value) => params.append("tech", value));
  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(`/api/lesson-plans?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load lesson plans");
  }
  return response.json() as Promise<LessonPlanListResponse>;
}

async function fetchLessonPlanDetail(slug: string): Promise<LessonPlan> {
  const response = await fetch(`/api/lesson-plans/${slug}`);
  if (!response.ok) {
    throw new Error("Failed to load lesson plan");
  }
  return response.json() as Promise<LessonPlan>;
}

const stageConfigs = [
  {
    value: "early childhood",
    translationKey: "earlyChildhood",
    label: "Early Childhood",
    description: "Play-based foundations",
    gradeRange: "PreK-1",
  },
  {
    value: "elementary",
    translationKey: "elementary",
    label: "Elementary",
    description: "Building core skills",
    gradeRange: "Grades 2-5",
  },
  {
    value: "middle school",
    translationKey: "middleSchool",
    label: "Middle School",
    description: "Exploration and inquiry",
    gradeRange: "Grades 6-8",
  },
  {
    value: "high school",
    translationKey: "highSchool",
    label: "High School",
    description: "College and career ready",
    gradeRange: "Grades 9-12",
  },
  {
    value: "adult learners",
    translationKey: "adultLearners",
    label: "Adult Learners",
    description: "Professional and higher ed",
    gradeRange: "Post-secondary",
  },
] as const;

const deliveryConfigs = [
  { value: "in-person", translationKey: "inPerson", label: "In-person", description: "Face-to-face classroom" },
  { value: "blended", translationKey: "blended", label: "Blended", description: "Mix of online and in-class" },
  { value: "online", translationKey: "online", label: "Online", description: "Live or asynchronous remote" },
  { value: "project-based", translationKey: "projectBased", label: "Project-based", description: "Student-led projects" },
  { value: "flipped", translationKey: "flipped", label: "Flipped", description: "Learn at home, apply in class" },
] as const;

const technologyConfigs = [
  { value: "ai", translationKey: "ai", label: "AI" },
  { value: "robotics", translationKey: "robotics", label: "Robotics" },
  { value: "coding", translationKey: "coding", label: "Coding" },
  { value: "vr", translationKey: "vr", label: "VR" },
  { value: "steam", translationKey: "steam", label: "STEAM" },
] as const;

const DEBOUNCE_DELAY = 350;

const LessonPlans = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedStages, setSelectedStages] = useState<string[]>(() => getListParam(searchParams, "stage"));
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>(() => getListParam(searchParams, "delivery"));
  const [selectedTech, setSelectedTech] = useState<string[]>(() => getListParam(searchParams, "tech"));

  const debouncedSearch = useDebouncedValue(searchTerm, DEBOUNCE_DELAY);

  const updateSearchParams = useCallback(
    (mutator: (params: URLSearchParams) => void, options?: { replace?: boolean }) => {
      const current = searchParams.toString();
      const params = new URLSearchParams(searchParams);
      mutator(params);
      const next = params.toString();
      if (next !== current) {
        setSearchParams(params, options);
      }
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("q") || "");
    setSelectedStages(getListParam(params, "stage"));
    setSelectedDelivery(getListParam(params, "delivery"));
    setSelectedTech(getListParam(params, "tech"));
  }, [location.search]);

  useEffect(() => {
    updateSearchParams((params) => {
      if (debouncedSearch) {
        params.set("q", debouncedSearch);
      } else {
        params.delete("q");
      }
      params.delete("cursor");
      params.delete("page");
    }, { replace: true });
  }, [debouncedSearch, updateSearchParams]);

  const stageKey = useMemo(() => selectedStages.slice().sort().join("|"), [selectedStages]);
  const deliveryKey = useMemo(() => selectedDelivery.slice().sort().join("|"), [selectedDelivery]);
  const techKey = useMemo(() => selectedTech.slice().sort().join("|"), [selectedTech]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || null,
      stages: selectedStages,
      delivery: selectedDelivery,
      tech: selectedTech,
    }),
    [debouncedSearch, selectedStages, selectedDelivery, selectedTech],
  );

  const lessonPlansQuery = useInfiniteQuery({
    queryKey: ["lesson-plans", language, filters.search, stageKey, deliveryKey, techKey],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchLessonPlans(filters, (pageParam as string | null) ?? null),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const lessonItems = useMemo(
    () => lessonPlansQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [lessonPlansQuery.data],
  );

  const [selectedLessonSlug, setSelectedLessonSlug] = useState<string | null>(
    searchParams.get(LESSON_PARAM),
  );
  const [selectedLessonPreview, setSelectedLessonPreview] = useState<LessonPlanListItem | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const slug = params.get(LESSON_PARAM);
    setSelectedLessonSlug(slug);
  }, [location.search]);

  useEffect(() => {
    if (!selectedLessonSlug) {
      setSelectedLessonPreview(null);
      return;
    }
    const match = lessonItems.find((item) => item.slug === selectedLessonSlug) ?? null;
    setSelectedLessonPreview(match);
  }, [lessonItems, selectedLessonSlug]);

  const lessonDetailQuery = useQuery({
    queryKey: ["lesson-plan", selectedLessonSlug],
    enabled: Boolean(selectedLessonSlug),
    queryFn: () => fetchLessonPlanDetail(selectedLessonSlug as string),
  });

  const stageOptions = useMemo<Stage[]>(() => {
    const stageTranslations = t.lessonPlans.filters.stages;
    return stageConfigs.map((config) => {
      const translation = stageTranslations[config.translationKey] ?? {};
      return {
        value: config.value,
        label: translation.label ?? config.label,
        description: translation.description ?? config.description,
        gradeRange: translation.gradeRange ?? config.gradeRange,
      } satisfies Stage;
    });
  }, [t.lessonPlans.filters.stages]);

  const deliveryOptions = useMemo<DeliveryMode[]>(() => {
    const deliveryTranslations = t.lessonPlans.filters.deliveries;
    return deliveryConfigs.map((config) => {
      const translation = deliveryTranslations[config.translationKey] ?? {};
      return {
        value: config.value,
        label: translation.label ?? config.label,
        description: translation.description ?? config.description,
      } satisfies DeliveryMode;
    });
  }, [t.lessonPlans.filters.deliveries]);

  const technologyOptions = useMemo(
    () => {
      const techTranslations = t.lessonPlans.filters.technologyOptions;
      return technologyConfigs.map((config) => ({
        value: config.value,
        label: techTranslations[config.translationKey] ?? config.label,
      }));
    },
    [t.lessonPlans.filters.technologyOptions],
  );

  const handleStagesChange = (values: string[]) => {
    const unique = Array.from(new Set(values.map((value) => value.toLowerCase())));
    setSelectedStages(unique);
    updateSearchParams((params) => {
      params.delete("stage");
      unique.forEach((value) => params.append("stage", value));
      params.delete("cursor");
    });
  };

  const handleDeliveryChange = (values: string[]) => {
    const unique = Array.from(new Set(values.map((value) => value.toLowerCase())));
    setSelectedDelivery(unique);
    updateSearchParams((params) => {
      params.delete("delivery");
      unique.forEach((value) => params.append("delivery", value));
      params.delete("cursor");
    });
  };

  const handleTechChange = (values: string[]) => {
    const unique = Array.from(new Set(values.map((value) => value.toLowerCase())));
    setSelectedTech(unique);
    updateSearchParams((params) => {
      params.delete("tech");
      unique.forEach((value) => params.append("tech", value));
      params.delete("cursor");
    });
  };

  const handleClearFilters = () => {
    setSelectedStages([]);
    setSelectedDelivery([]);
    setSelectedTech([]);
    setSearchTerm("");
    updateSearchParams((params) => {
      params.delete("stage");
      params.delete("delivery");
      params.delete("tech");
      params.delete("q");
      params.delete("cursor");
      params.delete("page");
    });
  };

  const handleSelectLesson = (lesson: LessonPlanListItem) => {
    updateSearchParams((params) => {
      params.set(LESSON_PARAM, lesson.slug);
    });
  };

  const handleCloseModal = () => {
    updateSearchParams((params) => {
      params.delete(LESSON_PARAM);
    }, { replace: true });
  };

  const handleOpenFullPage = () => {
    if (!selectedLessonSlug) {
      return;
    }
    navigate(getLocalizedPath(`/lesson-plans/${selectedLessonSlug}`, language));
  };

  const handleDownloadPdf = () => {
    const lesson = lessonDetailQuery.data ?? selectedLessonPreview;
    if (!lesson) {
      return;
    }
    window.open(`/api/lesson-plans/${lesson.id}/pdf`, "_blank", "noopener,noreferrer");
  };

  const isInitialLoading = lessonPlansQuery.isLoading && !lessonPlansQuery.data;
  const hasResults = lessonItems.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t.lessonPlans.seo.title}
        description={t.lessonPlans.seo.description}
        canonicalUrl={`https://schooltechhub.com${getLocalizedPath("/lesson-plans", language)}`}
        type="website"
        lang={language}
      />
      <main className="container py-12">
        <div className="mb-12 space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t.lessonPlans.hero.title}</h1>
          <p className="text-muted-foreground">{t.lessonPlans.hero.subtitle}</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[320px,1fr]">
          <LessonFilters
            stages={stageOptions}
            deliveryModes={deliveryOptions}
            technologyOptions={technologyOptions}
            selectedStages={selectedStages}
            selectedDeliveryModes={selectedDelivery}
            selectedTechnologies={selectedTech}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onStagesChange={handleStagesChange}
            onDeliveryChange={handleDeliveryChange}
            onTechnologyChange={handleTechChange}
            onClearFilters={handleClearFilters}
            searchPlaceholder={t.lessonPlans.filters.searchPlaceholder}
            title={t.lessonPlans.filters.title}
            stageLabel={t.lessonPlans.filters.stageLabel}
            deliveryLabel={t.lessonPlans.filters.deliveryLabel}
            technologyLabel={t.lessonPlans.filters.technologyLabel}
            clearLabel={t.lessonPlans.filters.clear}
            closeLabel={t.common.close}
          />

          <section className="space-y-8">
            {isInitialLoading ? (
              <LessonSkeletons />
            ) : hasResults ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {lessonItems.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      onSelect={handleSelectLesson}
                      openLabel={t.lessonPlans.card.openLabel}
                      durationFormatter={(minutes) =>
                        t.lessonPlans.card.durationLabel.replace("{minutes}", String(minutes))
                      }
                    />
                  ))}
                </div>
                {lessonPlansQuery.hasNextPage ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => lessonPlansQuery.fetchNextPage()}
                      disabled={lessonPlansQuery.isFetchingNextPage}
                    >
                      {lessonPlansQuery.isFetchingNextPage
                        ? t.common.loading
                        : t.lessonPlans.states.loadMore}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                title={t.lessonPlans.states.emptyTitle}
                description={t.lessonPlans.states.emptyDescription}
                resetLabel={t.lessonPlans.states.resetFilters}
                onReset={handleClearFilters}
              />
            )}

            {lessonPlansQuery.isError ? (
              <p className="text-sm text-destructive">{t.lessonPlans.states.error}</p>
            ) : null}
          </section>
        </div>
      </main>

      <LessonModal
        isOpen={Boolean(selectedLessonSlug)}
        onClose={handleCloseModal}
        lesson={lessonDetailQuery.data ?? null}
        initialLesson={selectedLessonPreview}
        onDownloadPdf={handleDownloadPdf}
        onOpenFullPage={handleOpenFullPage}
        isLoading={lessonDetailQuery.isLoading || lessonDetailQuery.isFetching}
        errorMessage={lessonDetailQuery.isError ? t.lessonPlans.states.error : null}
        copy={{
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
          minutesFormatter: (minutes) =>
            t.lessonPlans.card.durationLabel.replace("{minutes}", String(minutes)),
        }}
      />
    </div>
  );
};

export default LessonPlans;
