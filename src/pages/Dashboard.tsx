import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardHeader, type DashboardQuickAction } from "@/components/dashboard/DashboardHeader";
import {
  createClass,
  createCurriculum,
  fetchCurricula,
  fetchCurriculumItems,
  fetchMyClasses,
  reorderCurriculumItems,
  seedExampleDashboardData,
} from "@/features/dashboard/api";
import {
  DASHBOARD_EXAMPLE_CLASS,
  type DashboardCurriculumItem,
  type DashboardCurriculumSummary,
} from "@/features/dashboard/examples";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { Class } from "../../types/supabase-tables";

import { CurriculumTabContent } from "./dashboard/CurriculumTabContent";
import { ClassesTabContent } from "./dashboard/ClassesTabContent";
import { LessonBuilderTabContent } from "./dashboard/LessonBuilderTabContent";
import { StudentsTabContent } from "./dashboard/StudentsTabContent";
import { AssessmentsTabContent } from "./dashboard/AssessmentsTabContent";
import { NewClassDialog } from "./dashboard/NewClassDialog";
import { NewCurriculumDialog } from "./dashboard/NewCurriculumDialog";
import { PrototypeAccessPanel } from "./dashboard/PrototypeAccessPanel";
import {
  classSchema,
  curriculumSchema,
  type ClassFormValues,
  type CurriculumFormValues,
} from "./dashboard/dashboard-forms";
import {
  DASHBOARD_TABS,
  GLASS_PANEL_CLASS,
  GLASS_TAB_TRIGGER_CLASS,
  deriveNamePartsFromFullName,
  formatLessonContextDate,
  isDashboardTab,
  normalizeName,
  splitLessonTitles,
  type DashboardTab,
  type LessonBuilderRouteContext,
  type LessonBuilderSummaryItem,
} from "./dashboard/dashboard-utils";

const DEFAULT_TAB: DashboardTab = "curriculum";

export default function DashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useOptionalUser();
  const {
    fullName,
    firstName,
    lastName,
    displayName,
    honorific,
    avatarUrl,
  } = useMyProfile();

  const [isClassDialogOpen, setClassDialogOpen] = useState(false);
  const [isCurriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasEnteredPrototype, setHasEnteredPrototype] = useState(() => Boolean(user));
  const prototypeAccessToast = useMemo(
    () => ({
      title: t.dashboard.toasts.prototypeUnlocked,
      description: t.dashboard.toasts.prototypeUnlockedDescription,
    }),
    [t.dashboard.toasts.prototypeUnlocked, t.dashboard.toasts.prototypeUnlockedDescription],
  );
  const journeyContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user && !hasEnteredPrototype) {
      setHasEnteredPrototype(true);
    }
  }, [user, hasEnteredPrototype]);

  useEffect(() => {
    if (!hasEnteredPrototype || user) {
      return;
    }

    journeyContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasEnteredPrototype, user]);

  const handleEnterPrototype = useCallback(() => {
    if (hasEnteredPrototype) {
      return;
    }

    setHasEnteredPrototype(true);
    toast(prototypeAccessToast);
  }, [hasEnteredPrototype, prototypeAccessToast, toast]);

  const updateSearchParams = useCallback(
    (mutator: (params: URLSearchParams) => void, options: { replace?: boolean } = {}) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          mutator(next);
          return next;
        },
        { replace: options.replace ?? true },
      );
    },
    [setSearchParams],
  );

  const setLessonBuilderContext = useCallback(
    (context: LessonBuilderRouteContext | null) => {
      updateSearchParams(params => {
        params.set("tab", "lessonBuilder");
        const keys = [
          "lessonTitle",
          "lessonClassId",
          "lessonClassTitle",
          "lessonStage",
          "lessonDate",
          "lessonSeq",
          "lessonCurriculumId",
        ];
        keys.forEach(key => params.delete(key));

        if (!context) {
          return;
        }

        params.set("lessonTitle", context.title);
        if (context.classId) {
          params.set("lessonClassId", context.classId);
        }
        if (context.classTitle) {
          params.set("lessonClassTitle", context.classTitle);
        }
        if (context.stage) {
          params.set("lessonStage", context.stage);
        }
        if (context.date) {
          params.set("lessonDate", context.date);
        }
        if (context.sequence !== null && context.sequence !== undefined) {
          params.set("lessonSeq", String(context.sequence));
        }
        if (context.curriculumId) {
          params.set("lessonCurriculumId", context.curriculumId);
        }
      });
    },
    [updateSearchParams],
  );

  const requestedTab = searchParams.get("tab");
  const activeTab: DashboardTab = isDashboardTab(requestedTab) ? requestedTab : DEFAULT_TAB;

  const lessonBuilderContext = useMemo<LessonBuilderRouteContext | null>(() => {
    const getParam = (key: string) => {
      const value = searchParams.get(key);
      return value && value.trim().length > 0 ? value : null;
    };

    const title = getParam("lessonTitle");
    if (!title) {
      return null;
    }

    const sequenceRaw = getParam("lessonSeq");
    const sequenceNumber = sequenceRaw ? Number.parseInt(sequenceRaw, 10) : Number.NaN;

    return {
      title,
      classId: getParam("lessonClassId"),
      classTitle: getParam("lessonClassTitle"),
      stage: getParam("lessonStage"),
      date: getParam("lessonDate"),
      sequence: Number.isFinite(sequenceNumber) ? sequenceNumber : null,
      curriculumId: getParam("lessonCurriculumId"),
    };
  }, [searchParams]);

  const lessonBuilderSummaryItems = useMemo<LessonBuilderSummaryItem[]>(
    () =>
      lessonBuilderContext
        ? [
            {
              key: "lesson",
              label: t.dashboard.lessonBuilder.labels.lesson,
              value: lessonBuilderContext.title,
            },
            {
              key: "class",
              label: t.dashboard.lessonBuilder.labels.class,
              value: lessonBuilderContext.classTitle,
            },
            {
              key: "stage",
              label: t.dashboard.lessonBuilder.labels.stage,
              value: lessonBuilderContext.stage,
            },
            {
              key: "date",
              label: t.dashboard.lessonBuilder.labels.date,
              value: formatLessonContextDate(lessonBuilderContext.date),
            },
            {
              key: "sequence",
              label: t.dashboard.lessonBuilder.labels.sequence,
              value:
                lessonBuilderContext.sequence !== null
                  ? `#${lessonBuilderContext.sequence}`
                  : null,
            },
          ]
        : [],
    [lessonBuilderContext, t],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const next: DashboardTab = isDashboardTab(value) ? value : DEFAULT_TAB;
      updateSearchParams(params => {
        params.set("tab", next);
      });
    },
    [updateSearchParams],
  );

  const getTabLabel = useCallback(
    (tab: DashboardTab) => {
      switch (tab) {
        case "curriculum":
          return t.dashboard.tabs.curriculum;
        case "classes":
          return t.dashboard.tabs.classes;
        case "lessonBuilder":
          return t.dashboard.tabs.lessonBuilder;
        case "students":
          return t.dashboard.tabs.students;
        case "assessments":
          return t.dashboard.tabs.assessments ?? "Assessments";
        default:
          return tab;
      }
    },
    [
      t.dashboard.tabs.assessments,
      t.dashboard.tabs.classes,
      t.dashboard.tabs.curriculum,
      t.dashboard.tabs.lessonBuilder,
      t.dashboard.tabs.students,
    ],
  );

  useEffect(() => {
    if (!lessonBuilderContext?.curriculumId) {
      return;
    }

    setActiveCurriculumId(current => {
      if (current === lessonBuilderContext.curriculumId) {
        return current;
      }
      return lessonBuilderContext.curriculumId;
    });
  }, [lessonBuilderContext?.curriculumId]);

  const classForm = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { title: "", stage: "", subject: "", start_date: "", end_date: "" },
  });
  const curriculumForm = useForm<CurriculumFormValues>({
    resolver: zodResolver(curriculumSchema),
    defaultValues: { title: "", class_id: "", subject: "", academic_year: "", lesson_titles: "" },
  });

  const classesQuery = useQuery<Class[]>({
    queryKey: ["dashboard-classes", user?.id],
    queryFn: () => fetchMyClasses(user!.id),
    enabled: Boolean(user?.id),
  });

  const curriculaQuery = useQuery<DashboardCurriculumSummary[]>({
    queryKey: ["dashboard-curricula", user?.id],
    queryFn: () => fetchCurricula(user!.id),
    enabled: Boolean(user?.id),
  });

  const createClassMutation = useMutation({
    mutationFn: (values: ClassFormValues) =>
      createClass({
        ownerId: user!.id,
        title: values.title,
        stage: values.stage,
        subject: values.subject,
        start_date: values.start_date,
        end_date: values.end_date,
      }),
    onSuccess: () => {
      toast({ description: t.dashboard.toasts.classCreated });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-classes", user?.id] });
      setClassDialogOpen(false);
      classForm.reset();
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const createCurriculumMutation = useMutation({
    mutationFn: async (values: CurriculumFormValues) => {
      const lessonTitles = splitLessonTitles(values.lesson_titles);
      if (lessonTitles.length === 0) {
        throw new Error("No lessons provided");
      }
      const result = await createCurriculum({
        ownerId: user!.id,
        classId: values.class_id,
        subject: values.subject,
        title: values.title,
        academicYear: values.academic_year,
        lessonTitles,
      });
      return result;
    },
    onSuccess: result => {
      toast({ description: t.dashboard.toasts.curriculumCreated });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-curricula", user?.id] });
      setCurriculumDialogOpen(false);
      curriculumForm.reset();
      setActiveCurriculumId(result.curriculum.id);
      queryClient.setQueryData(["dashboard-curriculum-items", result.curriculum.id], result.items);
      navigate(`/teacher/curriculum/${result.curriculum.id}`);
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const seedExampleDataMutation = useMutation({
    mutationFn: () => seedExampleDashboardData({ ownerId: user!.id }),
    onSuccess: result => {
      toast({ description: t.dashboard.toasts.exampleDataCreated });
      setActiveCurriculumId(result.curriculum.id);
      queryClient.setQueryData(["dashboard-curriculum-items", result.curriculum.id], result.items);
      void queryClient.invalidateQueries({ queryKey: ["dashboard-classes", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-curricula", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-curriculum-items"], exact: false });
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const handleQuickAction = (action: DashboardQuickAction) => {
    switch (action) {
      case "ask-question":
        navigate("/forum/new");
        return;
      case "post-blog":
        toast({ description: t.dashboard.toasts.blogUnavailable, variant: "destructive" });
        return;
      case "open-profile":
        navigate("/my-profile");
        return;
      default:
        return;
    }
  };

  const classes = useMemo<Array<Class & { isExample?: boolean }>>(() => {
    if (classesQuery.data && classesQuery.data.length > 0) {
      return classesQuery.data;
    }
    return [DASHBOARD_EXAMPLE_CLASS];
  }, [classesQuery.data]);

  const curricula = useMemo(() => curriculaQuery.data ?? [], [curriculaQuery.data]);

  const showingExampleData = useMemo(() => {
    if (classesQuery.isLoading || curriculaQuery.isLoading) {
      return false;
    }
    return classes.some(item => item.isExample) || curricula.some(item => item.isExample);
  }, [classes, curricula, classesQuery.isLoading, curriculaQuery.isLoading]);

  const fallbackCurriculumId = curricula[0]?.id ?? null;
  const effectiveCurriculumId = activeCurriculumId ?? fallbackCurriculumId;

  const shouldFetchCurriculumItems = Boolean(effectiveCurriculumId);

  const curriculumItemsQuery = useQuery<DashboardCurriculumItem[]>({
    queryKey: ["dashboard-curriculum-items", effectiveCurriculumId],
    queryFn: () => fetchCurriculumItems(effectiveCurriculumId!),
    enabled: shouldFetchCurriculumItems,
  });

  const selectedCurriculum = useMemo(
    () => (effectiveCurriculumId ? curricula.find(curriculum => curriculum.id === effectiveCurriculumId) ?? null : null),
    [curricula, effectiveCurriculumId],
  );

  const curriculumItems = useMemo<DashboardCurriculumItem[]>(() => {
    if (!effectiveCurriculumId) {
      return [];
    }
    return curriculumItemsQuery.data ?? [];
  }, [effectiveCurriculumId, curriculumItemsQuery.data]);

  const curriculumItemsLoading = shouldFetchCurriculumItems ? curriculumItemsQuery.isLoading : false;

  const reorderCurriculumItemsMutation = useMutation({
    mutationFn: ({ curriculumId, itemIds }: { curriculumId: string; itemIds: string[] }) =>
      reorderCurriculumItems({ curriculumId, itemIds }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-curriculum-items", variables.curriculumId] });
    },
    onError: (error: unknown, variables) => {
      console.error("Failed to reorder curriculum items", error);
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["dashboard-curriculum-items", variables.curriculumId] });
    },
  });

  const handlePlanCurriculumLesson = useCallback(
    (item: DashboardCurriculumItem) => {
      if (!item || item.isExample) {
        return;
      }

      const classFromCurriculum = selectedCurriculum?.class ?? null;
      const context: LessonBuilderRouteContext = {
        title: item.lesson_title,
        classId: classFromCurriculum?.id ?? null,
        classTitle: classFromCurriculum?.title ?? null,
        stage: item.stage ?? classFromCurriculum?.stage ?? null,
        date: item.scheduled_on ?? null,
        sequence: Number.isFinite(item.seq_index)
          ? item.seq_index
          : Number.isFinite(item.position)
          ? item.position
          : null,
        curriculumId: item.curriculum_id,
      };

      setActiveCurriculumId(item.curriculum_id);
      setLessonBuilderContext(context);
    },
    [selectedCurriculum, setLessonBuilderContext],
  );

  const handleOpenLessonPlan = useCallback(
    (item: DashboardCurriculumItem) => {
      if (!item || item.isExample) {
        return;
      }

      if (!item.lesson_plan_id) {
        toast({ description: t.dashboard.toasts.lessonPlanMissing });
        return;
      }

      navigate(`/lesson-builder?id=${encodeURIComponent(item.lesson_plan_id)}`);
    },
    [navigate, t.dashboard.toasts.lessonPlanMissing, toast],
  );

  const handleReorderCurriculumItems = useCallback(
    (itemIds: string[]) => {
      if (!effectiveCurriculumId || itemIds.length === 0 || selectedCurriculum?.isExample) {
        return;
      }

      reorderCurriculumItemsMutation.mutate({ curriculumId: effectiveCurriculumId, itemIds });
    },
    [effectiveCurriculumId, reorderCurriculumItemsMutation, selectedCurriculum?.isExample],
  );

  const derivedNameParts = useMemo(() => {
    const fallback = deriveNamePartsFromFullName(fullName ?? displayName ?? null);
    return {
      honorific: normalizeName(honorific ?? undefined),
      firstName: normalizeName(firstName ?? fallback.firstName ?? undefined),
      lastName: normalizeName(lastName ?? fallback.lastName ?? undefined),
    };
  }, [displayName, firstName, fullName, honorific, lastName]);

  const teacherPreviewName = normalizeName(displayName) ?? normalizeName(fullName) ?? "Morgan Patel";
  const teacherPreviewClassLabel = `${DASHBOARD_EXAMPLE_CLASS.title} • ${DASHBOARD_EXAMPLE_CLASS.stage}`;

  if (!hasEnteredPrototype) {
    return (
      <>
        <SEO title="Teacher" description="Teacher workspace dashboard" />
        <PrototypeAccessPanel
          onEnter={handleEnterPrototype}
          teacherPreviewName={teacherPreviewName}
          teacherPreviewClassLabel={teacherPreviewClassLabel}
        />
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <SEO title="Teacher" description="Teacher workspace dashboard" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-1/4 right-[-12rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>
      <div
        ref={journeyContentRef}
        className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-24 pt-2.5 md:px-8"
      >
        {showingExampleData ? (
          <Alert className="border-white/20 bg-white/10 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
            <AlertTitle className="text-lg font-semibold text-white">
              {t.dashboard.common.exampleActionsTitle}
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-3 text-white/75 sm:flex-row sm:items-center sm:justify-between">
              <span>{t.dashboard.common.exampleActionsDescription}</span>
              <Button
                onClick={() => seedExampleDataMutation.mutate()}
                disabled={seedExampleDataMutation.isPending}
                aria-label={t.dashboard.common.exampleActionsCta}
                className="rounded-xl border-white/40 bg-white/90 text-slate-900 hover:bg-white"
              >
                {seedExampleDataMutation.isPending ? t.common.loading : t.dashboard.common.exampleActionsCta}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        <DashboardHeader
          nameParts={derivedNameParts}
          displayName={normalizeName(displayName) ?? normalizeName(fullName)}
          avatarUrl={avatarUrl}
          onQuickAction={handleQuickAction}
        />
        <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_90px_-35px_rgba(15,23,42,0.9)] backdrop-blur-2xl md:p-10">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
            <TabsList className="mx-auto grid w-full gap-2 border-0 px-2 text-white/70 sm:w-auto sm:auto-cols-max sm:grid-flow-col sm:px-4">
              {DASHBOARD_TABS.map(tab => (
                <TabsTrigger key={tab} value={tab} className={GLASS_TAB_TRIGGER_CLASS}>
                  {getTabLabel(tab)}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="curriculum" className="space-y-6">
              <CurriculumTabContent
                panelClassName={GLASS_PANEL_CLASS}
                translations={t}
                curricula={curricula}
                curriculaLoading={curriculaQuery.isLoading}
                selectedCurriculum={selectedCurriculum}
                curriculumItems={curriculumItems}
                curriculumItemsLoading={curriculumItemsLoading}
                reorderPending={reorderCurriculumItemsMutation.isPending}
                canReorderSelectedCurriculum={Boolean(selectedCurriculum && !selectedCurriculum.isExample)}
                onNewCurriculum={() => setCurriculumDialogOpen(true)}
                onOpenCurriculum={id => {
                  setActiveCurriculumId(id);
                  navigate(`/teacher/curriculum/${id}`);
                }}
                onExportCurriculum={_id => toast({ description: t.dashboard.toasts.exportUnavailable })}
                onPlanLesson={handlePlanCurriculumLesson}
                onOpenLessonPlan={handleOpenLessonPlan}
                onReorderCurriculumItems={handleReorderCurriculumItems}
              />
            </TabsContent>
            <TabsContent value="classes" className="space-y-6">
              <ClassesTabContent
                panelClassName={GLASS_PANEL_CLASS}
                classes={classes}
                loading={classesQuery.isLoading}
                onNewClass={() => setClassDialogOpen(true)}
                onViewClass={classId =>
                  navigate(`/teacher?tab=classes&classId=${encodeURIComponent(classId)}`)
                }
                onEditClass={classId =>
                  navigate(`/teacher?tab=classes&classId=${encodeURIComponent(classId)}`)
                }
              />
            </TabsContent>
            <TabsContent value="lessonBuilder" className="space-y-6">
              <LessonBuilderTabContent
                panelClassName={GLASS_PANEL_CLASS}
                translations={t}
                lessonBuilderContext={lessonBuilderContext}
                summaryItems={lessonBuilderSummaryItems}
                onBrowseCurriculum={() => handleTabChange("curriculum")}
              />
            </TabsContent>
            <TabsContent value="students" className="space-y-6">
              <StudentsTabContent
                panelClassName={GLASS_PANEL_CLASS}
                classes={classes}
                onOpenStudent={studentId => navigate(`/teacher/students/${studentId}`)}
              />
            </TabsContent>
            <TabsContent value="assessments" className="space-y-6">
              <AssessmentsTabContent panelClassName={GLASS_PANEL_CLASS} />
            </TabsContent>
          </Tabs>
        </section>

        <NewClassDialog
          open={isClassDialogOpen}
          onOpenChange={setClassDialogOpen}
          form={classForm}
          translations={t}
          submitting={createClassMutation.isPending}
          onSubmit={values => createClassMutation.mutate(values)}
        />

        <NewCurriculumDialog
          open={isCurriculumDialogOpen}
          onOpenChange={setCurriculumDialogOpen}
          form={curriculumForm}
          translations={t}
          classes={classesQuery.data ?? []}
          submitting={createCurriculumMutation.isPending}
          onSubmit={values => createCurriculumMutation.mutate(values)}
        />
      </div>
    </div>
  );
}
