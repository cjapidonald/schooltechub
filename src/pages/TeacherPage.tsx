import { useMemo, useState, useCallback, useEffect, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { DashboardHeader, DashboardQuickAction } from "@/components/dashboard/DashboardHeader";
import { ClassesTable } from "@/components/dashboard/ClassesTable";
import { StudentsSection } from "@/components/dashboard/StudentsSection";
import { AssessmentsSection } from "@/components/dashboard/AssessmentsSection";
import LessonBuilderPage from "@/pages/lesson-builder/LessonBuilderPage";
import {
  createClass,
  deleteCurriculum,
  fetchCurriculumForClass,
  fetchMyClasses,
  updateClass,
  upsertCurriculum,
} from "@/features/dashboard/api";
import { DASHBOARD_EXAMPLE_CLASS } from "@/features/dashboard/examples";
import { bulkAddStudents, fetchClassRoster, replaceClassRoster } from "@/features/students/api";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { Class } from "../../types/supabase-tables";
import { BarChart3, ClipboardList, LogIn, Sparkles, Users } from "lucide-react";

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

const TEACHER_PORTAL_FEATURES = [
  { id: "planner", icon: ClipboardList, label: "Plan technology-rich lessons" },
  { id: "students", icon: Users, label: "Monitor student progress snapshots" },
  { id: "insights", icon: Sparkles, label: "Surface AI-powered coaching prompts" },
  { id: "reports", icon: BarChart3, label: "Assemble reports in seconds" },
] as const;

const classSchema = z.object({
  title: z.string().min(2),
  stage: z.string().optional(),
  subject: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  studentNames: z.string().optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;

const editClassSchema = classSchema.extend({
  curriculumTitle: z.string().optional(),
  curriculumSubject: z.string().optional(),
  curriculumYear: z.string().optional(),
});

type EditClassFormValues = z.infer<typeof editClassSchema>;

type LessonBuilderRouteContext = {
  title: string;
  classId: string | null;
  classTitle: string | null;
  stage: string | null;
  date: string | null;
  sequence: number | null;
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

const DASHBOARD_TABS = ["curriculum", "classes", "lessonBuilder", "students", "assessments"] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];

const isDashboardTab = (value: string | null): value is DashboardTab =>
  Boolean(value && (DASHBOARD_TABS as readonly string[]).includes(value));

const GLASS_PANEL_CLASS =
  "rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-[0_40px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl md:p-8";

const GLASS_TAB_TRIGGER_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition backdrop-blur-xl hover:border-white/40 hover:bg-white/15 hover:text-white data-[state=active]:border-white/60 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:shadow-[0_15px_45px_-25px_rgba(15,23,42,0.85)]";

const splitStudentNames = (input: string | undefined) =>
  (input ?? "")
    .split(/\r?\n/)
    .map(name => name.trim())
    .filter(Boolean);

const GLASS_SELECT_CARD_CLASS =
  "w-full rounded-2xl border border-white/15 bg-white/10 p-5 text-left text-white/75 transition hover:border-white/40 hover:bg-white/15 hover:text-white";

export default function TeacherPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
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
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasEnteredPrototype, setHasEnteredPrototype] = useState(() => Boolean(user));
  const [selectedCurriculumClassId, setSelectedCurriculumClassId] = useState<string | null>(null);
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
        const keys = ["lessonTitle", "lessonClassId", "lessonClassTitle", "lessonStage", "lessonDate", "lessonSeq"];
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
                lessonBuilderContext.sequence !== null ? `#${lessonBuilderContext.sequence}` : null,
            },
          ]
        : [],
    [lessonBuilderContext, t],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const next: DashboardTab = isDashboardTab(value) ? value : "classes";
      updateSearchParams(params => {
        params.set("tab", next);
      });
    },
    [updateSearchParams],
  );

  const classForm = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { title: "", stage: "", subject: "", start_date: "", end_date: "", studentNames: "" },
  });

  const editClassForm = useForm<EditClassFormValues>({
    resolver: zodResolver(editClassSchema),
    defaultValues: {
      title: "",
      stage: "",
      subject: "",
      start_date: "",
      end_date: "",
      studentNames: "",
      curriculumTitle: "",
      curriculumSubject: "",
      curriculumYear: "",
    },
  });

  const classesQuery = useQuery<Class[]>({
    queryKey: ["dashboard-classes", user?.id],
    queryFn: () => fetchMyClasses(user!.id),
    enabled: Boolean(user?.id),
  });

  const queryClient = useQueryClient();

  const createClassMutation = useMutation({
    mutationFn: async (values: ClassFormValues) => {
      const createdClass = await createClass({
        ownerId: user!.id,
        title: values.title,
        stage: values.stage,
        subject: values.subject,
        start_date: values.start_date,
        end_date: values.end_date,
      });

      const rosterNames = splitStudentNames(values.studentNames);

      if (rosterNames.length > 0) {
        await bulkAddStudents({ ownerId: user?.id, classId: createdClass.id, names: rosterNames });
      }

      return { rosterCount: rosterNames.length };
    },
    onSuccess: ({ rosterCount }, variables) => {
      setClassDialogOpen(false);
      classForm.reset();
      void classesQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["dashboard-students"] });

      const toastDescription =
        rosterCount > 0
          ? t.dashboard.toasts.classCreatedWithStudents
              .replace("{title}", variables.title)
              .replace("{count}", rosterCount.toLocaleString())
          : t.dashboard.toasts.classCreatedNoStudents.replace("{title}", variables.title);

      toast({
        title: t.dashboard.toasts.classCreated,
        description: toastDescription,
      });
    },
    onError: error => {
      const description = error instanceof Error ? error.message : t.dashboard.toasts.classError;
      toast({ description, variant: "destructive" });
    },
  });

  const editClassMutation = useMutation({
    mutationFn: async (values: EditClassFormValues) => {
      if (!editingClassId || !editingClass) {
        throw new Error("No class selected");
      }

      if (!user?.id) {
        throw new Error("You must be signed in to update a class.");
      }

      const trimmedStage = values.stage?.trim() ?? "";
      const trimmedSubject = values.subject?.trim() ?? "";
      const trimmedStart = values.start_date?.trim() ?? "";
      const trimmedEnd = values.end_date?.trim() ?? "";

      const updatedClass = await updateClass({
        ownerId: user.id,
        classId: editingClassId,
        title: values.title,
        stage: trimmedStage.length > 0 ? trimmedStage : undefined,
        subject: trimmedSubject.length > 0 ? trimmedSubject : undefined,
        start_date: trimmedStart.length > 0 ? trimmedStart : undefined,
        end_date: trimmedEnd.length > 0 ? trimmedEnd : undefined,
      });

      const rosterNames = splitStudentNames(values.studentNames);
      await replaceClassRoster({ ownerId: user.id, classId: editingClassId, names: rosterNames });

      const trimmedCurriculumTitle = values.curriculumTitle?.trim() ?? "";
      const trimmedCurriculumSubject = values.curriculumSubject?.trim() ?? "";
      const trimmedCurriculumYear = values.curriculumYear?.trim() ?? "";
      const existingCurriculum = classCurriculumQuery.data ?? null;

      if (
        !trimmedCurriculumTitle &&
        !trimmedCurriculumSubject &&
        !trimmedCurriculumYear &&
        existingCurriculum
      ) {
        await deleteCurriculum({ ownerId: user.id, curriculumId: existingCurriculum.id });
        return { classTitle: updatedClass.title };
      }

      if (trimmedCurriculumTitle || trimmedCurriculumSubject || trimmedCurriculumYear || existingCurriculum) {
        const curriculum = await upsertCurriculum({
          ownerId: user.id,
          classId: editingClassId,
          curriculumId: existingCurriculum?.id,
          title: trimmedCurriculumTitle || existingCurriculum?.title || updatedClass.title,
          subject:
            trimmedCurriculumSubject ||
            existingCurriculum?.subject ||
            trimmedSubject ||
            editingClass.subject ||
            "General",
          academic_year: trimmedCurriculumYear || existingCurriculum?.academic_year || null,
        });

        return { classTitle: updatedClass.title, curriculumTitle: curriculum.title };
      }

      return { classTitle: updatedClass.title };
    },
    onSuccess: result => {
      const title = result.classTitle ?? editingClass?.title ?? "";
      toast({
        title: t.dashboard.toasts.classUpdated,
        description: t.dashboard.toasts.classUpdatedDescription.replace("{title}", title),
      });

      void classesQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["dashboard-students"] });
      void classRosterQuery.refetch();
      if (user?.id) {
        void classCurriculumQuery.refetch();
      }

      handleCloseEditDialog();
    },
    onError: error => {
      const description = error instanceof Error ? error.message : t.dashboard.toasts.error;
      toast({ description, variant: "destructive" });
    },
  });

  const handleQuickAction = useCallback(
    (action: DashboardQuickAction) => {
      switch (action) {
        case "ask-question":
          toast({ description: t.dashboard.toasts.communityUnavailable, variant: "destructive" });
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
    },
    [navigate, t.dashboard.toasts.blogUnavailable, t.dashboard.toasts.communityUnavailable, toast],
  );

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditingClassId(null);
    editClassForm.reset();
  }, [editClassForm]);

  const classes = useMemo<Array<Class & { isExample?: boolean }>>(() => {
    if (classesQuery.data && classesQuery.data.length > 0) {
      return classesQuery.data;
    }
    return [DASHBOARD_EXAMPLE_CLASS];
  }, [classesQuery.data]);

  const editingClass = useMemo(() => {
    if (!editingClassId) {
      return null;
    }
    return (classesQuery.data ?? []).find(cls => cls.id === editingClassId) ?? null;
  }, [classesQuery.data, editingClassId]);

  const classRosterQuery = useQuery({
    queryKey: ["dashboard-class-roster", editingClassId, user?.id],
    queryFn: () => fetchClassRoster({ ownerId: user?.id, classId: editingClassId! }),
    enabled: Boolean(editingClassId),
  });

  const classCurriculumQuery = useQuery({
    queryKey: ["dashboard-class-curriculum", editingClassId, user?.id],
    queryFn: () => fetchCurriculumForClass({ ownerId: user!.id, classId: editingClassId! }),
    enabled: Boolean(editingClassId && user?.id),
  });

  useEffect(() => {
    if (!isEditDialogOpen) {
      editClassForm.reset();
      return;
    }

    if (!editingClass || classRosterQuery.isPending || classCurriculumQuery.isPending) {
      return;
    }

    editClassForm.reset({
      title: editingClass.title,
      stage: editingClass.stage ?? "",
      subject: editingClass.subject ?? "",
      start_date: editingClass.start_date ?? "",
      end_date: editingClass.end_date ?? "",
      studentNames: (classRosterQuery.data ?? []).map(student => student.fullName).join("\n"),
      curriculumTitle: classCurriculumQuery.data?.title ?? "",
      curriculumSubject: classCurriculumQuery.data?.subject ?? "",
      curriculumYear: classCurriculumQuery.data?.academic_year ?? "",
    });
  }, [
    classCurriculumQuery.data,
    classCurriculumQuery.isPending,
    classRosterQuery.data,
    classRosterQuery.isPending,
    editClassForm,
    editingClass,
    isEditDialogOpen,
  ]);

  const isRosterLoading = classRosterQuery.isPending;
  const isCurriculumLoading = user?.id ? classCurriculumQuery.isPending : false;
  const isEditFormLoading = !editingClass || isRosterLoading || isCurriculumLoading;

  const rosterErrorMessage = classRosterQuery.error
    ? classRosterQuery.error instanceof Error
      ? classRosterQuery.error.message
      : t.dashboard.toasts.error
    : null;

  const curriculumErrorMessage =
    user?.id && classCurriculumQuery.error
      ? classCurriculumQuery.error instanceof Error
        ? classCurriculumQuery.error.message
        : t.dashboard.toasts.error
      : null;

  const curriculumClasses = useMemo(
    () =>
      classes.filter(
        cls =>
          !cls.isExample &&
          cls.id !== DASHBOARD_EXAMPLE_CLASS.id &&
          cls.title !== DASHBOARD_EXAMPLE_CLASS.title,
      ),
    [classes],
  );

  useEffect(() => {
    if (curriculumClasses.length === 0) {
      setSelectedCurriculumClassId(null);
      return;
    }

    if (activeTab !== "curriculum") {
      return;
    }

    setSelectedCurriculumClassId(prev => {
      if (prev && curriculumClasses.some(cls => cls.id === prev)) {
        return prev;
      }

      return curriculumClasses[0]?.id ?? null;
    });
  }, [activeTab, curriculumClasses]);

  const selectedCurriculumClass = useMemo(
    () => curriculumClasses.find(cls => cls.id === selectedCurriculumClassId) ?? null,
    [curriculumClasses, selectedCurriculumClassId],
  );

  const selectedCurriculumClassDetails = useMemo(() => {
    if (!selectedCurriculumClass) {
      return null;
    }

    const parts = [selectedCurriculumClass.stage, selectedCurriculumClass.subject].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : null;
  }, [selectedCurriculumClass]);

  const selectedCurriculumDateRange = useMemo(() => {
    if (!selectedCurriculumClass) {
      return null;
    }

    const start = formatLessonContextDate(selectedCurriculumClass.start_date ?? null);
    const end = formatLessonContextDate(selectedCurriculumClass.end_date ?? null);

    if (start && end) {
      return `${start} – ${end}`;
    }

    return start ?? end ?? null;
  }, [selectedCurriculumClass]);

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
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
        <SEO title="Teacher" description="Teacher workspace dashboard" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-[-10rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute top-1/3 left-[-10rem] h-[18rem] w-[18rem] rounded-full bg-emerald-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-24 md:px-8">
          <Card className="border-white/15 bg-white/10 text-white shadow-[0_25px_80px_-20px_rgba(15,23,42,0.75)] backdrop-blur-2xl">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Teacher journey portal
              </div>
              <CardTitle className="text-3xl font-semibold text-white md:text-4xl">
                Log in to your workspace
              </CardTitle>
              <CardDescription className="text-white/70">
                Preview lesson planning, student analytics, and reporting workflows instantly—no credentials required for this prototype.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-left">
                <p className="text-sm text-white/70">Previewing workspace for</p>
                <p className="text-lg font-medium text-white">{teacherPreviewName}</p>
                <p className="text-xs uppercase tracking-wide text-white/50">{teacherPreviewClassLabel}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="teacher-email" className="text-xs uppercase tracking-wide text-white/60">
                    School email
                  </Label>
                  <Input
                    id="teacher-email"
                    type="email"
                    placeholder="you@schooltechhub.com"
                    className="h-12 rounded-2xl border-white/20 bg-white/10 text-base text-white placeholder:text-white/40 focus-visible:ring-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-code" className="text-xs uppercase tracking-wide text-white/60">
                    Workspace code
                  </Label>
                  <Input
                    id="teacher-code"
                    type="text"
                    placeholder="Prototype access"
                    className="h-12 rounded-2xl border-white/20 bg-white/10 text-base text-white placeholder:text-white/40 focus-visible:ring-white/40"
                  />
                </div>
              </div>
              <div className="space-y-3 text-sm text-white/70">
                <p className="font-medium text-white">What you&apos;ll explore</p>
                <ul className="grid gap-2 text-left sm:grid-cols-2">
                  {TEACHER_PORTAL_FEATURES.map(({ id, icon: Icon, label }) => (
                    <li key={id} className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                type="button"
                className="h-12 w-full rounded-2xl bg-white/90 text-base font-semibold text-slate-900 shadow-[0_10px_40px_-20px_rgba(226,232,240,0.95)] hover:bg-white"
                size="lg"
                onClick={handleEnterPrototype}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Log in to my workspace
              </Button>
              <p className="text-center text-xs text-white/60">
                Prototype note: Selecting “Log in” instantly reveals the teacher dashboard experience.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
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
        <DashboardHeader
          nameParts={derivedNameParts}
          displayName={normalizeName(displayName) ?? normalizeName(fullName)}
          avatarUrl={avatarUrl}
          onQuickAction={handleQuickAction}
        />
        <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_90px_-35px_rgba(15,23,42,0.9)] backdrop-blur-2xl md:p-10">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
            <TabsList className="mx-auto grid w-full gap-2 border-0 px-2 text-white/70 sm:w-auto sm:auto-cols-max sm:grid-flow-col sm:px-4">
              <TabsTrigger value="curriculum" className={GLASS_TAB_TRIGGER_CLASS}>
                {t.dashboard.tabs.curriculum}
              </TabsTrigger>
              <TabsTrigger value="classes" className={GLASS_TAB_TRIGGER_CLASS}>
                {t.dashboard.tabs.classes}
              </TabsTrigger>
              <TabsTrigger value="lessonBuilder" className={GLASS_TAB_TRIGGER_CLASS}>
                {t.dashboard.tabs.lessonBuilder}
              </TabsTrigger>
              <TabsTrigger value="students" className={GLASS_TAB_TRIGGER_CLASS}>
                {t.dashboard.tabs.students}
              </TabsTrigger>
              <TabsTrigger value="assessments" className={GLASS_TAB_TRIGGER_CLASS}>
                {t.dashboard.tabs.assessments ?? "Assessments"}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="curriculum" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
                <div className="space-y-4">
                  <div className={cn(GLASS_PANEL_CLASS, "space-y-4")}>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">Curriculum boards</h3>
                      <p className="text-sm text-white/70">
                        Choose a class to outline units, essential questions, and lesson sequences.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {curriculumClasses.length > 0 ? (
                        curriculumClasses.map(cls => {
                          const isSelected = selectedCurriculumClass?.id === cls.id;
                          const details = [cls.stage, cls.subject].filter(Boolean).join(" • ");

                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => setSelectedCurriculumClassId(cls.id)}
                              className={cn(
                                GLASS_SELECT_CARD_CLASS,
                                isSelected
                                  ? "border-white/60 bg-white/25 text-white shadow-[0_18px_45px_-25px_rgba(15,23,42,0.85)]"
                                  : "text-white/75",
                              )}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <p className="text-base font-semibold text-white">{cls.title}</p>
                                    {details ? (
                                      <p className="text-xs uppercase tracking-wide text-white/60">{details}</p>
                                    ) : null}
                                  </div>
                                  {isSelected ? (
                                    <span className="inline-flex items-center rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                                      Active
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-white/70">{t.dashboard.curriculum.empty.title}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {selectedCurriculumClass ? (
                    <div className={cn(GLASS_PANEL_CLASS, "space-y-6")}> 
                      <div className="space-y-2">
                        <h3 className="text-2xl font-semibold text-white">{selectedCurriculumClass.title}</h3>
                        {selectedCurriculumClassDetails ? (
                          <p className="text-xs uppercase tracking-wide text-white/60">
                            {selectedCurriculumClassDetails}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-3 text-sm text-white/70">
                        <p>This curriculum overview is automatically created when you add a class.</p>
                        <p>
                          Use the lesson builder or classes tabs to continue planning while we prepare additional curriculum
                          tools for this space.
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-5">
                          <p className="text-xs uppercase tracking-wide text-white/60">Overview card</p>
                          <p className="text-base font-semibold text-white">{`${selectedCurriculumClass.title} overview`}</p>
                        </div>
                        {selectedCurriculumDateRange ? (
                          <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-5">
                            <p className="text-xs uppercase tracking-wide text-white/60">Schedule</p>
                            <p className="text-base font-semibold text-white">{selectedCurriculumDateRange}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : curriculumClasses.length === 0 ? (
                    <div className={cn(GLASS_PANEL_CLASS, "space-y-3 text-center text-white/70")}>
                      <h3 className="text-lg font-semibold text-white">{t.dashboard.curriculum.empty.title}</h3>
                      <p className="text-sm text-white/70">{t.dashboard.curriculum.empty.description}</p>
                    </div>
                  ) : (
                    <Alert className={cn(GLASS_PANEL_CLASS, "space-y-2 text-white")}>
                      <AlertTitle className="text-lg font-semibold text-white">Select a class</AlertTitle>
                      <AlertDescription className="text-sm text-white/70">
                        Choose a class card to begin building its curriculum outline.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="classes" className="space-y-6">
              <ClassesTable
                className={cn(GLASS_PANEL_CLASS, "space-y-6")}
                classes={classes}
                loading={classesQuery.isLoading}
                onNewClass={() => setClassDialogOpen(true)}
                onViewClass={classId =>
                  navigate(`/teacher?tab=classes&classId=${encodeURIComponent(classId)}`)
                }
                onEditClass={classId => {
                  updateSearchParams(params => {
                    params.set("tab", "classes");
                  });
                  setEditingClassId(classId);
                  setEditDialogOpen(true);
                }}
              />
            </TabsContent>
            <TabsContent value="lessonBuilder" className="space-y-6">
              {lessonBuilderContext ? (
                <div className="space-y-6">
                  <div className={cn(GLASS_PANEL_CLASS, "space-y-6")}> 
                    <h3 className="text-lg font-semibold">
                      {t.dashboard.lessonBuilder.contextTitle}
                    </h3>
                    <dl className="mt-4 grid gap-4 text-sm text-white/70 sm:grid-cols-2">
                      {lessonBuilderSummaryItems.map(item =>
                        item.value ? (
                          <div key={item.key}>
                            <dt className="text-xs uppercase tracking-wide text-white/60">{item.label}</dt>
                            <dd className="text-sm text-white">{item.value}</dd>
                          </div>
                        ) : null,
                      )}
                    </dl>
                    <Button
                      className="mt-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white"
                      onClick={() => setLessonBuilderContext(null)}
                    >
                      {t.dashboard.lessonBuilder.clearContext}
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 text-slate-900 shadow-[0_30px_120px_-35px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
                    <LessonBuilderPage />
                  </div>
                </div>
              ) : (
                <Alert className={cn(GLASS_PANEL_CLASS, "space-y-4 text-white")}> 
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {t.dashboard.lessonBuilder.emptyStateTitle}
                    </h3>
                    <p className="text-sm text-white/70">
                      {t.dashboard.lessonBuilder.emptyStateDescription}
                    </p>
                  </div>
                  <Button
                    className="rounded-xl border border-white/40 bg-white/90 text-slate-900 hover:bg-white"
                    onClick={() => setLessonBuilderContext({
                      title: t.dashboard.lessonBuilder.sampleLesson,
                      classId: null,
                      classTitle: null,
                      stage: null,
                      date: null,
                      sequence: null,
                    })}
                  >
                    {t.dashboard.lessonBuilder.launchBlank}
                  </Button>
                </Alert>
              )}
            </TabsContent>
            <TabsContent value="students" className="space-y-6">
              <StudentsSection
                classes={classes}
                onOpenStudent={studentId => navigate(`/teacher/students/${encodeURIComponent(studentId)}`)}
                className={cn(GLASS_PANEL_CLASS, "space-y-6")}
              />
            </TabsContent>
            <TabsContent value="assessments" className="space-y-6">
              <AssessmentsSection className={cn(GLASS_PANEL_CLASS, "space-y-6")} />
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={open => (open ? setEditDialogOpen(true) : handleCloseEditDialog())}>
        <DialogContent className="sm:max-w-xl border border-white/30 bg-white/10 text-white shadow-[0_35px_120px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>{t.dashboard.dialogs.editClass.title}</DialogTitle>
          </DialogHeader>
          {isEditFormLoading ? (
            <div className="py-6 text-sm text-white/70">{t.dashboard.common.loading}</div>
          ) : !editingClass ? (
            <Alert className="rounded-xl border-white/30 bg-white/10 text-white">
              <AlertTitle>{t.dashboard.toasts.error}</AlertTitle>
              <AlertDescription>{t.dashboard.classes.empty}</AlertDescription>
            </Alert>
          ) : (
            <form
              onSubmit={editClassForm.handleSubmit(values => editClassMutation.mutate(values))}
              className="space-y-6"
            >
              <fieldset disabled={editClassMutation.isPending} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {t.dashboard.dialogs.editClass.sections.details}
                  </h3>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-class-title">{t.dashboard.dialogs.newClass.fields.title}</Label>
                      <Input id="edit-class-title" {...editClassForm.register("title")} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-class-stage">{t.dashboard.dialogs.newClass.fields.stage}</Label>
                      <Input id="edit-class-stage" {...editClassForm.register("stage")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-class-subject">{t.dashboard.dialogs.newClass.fields.subject}</Label>
                      <Input id="edit-class-subject" {...editClassForm.register("subject")} />
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-class-start">{t.dashboard.dialogs.newClass.fields.startDate}</Label>
                        <Input id="edit-class-start" type="date" {...editClassForm.register("start_date")} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-class-end">{t.dashboard.dialogs.newClass.fields.endDate}</Label>
                        <Input id="edit-class-end" type="date" {...editClassForm.register("end_date")} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {t.dashboard.dialogs.editClass.sections.roster}
                  </h3>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-class-roster">{t.dashboard.dialogs.editClass.roster.label}</Label>
                    <Textarea
                      id="edit-class-roster"
                      rows={6}
                      placeholder={t.dashboard.dialogs.editClass.roster.placeholder}
                      className="rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/40"
                      {...editClassForm.register("studentNames")}
                    />
                    <p className="text-xs text-white/70">{t.dashboard.dialogs.editClass.roster.helper}</p>
                    {rosterErrorMessage ? (
                      <Alert variant="destructive" className="border-white/40 bg-red-500/10 text-white">
                        <AlertTitle>{t.dashboard.toasts.error}</AlertTitle>
                        <AlertDescription className="text-sm">{rosterErrorMessage}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {t.dashboard.dialogs.editClass.sections.curriculum}
                  </h3>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-class-curriculum-title">
                        {t.dashboard.dialogs.editClass.curriculum.title}
                      </Label>
                      <Input id="edit-class-curriculum-title" {...editClassForm.register("curriculumTitle")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-class-curriculum-subject">
                        {t.dashboard.dialogs.editClass.curriculum.subject}
                      </Label>
                      <Input id="edit-class-curriculum-subject" {...editClassForm.register("curriculumSubject")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-class-curriculum-year">
                        {t.dashboard.dialogs.editClass.curriculum.academicYear}
                      </Label>
                      <Input id="edit-class-curriculum-year" {...editClassForm.register("curriculumYear")} />
                    </div>
                    <p className="text-xs text-white/70">{t.dashboard.dialogs.editClass.curriculum.helper}</p>
                    {curriculumErrorMessage ? (
                      <Alert variant="destructive" className="border-white/40 bg-red-500/10 text-white">
                        <AlertTitle>{t.dashboard.toasts.error}</AlertTitle>
                        <AlertDescription className="text-sm">{curriculumErrorMessage}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                </div>
              </fieldset>
              <DialogFooter>
                <Button type="submit" disabled={editClassMutation.isPending}>
                  {t.dashboard.dialogs.editClass.submit}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isClassDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="sm:max-w-lg border border-white/30 bg-white/10 text-white shadow-[0_35px_120px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
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
            <div className="grid gap-2">
              <Label htmlFor="class-roster">{t.dashboard.dialogs.newClass.roster.label}</Label>
              <Textarea
                id="class-roster"
                rows={5}
                placeholder={t.dashboard.dialogs.newClass.roster.placeholder}
                className="rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/40"
                {...classForm.register("studentNames")}
              />
              <p className="text-xs text-white/60">{t.dashboard.dialogs.newClass.roster.helper}</p>
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
    </div>
  );
}
