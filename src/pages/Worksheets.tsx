import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { SEO } from "@/components/SEO";
import { EmptyState } from "@/components/worksheets/EmptyState";
import { WorksheetCard } from "@/components/worksheets/WorksheetCard";
import { WorksheetFilters } from "@/components/worksheets/WorksheetFilters";
import { WorksheetModal } from "@/components/worksheets/WorksheetModal";
import { WorksheetSkeletons } from "@/components/worksheets/Skeletons";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import type {
  Worksheet,
  WorksheetCard as WorksheetCardType,
  WorksheetFiltersState,
  WorksheetListResponse,
} from "@/types/worksheets";

const WORKSHEET_PARAM = "ws";
const DEBOUNCE_DELAY = 350;

interface OptionConfig {
  value: string;
  translationKey: string;
  label: string;
  description?: string;
  hint?: string;
}

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
        ),
    ),
  );
}

function getBooleanParam(params: URLSearchParams, key: string): boolean {
  const value = params.get(key);
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

function parseFiltersFromParams(params: URLSearchParams): WorksheetFiltersState {
  return {
    searchTerm: params.get("q") ?? "",
    stages: getListParam(params, "stage"),
    subjects: getListParam(params, "subjects"),
    skills: getListParam(params, "skills"),
    worksheetTypes: getListParam(params, "type"),
    difficulties: getListParam(params, "difficulty"),
    formats: getListParam(params, "format"),
    techIntegratedOnly: getBooleanParam(params, "tech"),
    answersOnly: getBooleanParam(params, "answers"),
  };
}

function areFilterStatesEqual(a: WorksheetFiltersState, b: WorksheetFiltersState): boolean {
  return (
    a.searchTerm === b.searchTerm &&
    arraysEqual(a.stages, b.stages) &&
    arraysEqual(a.subjects, b.subjects) &&
    arraysEqual(a.skills, b.skills) &&
    arraysEqual(a.worksheetTypes, b.worksheetTypes) &&
    arraysEqual(a.difficulties, b.difficulties) &&
    arraysEqual(a.formats, b.formats) &&
    a.techIntegratedOnly === b.techIntegratedOnly &&
    a.answersOnly === b.answersOnly
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

async function fetchWorksheets(
  filters: WorksheetFiltersState,
  cursor: string | null,
): Promise<WorksheetListResponse> {
  const params = new URLSearchParams();
  if (filters.searchTerm.trim()) {
    params.set("q", filters.searchTerm.trim());
  }
  filters.stages.forEach((value) => params.append("stage", value));
  filters.subjects.forEach((value) => params.append("subjects", value));
  filters.skills.forEach((value) => params.append("skills", value));
  filters.worksheetTypes.forEach((value) => params.append("type", value));
  filters.difficulties.forEach((value) => params.append("difficulty", value));
  filters.formats.forEach((value) => params.append("format", value));
  if (filters.techIntegratedOnly) {
    params.set("tech", "true");
  }
  if (filters.answersOnly) {
    params.set("answers", "true");
  }
  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(`/api/worksheets?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load worksheets");
  }
  return response.json() as Promise<WorksheetListResponse>;
}

async function fetchWorksheetDetail(slug: string): Promise<Worksheet> {
  const response = await fetch(`/api/worksheets/${slug}`);
  if (!response.ok) {
    throw new Error("Failed to load worksheet");
  }
  return response.json() as Promise<Worksheet>;
}

const stageConfigs: OptionConfig[] = [
  { value: "K", translationKey: "k", label: "Kindergarten", hint: "Age 5" },
  { value: "1", translationKey: "1", label: "Grade 1", hint: "Age 6" },
  { value: "2", translationKey: "2", label: "Grade 2", hint: "Age 7" },
  { value: "3", translationKey: "3", label: "Grade 3", hint: "Age 8" },
  { value: "4", translationKey: "4", label: "Grade 4", hint: "Age 9" },
  { value: "5", translationKey: "5", label: "Grade 5", hint: "Age 10" },
  { value: "6", translationKey: "6", label: "Grade 6", hint: "Age 11" },
  { value: "7", translationKey: "7", label: "Grade 7", hint: "Age 12" },
  { value: "8", translationKey: "8", label: "Grade 8", hint: "Age 13" },
  { value: "9", translationKey: "9", label: "Grade 9", hint: "Age 14" },
  { value: "10", translationKey: "10", label: "Grade 10", hint: "Age 15" },
  { value: "11", translationKey: "11", label: "Grade 11", hint: "Age 16" },
  { value: "12", translationKey: "12", label: "Grade 12", hint: "Age 17" },
];

const subjectConfigs: OptionConfig[] = [
  { value: "english", translationKey: "english", label: "English" },
  { value: "math", translationKey: "math", label: "Math" },
  { value: "science", translationKey: "science", label: "Science" },
  { value: "social-studies", translationKey: "socialStudies", label: "Social Studies" },
  { value: "technology", translationKey: "technology", label: "Technology" },
  { value: "art", translationKey: "art", label: "Art" },
];

const skillConfigs: OptionConfig[] = [
  { value: "phonics", translationKey: "phonics", label: "Phonics" },
  { value: "fractions", translationKey: "fractions", label: "Fractions" },
  { value: "reading", translationKey: "reading", label: "Reading comprehension" },
  { value: "writing", translationKey: "writing", label: "Writing" },
  { value: "stem", translationKey: "stem", label: "STEM" },
  { value: "ai", translationKey: "ai", label: "AI Literacy" },
];

const typeConfigs: OptionConfig[] = [
  { value: "practice", translationKey: "practice", label: "Practice" },
  { value: "quiz", translationKey: "quiz", label: "Quiz" },
  { value: "station", translationKey: "station", label: "Station" },
  { value: "project", translationKey: "project", label: "Project sheet" },
  { value: "discussion", translationKey: "discussion", label: "Discussion" },
];

const difficultyConfigs: OptionConfig[] = [
  { value: "easy", translationKey: "easy", label: "Easy" },
  { value: "medium", translationKey: "medium", label: "Medium" },
  { value: "hard", translationKey: "hard", label: "Hard" },
];

const formatConfigs: OptionConfig[] = [
  { value: "pdf", translationKey: "pdf", label: "Printable PDF" },
  { value: "digital", translationKey: "digital", label: "Digital interactive" },
];

const Worksheets = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<WorksheetFiltersState>(() =>
    parseFiltersFromParams(searchParams),
  );

  const debouncedSearch = useDebouncedValue(filters.searchTerm, DEBOUNCE_DELAY);

  const updateSearchParams = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const current = searchParams.toString();
      const params = new URLSearchParams(searchParams);
      mutator(params);
      const next = params.toString();
      if (next !== current) {
        setSearchParams(params, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextFilters = parseFiltersFromParams(params);
    setFilters((current) =>
      areFilterStatesEqual(current, nextFilters) ? current : nextFilters,
    );
  }, [location.search]);

  useEffect(() => {
    updateSearchParams((params) => {
      if (debouncedSearch.trim()) {
        params.set("q", debouncedSearch.trim());
      } else {
        params.delete("q");
      }
      params.delete("cursor");
      params.delete("page");
    });
  }, [debouncedSearch, updateSearchParams]);

  useEffect(() => {
    updateSearchParams((params) => {
      params.delete("stage");
      filters.stages.forEach((value) => params.append("stage", value));
      params.delete("subjects");
      filters.subjects.forEach((value) => params.append("subjects", value));
      params.delete("skills");
      filters.skills.forEach((value) => params.append("skills", value));
      params.delete("type");
      filters.worksheetTypes.forEach((value) => params.append("type", value));
      params.delete("difficulty");
      filters.difficulties.forEach((value) => params.append("difficulty", value));
      params.delete("format");
      filters.formats.forEach((value) => params.append("format", value));
      if (filters.techIntegratedOnly) {
        params.set("tech", "true");
      } else {
        params.delete("tech");
      }
      if (filters.answersOnly) {
        params.set("answers", "true");
      } else {
        params.delete("answers");
      }
      params.delete("cursor");
    });
  }, [
    filters.stages,
    filters.subjects,
    filters.skills,
    filters.worksheetTypes,
    filters.difficulties,
    filters.formats,
    filters.techIntegratedOnly,
    filters.answersOnly,
    updateSearchParams,
  ]);

  const filtersKey = useMemo(
    () => [
      debouncedSearch,
      filters.stages.slice().sort().join("|"),
      filters.subjects.slice().sort().join("|"),
      filters.skills.slice().sort().join("|"),
      filters.worksheetTypes.slice().sort().join("|"),
      filters.difficulties.slice().sort().join("|"),
      filters.formats.slice().sort().join("|"),
      filters.techIntegratedOnly ? "tech" : "",
      filters.answersOnly ? "answers" : "",
    ],
    [
      debouncedSearch,
      filters.answersOnly,
      filters.difficulties,
      filters.formats,
      filters.skills,
      filters.stages,
      filters.subjects,
      filters.techIntegratedOnly,
      filters.worksheetTypes,
    ],
  );

  const worksheetsQuery = useInfiniteQuery({
    queryKey: ["worksheets", language, ...filtersKey],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchWorksheets(
        { ...filters, searchTerm: debouncedSearch },
        (pageParam as string | null) ?? null,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const worksheetItems = useMemo(
    () => worksheetsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [worksheetsQuery.data],
  );

  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    searchParams.get(WORKSHEET_PARAM),
  );
  const [selectedPreview, setSelectedPreview] = useState<WorksheetCardType | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSelectedSlug(params.get(WORKSHEET_PARAM));
  }, [location.search]);

  useEffect(() => {
    if (!selectedSlug) {
      setSelectedPreview(null);
      return;
    }
    const match = worksheetItems.find((item) => item.slug === selectedSlug) ?? null;
    setSelectedPreview(match);
  }, [worksheetItems, selectedSlug]);

  const worksheetDetailQuery = useQuery({
    queryKey: ["worksheet", selectedSlug],
    enabled: Boolean(selectedSlug),
    queryFn: () => fetchWorksheetDetail(selectedSlug as string),
  });

  const stageOptions = useMemo(() => {
    const translations = t.worksheets.filters.stages;
    return stageConfigs.map((config) => {
      const translation = translations?.[config.translationKey] ?? {};
      return {
        value: config.value,
        label: translation.label ?? config.label,
        description: translation.description ?? config.description,
        hint: translation.hint ?? config.hint,
      };
    });
  }, [t.worksheets.filters.stages]);

  const subjectOptions = useMemo(() => {
    const translations = t.worksheets.filters.subjects;
    return subjectConfigs.map((config) => ({
      value: config.value,
      label: translations?.[config.translationKey] ?? config.label,
      description: translations?.[`${config.translationKey}Description`] ?? config.description,
    }));
  }, [t.worksheets.filters.subjects]);

  const skillOptions = useMemo(() => {
    const translations = t.worksheets.filters.skills;
    return skillConfigs.map((config) => ({
      value: config.value,
      label: translations?.[config.translationKey] ?? config.label,
      description: translations?.[`${config.translationKey}Description`] ?? config.description,
    }));
  }, [t.worksheets.filters.skills]);

  const typeOptions = useMemo(() => {
    const translations = t.worksheets.filters.types;
    return typeConfigs.map((config) => ({
      value: config.value,
      label: translations?.[config.translationKey] ?? config.label,
    }));
  }, [t.worksheets.filters.types]);

  const difficultyOptions = useMemo(() => {
    const translations = t.worksheets.filters.difficultyOptions;
    return difficultyConfigs.map((config) => ({
      value: config.value,
      label: translations?.[config.translationKey] ?? config.label,
    }));
  }, [t.worksheets.filters.difficultyOptions]);

  const formatOptions = useMemo(() => {
    const translations = t.worksheets.filters.formatOptions;
    return formatConfigs.map((config) => ({
      value: config.value,
      label: translations?.[config.translationKey] ?? config.label,
    }));
  }, [t.worksheets.filters.formatOptions]);

  const handleFiltersChange = (next: WorksheetFiltersState) => {
    setFilters(next);
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: "",
      stages: [],
      subjects: [],
      skills: [],
      worksheetTypes: [],
      difficulties: [],
      formats: [],
      techIntegratedOnly: false,
      answersOnly: false,
    });
    updateSearchParams((params) => {
      params.delete("q");
      params.delete("stage");
      params.delete("subjects");
      params.delete("skills");
      params.delete("type");
      params.delete("difficulty");
      params.delete("format");
      params.delete("tech");
      params.delete("answers");
      params.delete("cursor");
      params.delete("page");
    });
  };

  const handleSelectWorksheet = (worksheet: WorksheetCardType) => {
    updateSearchParams((params) => {
      params.set(WORKSHEET_PARAM, worksheet.slug);
    });
  };

  const handleCloseModal = () => {
    updateSearchParams((params) => {
      params.delete(WORKSHEET_PARAM);
    });
  };

  const handleOpenFullPage = () => {
    if (!selectedSlug) {
      return;
    }
    navigate(getLocalizedPath(`/worksheets/${selectedSlug}`, language));
  };

  const handleDownloadPdf = () => {
    const worksheet = worksheetDetailQuery.data ?? selectedPreview;
    if (!worksheet) {
      return;
    }
    window.open(`/api/worksheets/${worksheet.id}/download`, "_blank", "noopener,noreferrer");
  };

  const handleDownloadAnswers = () => {
    const worksheet = worksheetDetailQuery.data ?? selectedPreview;
    if (!worksheet?.hasAnswerKey) {
      return;
    }
    window.open(`/api/worksheets/${worksheet.id}/answers`, "_blank", "noopener,noreferrer");
  };

  const isInitialLoading = worksheetsQuery.isLoading && !worksheetsQuery.data;
  const hasResults = worksheetItems.length > 0;

  const modalCopy = {
    stageLabel: t.worksheets.modal.stage,
    subjectsLabel: t.worksheets.modal.subjects,
    skillsLabel: t.worksheets.modal.skills,
    typeLabel: t.worksheets.modal.type,
    difficultyLabel: t.worksheets.modal.difficulty,
    formatLabel: t.worksheets.modal.format,
    formatPdfValue: t.worksheets.modal.formatPdf,
    formatDigitalValue: t.worksheets.modal.formatDigital,
    techLabel: t.worksheets.modal.techIntegrated,
    answersLabel: t.worksheets.modal.answerKey,
    tagsLabel: t.worksheets.modal.tags,
    previewLabel: t.worksheets.modal.preview,
    noPreviewLabel: t.worksheets.modal.noPreview,
    downloadLabel: t.worksheets.modal.download,
    downloadAnswersLabel: t.worksheets.modal.downloadAnswers,
    openFullLabel: t.worksheets.modal.openFull,
    closeLabel: t.worksheets.modal.close,
    loadingLabel: t.worksheets.states.loading,
    errorLabel: t.worksheets.states.error,
    yesLabel: t.common.yes ?? "Yes",
    noLabel: t.common.no ?? "No",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t.worksheets.seo.title}
        description={t.worksheets.seo.description}
        canonicalUrl={`https://schooltechhub.com${getLocalizedPath("/worksheets", language)}`}
        type="website"
        lang={language}
      />
      <main className="container py-12">
        <div className="mb-12 space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t.worksheets.hero.title}</h1>
          <p className="text-muted-foreground">{t.worksheets.hero.subtitle}</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[320px,1fr]">
          <WorksheetFilters
            value={filters}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
            copy={{
              title: t.worksheets.filters.title,
              searchPlaceholder: t.worksheets.filters.searchPlaceholder,
              stageLabel: t.worksheets.filters.stageLabel,
              subjectLabel: t.worksheets.filters.subjectLabel,
              skillLabel: t.worksheets.filters.skillLabel,
              typeLabel: t.worksheets.filters.typeLabel,
              difficultyLabel: t.worksheets.filters.difficultyLabel,
              formatLabel: t.worksheets.filters.formatLabel,
              techOnlyLabel: t.worksheets.filters.techOnly,
              techOnlyDescription: t.worksheets.filters.techOnlyDescription,
              answersOnlyLabel: t.worksheets.filters.answersOnly,
              answersOnlyDescription: t.worksheets.filters.answersOnlyDescription,
              clearLabel: t.worksheets.filters.clear,
              closeLabel: t.common.close,
              mobileToggleLabel: t.worksheets.filters.mobileToggle,
            }}
            stageOptions={stageOptions}
            subjectOptions={subjectOptions}
            skillOptions={skillOptions}
            typeOptions={typeOptions}
            difficultyOptions={difficultyOptions}
            formatOptions={formatOptions}
          />

          <section className="space-y-8">
            {isInitialLoading ? (
              <WorksheetSkeletons />
            ) : hasResults ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {worksheetItems.map((worksheet) => (
                    <WorksheetCard
                      key={worksheet.id}
                      worksheet={worksheet}
                      onSelect={handleSelectWorksheet}
                      openLabel={t.worksheets.card.openLabel}
                      answerKeyLabel={t.worksheets.card.answerKey}
                      formatLabel={
                        worksheet.format === "pdf"
                          ? t.worksheets.card.formatPdf
                          : t.worksheets.card.formatDigital
                      }
                    />
                  ))}
                </div>
                {worksheetsQuery.hasNextPage ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => worksheetsQuery.fetchNextPage()}
                      disabled={worksheetsQuery.isFetchingNextPage}
                    >
                      {worksheetsQuery.isFetchingNextPage
                        ? t.common.loading
                        : t.worksheets.states.loadMore}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                title={t.worksheets.states.emptyTitle}
                description={t.worksheets.states.emptyDescription}
                resetLabel={t.worksheets.states.resetFilters}
                onReset={handleClearFilters}
              />
            )}

            {worksheetsQuery.isError ? (
              <p className="text-sm text-destructive">{t.worksheets.states.error}</p>
            ) : null}
          </section>
        </div>
      </main>

      <WorksheetModal
        isOpen={Boolean(selectedSlug)}
        onClose={handleCloseModal}
        worksheet={worksheetDetailQuery.data ?? null}
        initialWorksheet={selectedPreview}
        copy={modalCopy}
        isLoading={worksheetDetailQuery.isLoading || worksheetDetailQuery.isFetching}
        errorMessage={worksheetDetailQuery.isError ? t.worksheets.states.error : null}
        onDownloadPdf={handleDownloadPdf}
        onDownloadAnswers={handleDownloadAnswers}
        onOpenFullPage={handleOpenFullPage}
      />
    </div>
  );
};

export default Worksheets;
