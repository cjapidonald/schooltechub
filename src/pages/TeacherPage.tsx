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
import { createClass, fetchMyClasses } from "@/features/dashboard/api";
import { DASHBOARD_EXAMPLE_CLASS } from "@/features/dashboard/examples";
import { bulkAddStudents } from "@/features/students/api";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { Class } from "../../types/supabase-tables";
import { BarChart3, ClipboardList, LogIn, Plus, Save, Sparkles, Trash2, Users } from "lucide-react";

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

type CurriculumLessonDraft = {
  id: string;
  title: string;
  focus: string;
  resources: string;
};

type CurriculumDraft = {
  unitTitle: string;
  vision: string;
  essentialQuestions: string;
  knowledgeSkills: string;
  assessments: string;
  pacing: string;
  notes: string;
  lessons: CurriculumLessonDraft[];
};

type CurriculumDraftField = keyof CurriculumDraft;
type CurriculumLessonField = keyof CurriculumLessonDraft;
type CurriculumTextField = Exclude<CurriculumDraftField, "lessons">;

const GLASS_SELECT_CARD_CLASS =
  "w-full rounded-2xl border border-white/15 bg-white/10 p-5 text-left text-white/75 transition hover:border-white/40 hover:bg-white/15 hover:text-white";

const CURRICULUM_INPUT_CLASS =
  "border-white/20 bg-white/90 text-slate-900 placeholder:text-slate-500 focus-visible:ring-white/60 focus-visible:ring-offset-0";

const generateLessonId = () => {
  if (typeof globalThis !== "undefined") {
    const maybeCrypto = globalThis.crypto as { randomUUID?: () => string } | undefined;
    if (maybeCrypto?.randomUUID) {
      return maybeCrypto.randomUUID();
    }
  }
  return `lesson-${Math.random().toString(36).slice(2, 11)}`;
};

const createEmptyCurriculumDraft = (cls: Class): CurriculumDraft => ({
  unitTitle: `${cls.title} overview`,
  vision: "",
  essentialQuestions: "",
  knowledgeSkills: "",
  assessments: "",
  pacing: "",
  notes: "",
  lessons: [],
});

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasEnteredPrototype, setHasEnteredPrototype] = useState(() => Boolean(user));
  const [curriculumDrafts, setCurriculumDrafts] = useState<Record<string, CurriculumDraft>>({});
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

  const classes = useMemo<Array<Class & { isExample?: boolean }>>(() => {
    if (classesQuery.data && classesQuery.data.length > 0) {
      return classesQuery.data;
    }
    return [DASHBOARD_EXAMPLE_CLASS];
  }, [classesQuery.data]);

  const curriculumClasses = useMemo(
    () => classes.filter(cls => !cls.isExample),
    [classes],
  );

  useEffect(() => {
    if (curriculumClasses.length === 0) {
      setCurriculumDrafts(prev => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    setCurriculumDrafts(prev => {
      let changed = false;
      const next: Record<string, CurriculumDraft> = {};

      curriculumClasses.forEach(cls => {
        const existing = prev[cls.id];
        next[cls.id] = existing ?? createEmptyCurriculumDraft(cls);
        if (!existing) {
          changed = true;
        }
      });

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [curriculumClasses]);

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

  const selectedCurriculumDraft = useMemo(() => {
    if (!selectedCurriculumClass) {
      return null;
    }

    return curriculumDrafts[selectedCurriculumClass.id] ?? null;
  }, [curriculumDrafts, selectedCurriculumClass]);

  const updateCurriculumDraft = useCallback((classId: string, updater: (draft: CurriculumDraft) => CurriculumDraft) => {
    setCurriculumDrafts(prev => {
      const current = prev[classId];
      if (!current) {
        return prev;
      }

      const updated = updater(current);
      if (updated === current) {
        return prev;
      }

      return { ...prev, [classId]: updated };
    });
  }, []);

  const handleCurriculumFieldChange = useCallback(
    (field: CurriculumTextField, value: string) => {
      if (!selectedCurriculumClass) {
        return;
      }

      updateCurriculumDraft(selectedCurriculumClass.id, draft => ({ ...draft, [field]: value }));
    },
    [selectedCurriculumClass, updateCurriculumDraft],
  );

  const handleLessonFieldChange = useCallback(
    (lessonId: string, field: CurriculumLessonField, value: string) => {
      if (!selectedCurriculumClass) {
        return;
      }

      updateCurriculumDraft(selectedCurriculumClass.id, draft => ({
        ...draft,
        lessons: draft.lessons.map(lesson => (lesson.id === lessonId ? { ...lesson, [field]: value } : lesson)),
      }));
    },
    [selectedCurriculumClass, updateCurriculumDraft],
  );

  const handleAddLesson = useCallback(() => {
    if (!selectedCurriculumClass) {
      return;
    }

    const newLesson: CurriculumLessonDraft = {
      id: generateLessonId(),
      title: "Untitled lesson",
      focus: "",
      resources: "",
    };

    updateCurriculumDraft(selectedCurriculumClass.id, draft => ({
      ...draft,
      lessons: [...draft.lessons, newLesson],
    }));
  }, [selectedCurriculumClass, updateCurriculumDraft]);

  const handleRemoveLesson = useCallback(
    (lessonId: string) => {
      if (!selectedCurriculumClass) {
        return;
      }

      updateCurriculumDraft(selectedCurriculumClass.id, draft => ({
        ...draft,
        lessons: draft.lessons.filter(lesson => lesson.id !== lessonId),
      }));
    },
    [selectedCurriculumClass, updateCurriculumDraft],
  );

  const handleCurriculumSave = useCallback(() => {
    if (!selectedCurriculumClass) {
      return;
    }

    toast({
      title: "Curriculum saved",
      description: `Updates for ${selectedCurriculumClass.title} are stored locally in this preview experience.`,
    });
  }, [selectedCurriculumClass, toast]);

  const curriculumFieldId = useCallback(
    (name: string) => (selectedCurriculumClass ? `${selectedCurriculumClass.id}-${name}` : `curriculum-${name}`),
    [selectedCurriculumClass],
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
                  {selectedCurriculumClass && selectedCurriculumDraft ? (
                    <div className={cn(GLASS_PANEL_CLASS, "space-y-6")}> 
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-semibold text-white">{selectedCurriculumClass.title}</h3>
                            <p className="text-sm text-white/70">
                              Sequence lessons, capture essential questions, and monitor pacing in one workspace.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-white/50 bg-white/10 text-white hover:border-white/70 hover:bg-white/20"
                            onClick={handleCurriculumSave}
                          >
                            <Save className="h-4 w-4" />
                            Save outline
                          </Button>
                        </div>
                        {selectedCurriculumClass.stage || selectedCurriculumClass.subject ? (
                          <p className="text-xs uppercase tracking-wide text-white/50">
                            {[selectedCurriculumClass.stage, selectedCurriculumClass.subject].filter(Boolean).join(" • ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <Label
                            htmlFor={curriculumFieldId("unitTitle")}
                            className="text-xs font-semibold uppercase tracking-wide text-white/60"
                          >
                            Unit or theme
                          </Label>
                          <Input
                            id={curriculumFieldId("unitTitle")}
                            value={selectedCurriculumDraft.unitTitle}
                            onChange={event => handleCurriculumFieldChange("unitTitle", event.target.value)}
                            className={cn(CURRICULUM_INPUT_CLASS, "h-12 rounded-xl")}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor={curriculumFieldId("pacing")}
                            className="text-xs font-semibold uppercase tracking-wide text-white/60"
                          >
                            Weekly pacing
                          </Label>
                          <Textarea
                            id={curriculumFieldId("pacing")}
                            value={selectedCurriculumDraft.pacing}
                            onChange={event => handleCurriculumFieldChange("pacing", event.target.value)}
                            className={cn(CURRICULUM_INPUT_CLASS, "min-h-[120px] rounded-xl bg-white/85")}
                          />
                        </div>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <Label
                            htmlFor={curriculumFieldId("vision")}
                            className="text-xs font-semibold uppercase tracking-wide text-white/60"
                          >
                            Unit vision
                          </Label>
                          <Textarea
                            id={curriculumFieldId("vision")}
                            value={selectedCurriculumDraft.vision}
                            onChange={event => handleCurriculumFieldChange("vision", event.target.value)}
                            className={cn(CURRICULUM_INPUT_CLASS, "min-h-[140px] rounded-xl bg-white/85")}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor={curriculumFieldId("essentialQuestions")}
                            className="text-xs font-semibold uppercase tracking-wide text-white/60"
                          >
                            Essential questions
                          </Label>
                          <Textarea
                            id={curriculumFieldId("essentialQuestions")}
                            value={selectedCurriculumDraft.essentialQuestions}
                            onChange={event => handleCurriculumFieldChange("essentialQuestions", event.target.value)}
                            className={cn(CURRICULUM_INPUT_CLASS, "min-h-[140px] rounded-xl bg-white/85")}
                          />
                        </div>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <Label
                            htmlFor={curriculumFieldId("knowledgeSkills")}
                            className="text-xs font-semibold uppercase tracking-wide text-white/60"
                          >
                            Knowledge &amp; skills
                          </Label>
                          <Textarea
                            id={curriculumFieldId("knowledgeSkills")}
                            value={selectedCurriculumDraft.knowledgeSkills}
                            onChange={event => handleCurriculumFieldChange("knowledgeSkills", event.target.value)}
                            className={cn(CURRICULUM_INPUT_CLASS, "min-h-[140px] rounded-xl bg-white/85")}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor={curriculumFieldId("assessments")}
                            className="text-xs font-semibold uppercase tracking-wide text-white/60"
                          >
                            Assessments &amp; evidence
                          </Label>
                          <Textarea
                            id={curriculumFieldId("assessments")}
                            value={selectedCurriculumDraft.assessments}
                            onChange={event => handleCurriculumFieldChange("assessments", event.target.value)}
                            className={cn(CURRICULUM_INPUT_CLASS, "min-h-[140px] rounded-xl bg-white/85")}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor={curriculumFieldId("notes")}
                          className="text-xs font-semibold uppercase tracking-wide text-white/60"
                        >
                          Next steps &amp; notes
                        </Label>
                        <Textarea
                          id={curriculumFieldId("notes")}
                          value={selectedCurriculumDraft.notes}
                          onChange={event => handleCurriculumFieldChange("notes", event.target.value)}
                          className={cn(CURRICULUM_INPUT_CLASS, "min-h-[120px] rounded-xl bg-white/85")}
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-lg font-semibold text-white">Lesson sequence</h4>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddLesson}
                            className="border-white/40 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
                          >
                            <Plus className="h-4 w-4" />
                            Add lesson
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {selectedCurriculumDraft.lessons.length > 0 ? (
                            selectedCurriculumDraft.lessons.map((lesson, index) => (
                              <div
                                key={lesson.id}
                                className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.75)]"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="flex-1 space-y-2">
                                    <p className="text-xs uppercase tracking-wide text-white/60">Lesson {index + 1}</p>
                                    <Input
                                      value={lesson.title}
                                      onChange={event => handleLessonFieldChange(lesson.id, "title", event.target.value)}
                                      className={cn(CURRICULUM_INPUT_CLASS, "h-11 rounded-xl")}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-white/70 hover:bg-white/10 hover:text-white"
                                    onClick={() => handleRemoveLesson(lesson.id)}
                                    aria-label={`Remove lesson ${index + 1}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="mt-4 space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-white/60">
                                      Learning focus
                                    </Label>
                                    <Textarea
                                      value={lesson.focus}
                                      onChange={event => handleLessonFieldChange(lesson.id, "focus", event.target.value)}
                                      className={cn(CURRICULUM_INPUT_CLASS, "min-h-[120px] rounded-xl bg-white/85")}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-white/60">
                                      Key resources
                                    </Label>
                                    <Input
                                      value={lesson.resources}
                                      onChange={event => handleLessonFieldChange(lesson.id, "resources", event.target.value)}
                                      className={cn(CURRICULUM_INPUT_CLASS, "h-11 rounded-xl")}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <Alert className="rounded-2xl border border-white/20 bg-white/10 text-white">
                              <AlertTitle className="text-base font-semibold text-white">No lessons added yet</AlertTitle>
                              <AlertDescription className="text-sm text-white/70">
                                Start mapping your lesson sequence by selecting “Add lesson”.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
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
                onEditClass={classId =>
                  navigate(`/teacher?tab=classes&classId=${encodeURIComponent(classId)}`)
                }
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
