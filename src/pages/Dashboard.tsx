import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardHeader, DashboardQuickAction } from "@/components/dashboard/DashboardHeader";
import { ClassesTable } from "@/components/dashboard/ClassesTable";
import { CurriculaList } from "@/components/dashboard/CurriculaList";
import { CurriculumEditor } from "@/components/dashboard/CurriculumEditor";
import { StudentsSection } from "@/components/dashboard/StudentsSection";
import { SkillsSection } from "@/components/dashboard/SkillsSection";
import LessonBuilderPage from "@/pages/lesson-builder/LessonBuilderPage";
import {
  attachResourceToLessonPlan,
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
  DASHBOARD_EXAMPLE_CURRICULUM,
  DASHBOARD_EXAMPLE_CURRICULUM_ID,
  DASHBOARD_EXAMPLE_CURRICULUM_ITEMS,
  type DashboardCurriculumItem,
  type DashboardCurriculumSummary,
} from "@/features/dashboard/examples";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { Class } from "../../types/supabase-tables";

const normalizeName = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const deriveNamePartsFromFullName = (fullName: string | null | undefined) => {
  const normalized = normalizeName(fullName);
  if (!normalized) {
    return { firstName: null, lastName: null };
  }

  const segments = normalized.split(/\s+/).filter(Boolean);
  if (segments.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (segments.length === 1) {
    return { firstName: segments[0], lastName: null };
  }

  return { firstName: segments[0], lastName: segments[segments.length - 1] };
};

const classSchema = z.object({
  title: z.string().min(2),
  stage: z.string().optional(),
  subject: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const curriculumSchema = z.object({
  title: z.string().min(3),
  class_id: z.string().uuid(),
  subject: z.string().min(2),
  academic_year: z.string().optional(),
  lesson_titles: z.string().min(3),
});

type ClassFormValues = z.infer<typeof classSchema>;
type CurriculumFormValues = z.infer<typeof curriculumSchema>;

const splitLessonTitles = (input: string) =>
  input
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

type LessonBuilderRouteContext = {
  title: string;
  classId: string | null;
  classTitle: string | null;
  stage: string | null;
  date: string | null;
  sequence: number | null;
  curriculumId: string | null;
};

const formatLessonContextDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return format(new Date(value), "PPP");
  } catch {
    return value;
  }
};

const DASHBOARD_TABS = ["curriculum", "classes", "lessonBuilder", "students", "skills"] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];

const isDashboardTab = (value: string | null): value is DashboardTab =>
  Boolean(value && (DASHBOARD_TABS as readonly string[]).includes(value));

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
  const [quickAttachTargetId, setQuickAttachTargetId] = useState<string | null>(null);

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
  const activeTab: DashboardTab = isDashboardTab(requestedTab) ? requestedTab : "curriculum";

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

  const lessonBuilderSummaryItems = useMemo(
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
      const next: DashboardTab = isDashboardTab(value) ? value : "curriculum";
      updateSearchParams(params => {
        params.set("tab", next);
      });
    },
    [updateSearchParams],
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
        navigate("/blog/new");
        return;
      case "new-lesson-plan":
        setLessonBuilderContext(null);
        return;
      case "new-curriculum":
        setCurriculumDialogOpen(true);
        return;
      case "new-class":
        setClassDialogOpen(true);
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

  const curricula = useMemo(() => {
    if (curriculaQuery.data && curriculaQuery.data.length > 0) {
      return curriculaQuery.data;
    }
    return [DASHBOARD_EXAMPLE_CURRICULUM];
  }, [curriculaQuery.data]);

  const showingExampleData = useMemo(() => {
    if (classesQuery.isLoading || curriculaQuery.isLoading) {
      return false;
    }
    return classes.some(item => item.isExample) || curricula.some(item => item.isExample);
  }, [classes, curricula, classesQuery.isLoading, curriculaQuery.isLoading]);

  const hasCurriculumContext = useMemo(() => {
    if (!curriculaQuery.data || curriculaQuery.data.length === 0) {
      return false;
    }
    return curriculaQuery.data.some(item => !item.isExample);
  }, [curriculaQuery.data]);

  const fallbackCurriculumId = curricula[0]?.id ?? null;
  const effectiveCurriculumId = activeCurriculumId ?? fallbackCurriculumId;

  const shouldFetchCurriculumItems = Boolean(
    effectiveCurriculumId && effectiveCurriculumId !== DASHBOARD_EXAMPLE_CURRICULUM_ID,
  );

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
    if (effectiveCurriculumId === DASHBOARD_EXAMPLE_CURRICULUM_ID) {
      return DASHBOARD_EXAMPLE_CURRICULUM_ITEMS;
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
        sequence: Number.isFinite(item.seq_index) ? item.seq_index : Number.isFinite(item.position) ? item.position : null,
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

      navigate(`/builder/lesson-plans/${item.lesson_plan_id}`);
    },
    [navigate, t.dashboard.toasts.lessonPlanMissing, toast],
  );

  const handleQuickAttachResource = useCallback(
    async (item: DashboardCurriculumItem) => {
      if (!item || item.isExample) {
        return;
      }

      if (!item.lesson_plan_id) {
        toast({ description: t.dashboard.toasts.lessonPlanMissing });
        return;
      }

      const resourceId = item.resource_shortcut_ids?.[0] ?? null;
      if (!resourceId) {
        toast({ description: t.dashboard.toasts.resourceShortcutMissing });
        return;
      }

      try {
        setQuickAttachTargetId(item.id);
        await attachResourceToLessonPlan({ lessonPlanId: item.lesson_plan_id, resourceId });
        toast({ description: t.dashboard.toasts.resourceAttached });
      } catch (error) {
        console.error("Failed to quick attach resource", error);
        toast({ description: t.dashboard.toasts.resourceAttachError, variant: "destructive" });
      } finally {
        setQuickAttachTargetId(null);
      }
    },
    [toast, t.dashboard.toasts.lessonPlanMissing, t.dashboard.toasts.resourceShortcutMissing, t.dashboard.toasts.resourceAttached, t.dashboard.toasts.resourceAttachError],
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

  if (!user) {
    return (
      <div className="container space-y-8 py-10">
        <SEO title="Teacher" description="Teacher workspace dashboard" />
        <div className="rounded-xl border bg-muted/10 p-10 text-center text-muted-foreground">
          {t.dashboard.common.signInPrompt}
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-10">
      <SEO title="Teacher" description="Teacher workspace dashboard" />
      {showingExampleData ? (
        <Alert>
          <AlertTitle>{t.dashboard.common.exampleActionsTitle}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t.dashboard.common.exampleActionsDescription}</span>
            <Button
              onClick={() => seedExampleDataMutation.mutate()}
              disabled={seedExampleDataMutation.isPending}
              aria-label={t.dashboard.common.exampleActionsCta}
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
        hasCurriculumContext={hasCurriculumContext}
        onQuickAction={handleQuickAction}
      />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full gap-2 sm:grid-cols-5">
          <TabsTrigger value="curriculum" className="w-full">
            {t.dashboard.tabs.curriculum}
          </TabsTrigger>
          <TabsTrigger value="classes" className="w-full">
            {t.dashboard.tabs.classes}
          </TabsTrigger>
          <TabsTrigger value="lessonBuilder" className="w-full">
            {t.dashboard.tabs.lessonBuilder}
          </TabsTrigger>
          <TabsTrigger value="students" className="w-full">
            {t.dashboard.tabs.students}
          </TabsTrigger>
          <TabsTrigger value="skills" className="w-full">
            {t.dashboard.tabs.skills}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="curriculum" className="space-y-6">
          <CurriculaList
            curricula={curricula}
            loading={curriculaQuery.isLoading}
            onNewCurriculum={() => setCurriculumDialogOpen(true)}
            onOpenCurriculum={setActiveCurriculumId}
            onExportCurriculum={id => toast({ description: t.dashboard.toasts.exportUnavailable })}
          />
          {selectedCurriculum ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t.dashboard.curriculumView.title.replace("{title}", selectedCurriculum.title)}
              </h3>
              <CurriculumEditor
                items={curriculumItems}
                loading={curriculumItemsLoading}
                reordering={reorderCurriculumItemsMutation.isPending}
                quickAttachBusyId={quickAttachTargetId}
                onPlanLesson={handlePlanCurriculumLesson}
                onOpenLessonPlan={handleOpenLessonPlan}
                onQuickAttachResource={handleQuickAttachResource}
                onReorder={selectedCurriculum.isExample ? undefined : handleReorderCurriculumItems}
              />
            </div>
          ) : null}
        </TabsContent>
        <TabsContent value="classes">
          <ClassesTable
            classes={classes}
            loading={classesQuery.isLoading}
            onNewClass={() => setClassDialogOpen(true)}
            onViewClass={classId => navigate(`/account/classes/${classId}`)}
            onEditClass={classId => navigate(`/account/classes/${classId}`)}
          />
        </TabsContent>
        <TabsContent value="lessonBuilder" className="space-y-6">
          {lessonBuilderContext ? (
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground">
                  {t.dashboard.lessonBuilder.contextTitle}
                </h3>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {lessonBuilderSummaryItems.map(item => (
                    <div key={item.key} className="space-y-1 text-left">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="text-base font-semibold text-foreground">
                        {item.value ?? t.dashboard.lessonBuilder.fallback}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <LessonBuilderPage
                layoutMode="embedded"
                initialMeta={{
                  title: lessonBuilderContext.title,
                  date: lessonBuilderContext.date ?? null,
                }}
                initialClassId={lessonBuilderContext.classId ?? null}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {t.dashboard.lessonBuilder.intercept.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.dashboard.lessonBuilder.intercept.description}
              </p>
              <Button className="mt-6" variant="outline" onClick={() => handleTabChange("curriculum")}>
                {t.dashboard.lessonBuilder.intercept.cta}
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="students">
          <StudentsSection
            classes={classes}
            onOpenStudent={studentId => navigate(`/dashboard/students/${studentId}`)}
          />
        </TabsContent>
        <TabsContent value="skills">
          <SkillsSection classes={classes} />
        </TabsContent>
      </Tabs>

      <Dialog open={isClassDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.dashboard.dialogs.newClass.title}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={classForm.handleSubmit(values => createClassMutation.mutate(values))}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="class-title">{t.dashboard.dialogs.newClass.fields.title}</Label>
              <Input id="class-title" {...classForm.register("title")} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class-stage">{t.dashboard.dialogs.newClass.fields.stage}</Label>
              <Input id="class-stage" {...classForm.register("stage")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class-subject">{t.dashboard.dialogs.newClass.fields.subject}</Label>
              <Input id="class-subject" {...classForm.register("subject")} />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="class-start">{t.dashboard.dialogs.newClass.fields.startDate}</Label>
                <Input id="class-start" type="date" {...classForm.register("start_date")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class-end">{t.dashboard.dialogs.newClass.fields.endDate}</Label>
                <Input id="class-end" type="date" {...classForm.register("end_date")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClassDialogOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={createClassMutation.isPending}>
                {t.dashboard.dialogs.newClass.submit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCurriculumDialogOpen} onOpenChange={setCurriculumDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.dashboard.dialogs.newCurriculum.title}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={curriculumForm.handleSubmit(values => createCurriculumMutation.mutate(values))}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="curriculum-title">{t.dashboard.dialogs.newCurriculum.fields.title}</Label>
              <Input id="curriculum-title" {...curriculumForm.register("title")} required />
            </div>
            <div className="grid gap-2">
              <Label>{t.dashboard.dialogs.newCurriculum.fields.class}</Label>
              <Select
                value={curriculumForm.watch("class_id")}
                onValueChange={value => curriculumForm.setValue("class_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.dashboard.dialogs.newCurriculum.fields.classPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {(classesQuery.data ?? []).map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="curriculum-subject">{t.dashboard.dialogs.newCurriculum.fields.subject}</Label>
              <Input id="curriculum-subject" {...curriculumForm.register("subject")} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="curriculum-year">{t.dashboard.dialogs.newCurriculum.fields.academicYear}</Label>
              <Input id="curriculum-year" {...curriculumForm.register("academic_year")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="curriculum-lessons">{t.dashboard.dialogs.newCurriculum.fields.lessonTitles}</Label>
              <Textarea
                id="curriculum-lessons"
                rows={6}
                placeholder={t.dashboard.dialogs.newCurriculum.fields.lessonTitlesPlaceholder}
                {...curriculumForm.register("lesson_titles")}
              />
              <p className="text-xs text-muted-foreground">
                {t.dashboard.dialogs.newCurriculum.helper}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCurriculumDialogOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={createCurriculumMutation.isPending}>
                {t.dashboard.dialogs.newCurriculum.submit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
