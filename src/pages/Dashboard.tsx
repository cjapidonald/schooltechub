import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardHeader, DashboardQuickAction } from "@/components/dashboard/DashboardHeader";
import { ClassesTable } from "@/components/dashboard/ClassesTable";
import { CurriculaList } from "@/components/dashboard/CurriculaList";
import { CurriculumEditor } from "@/components/dashboard/CurriculumEditor";
import {
  createClass,
  createCurriculum,
  createLessonPlanFromItem,
  fetchCurricula,
  fetchCurriculumItems,
  fetchMyClasses,
  fetchMyProfile,
} from "@/features/dashboard/api";
import {
  DASHBOARD_EXAMPLE_CLASS,
  DASHBOARD_EXAMPLE_CURRICULUM,
  DASHBOARD_EXAMPLE_CURRICULUM_ID,
  DASHBOARD_EXAMPLE_CURRICULUM_ITEMS,
  type DashboardCurriculumSummary,
} from "@/features/dashboard/examples";
import type { Class, CurriculumItem, Profile } from "../../types/supabase-tables";

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

export default function DashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useOptionalUser();

  const [isClassDialogOpen, setClassDialogOpen] = useState(false);
  const [isCurriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);

  const classForm = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { title: "", stage: "", subject: "", start_date: "", end_date: "" },
  });
  const curriculumForm = useForm<CurriculumFormValues>({
    resolver: zodResolver(curriculumSchema),
    defaultValues: { title: "", class_id: "", subject: "", academic_year: "", lesson_titles: "" },
  });

  const profileQuery = useQuery<Profile | null>({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: () => fetchMyProfile(user!.id),
    enabled: Boolean(user?.id),
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

  const createLessonPlanMutation = useMutation({
    mutationFn: (curriculumItemId: string) =>
      createLessonPlanFromItem({ ownerId: user!.id, curriculumItemId }),
    onSuccess: lessonPlan => {
      toast({ description: t.dashboard.toasts.lessonPlanCreated });
      navigate(`/lesson-builder/${lessonPlan.id}`);
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const handleQuickAction = (action: DashboardQuickAction) => {
    switch (action) {
      case "ask-question":
        navigate("/blog/new");
        return;
      case "post-blog":
        navigate("/blog/new");
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

  const fallbackCurriculumId = curricula[0]?.id ?? null;
  const effectiveCurriculumId = activeCurriculumId ?? fallbackCurriculumId;

  const shouldFetchCurriculumItems = Boolean(
    effectiveCurriculumId && effectiveCurriculumId !== DASHBOARD_EXAMPLE_CURRICULUM_ID,
  );

  const curriculumItemsQuery = useQuery<CurriculumItem[]>({
    queryKey: ["dashboard-curriculum-items", effectiveCurriculumId],
    queryFn: () => fetchCurriculumItems(effectiveCurriculumId!),
    enabled: shouldFetchCurriculumItems,
  });

  const selectedCurriculum = useMemo(
    () => (effectiveCurriculumId ? curricula.find(curriculum => curriculum.id === effectiveCurriculumId) ?? null : null),
    [curricula, effectiveCurriculumId],
  );

  const curriculumItems = useMemo(() => {
    if (!effectiveCurriculumId) {
      return [];
    }
    if (effectiveCurriculumId === DASHBOARD_EXAMPLE_CURRICULUM_ID) {
      return DASHBOARD_EXAMPLE_CURRICULUM_ITEMS;
    }
    return curriculumItemsQuery.data ?? [];
  }, [effectiveCurriculumId, curriculumItemsQuery.data]);

  const curriculumItemsLoading = shouldFetchCurriculumItems ? curriculumItemsQuery.isLoading : false;

  if (!user) {
    return (
      <main className="container space-y-8 py-10">
        <SEO title="My Dashboard" description="Teacher workspace dashboard" />
        <div className="rounded-xl border bg-muted/10 p-10 text-center text-muted-foreground">
          {t.dashboard.common.signInPrompt}
        </div>
      </main>
    );
  }

  return (
    <main className="container space-y-8 py-10">
      <SEO title="My Dashboard" description="Teacher workspace dashboard" />
      <DashboardHeader
        profile={profileQuery.data ?? null}
        avatarUrl={profileQuery.data?.avatar_url ?? null}
        onQuickAction={handleQuickAction}
      />
      <Tabs defaultValue="curriculum" className="space-y-6">
        <TabsList>
          <TabsTrigger value="curriculum">{t.dashboard.tabs.curriculum}</TabsTrigger>
          <TabsTrigger value="classes">{t.dashboard.tabs.classes}</TabsTrigger>
          <TabsTrigger value="lessonPlans" disabled>
            {t.dashboard.tabs.lessonPlans}
          </TabsTrigger>
          <TabsTrigger value="resources" disabled>
            {t.dashboard.tabs.resources}
          </TabsTrigger>
          <TabsTrigger value="activity" disabled>
            {t.dashboard.tabs.activity}
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
                onCreateLessonPlan={id => createLessonPlanMutation.mutate(id)}
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
    </main>
  );
}
