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
import { CurriculumTable, type CurriculumLessonRow } from "@/components/dashboard/CurriculumTable";
import { StudentsSection } from "@/components/dashboard/StudentsSection";
import { AssessmentsSection } from "@/components/dashboard/AssessmentsSection";
import LessonBuilderPage from "@/pages/lesson-builder/LessonBuilderPage";
import type { Subject } from "@/lib/constants/subjects";
import { createClass, fetchMyClasses } from "@/features/dashboard/api";
import { DASHBOARD_EXAMPLE_CLASS } from "@/features/dashboard/examples";
import { bulkAddStudents } from "@/features/students/api";
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

const EXAMPLE_CLASS_STUDENTS = [
  "Aaliyah Chen",
  "Mateo Alvarez",
  "Priya Desai",
  "Noah Williams",
  "Sofia Rossi",
];

type ClassCurriculumLesson = {
  id: string;
  title: string;
  sequence: number;
  subject: string | null;
  stage: string | null;
  presentationUrl: string | null;
  lastUpdatedAt: string | null;
};


const EXAMPLE_CLASS_CURRICULUM: ClassCurriculumLesson[] = [
  {
    id: "example-lesson-1",
    title: "Igniting narrative hooks with sensory details",
    sequence: 1,
    subject: DASHBOARD_EXAMPLE_CLASS.subject ?? null,
    stage: DASHBOARD_EXAMPLE_CLASS.stage ?? null,
    presentationUrl: "https://example.com/presentations/narrative-hooks",
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: "example-lesson-2",
    title: "Designing character mood boards in Canva",
    sequence: 2,
    subject: DASHBOARD_EXAMPLE_CLASS.subject ?? null,
    stage: DASHBOARD_EXAMPLE_CLASS.stage ?? null,
    presentationUrl: "https://example.com/presentations/canva-moodboards",
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: "example-lesson-3",
    title: "Collaborative story outlining in Google Docs",
    sequence: 3,
    subject: DASHBOARD_EXAMPLE_CLASS.subject ?? null,
    stage: DASHBOARD_EXAMPLE_CLASS.stage ?? null,
    presentationUrl: null,
    lastUpdatedAt: null,
  },
  {
    id: "example-lesson-4",
    title: "Peer-feedback protocols for revision day",
    sequence: 4,
    subject: DASHBOARD_EXAMPLE_CLASS.subject ?? null,
    stage: DASHBOARD_EXAMPLE_CLASS.stage ?? null,
    presentationUrl: null,
    lastUpdatedAt: null,
  },
];

type ClassEnrichment = {
  students: string[];
  curriculum: ClassCurriculumLesson[];
};

const classSchema = z.object({
  title: z.string().min(2),
  stage: z.string().optional(),
  subject: z.string().optional(),
  studentNames: z.string().optional(),
  curriculumTitles: z.string().optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;

type LessonBuilderRouteContext = {
  title: string;
  classId: string | null;
  classTitle: string | null;
  stage: string | null;
  subject: string | null;
  date: string | null;
  sequence: number | null;
  lessonId: string | null;
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

const DASHBOARD_TABS = ["classes", "curriculum", "lessonBuilder", "students", "assessments"] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];

const isDashboardTab = (value: string | null): value is DashboardTab =>
  Boolean(value && (DASHBOARD_TABS as readonly string[]).includes(value));

const GLASS_PANEL_CLASS =
  "rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-[0_40px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl md:p-8";

const GLASS_TAB_TRIGGER_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition backdrop-blur-xl hover:border-white/40 hover:bg-white/15 hover:text-white data-[state=active]:border-white/60 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:shadow-[0_15px_45px_-25px_rgba(15,23,42,0.85)]";

const splitMultilineValues = (input: string | undefined) =>
  (input ?? "")
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean);

const splitStudentNames = splitMultilineValues;
const splitCurriculumTitles = splitMultilineValues;

const generateLessonId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `lesson-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

const createCurriculumLesson = (
  title: string,
  index: number,
  classInfo?: { subject?: string | null; stage?: string | null },
): ClassCurriculumLesson => ({
  id: generateLessonId(),
  title,
  sequence: index + 1,
  subject: classInfo?.subject ?? null,
  stage: classInfo?.stage ?? null,
  presentationUrl: null,
  lastUpdatedAt: new Date().toISOString(),
});

const areLessonBuilderContextsEqual = (
  a: LessonBuilderRouteContext | null,
  b: LessonBuilderRouteContext | null,
) => {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return (
    a.title === b.title &&
    a.classId === b.classId &&
    a.classTitle === b.classTitle &&
    a.stage === b.stage &&
    a.subject === b.subject &&
    a.date === b.date &&
    a.sequence === b.sequence &&
    a.lessonId === b.lessonId
  );
};

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
  const [classEnrichments, setClassEnrichments] = useState<Record<string, ClassEnrichment>>(() => ({
    [DASHBOARD_EXAMPLE_CLASS.id]: {
      students: EXAMPLE_CLASS_STUDENTS,
      curriculum: EXAMPLE_CLASS_CURRICULUM,
    },
  }));
  const [assessmentSuggestion, setAssessmentSuggestion] = useState<{
    classId: string;
    classTitle: string;
    lessonTitle: string;
  } | null>(null);
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
          "lessonSubject",
          "lessonDate",
          "lessonSeq",
          "lessonId",
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
        if (context.subject) {
          params.set("lessonSubject", context.subject);
        }
        if (context.date) {
          params.set("lessonDate", context.date);
        }
        if (context.sequence !== null && context.sequence !== undefined) {
          params.set("lessonSeq", String(context.sequence));
        }
        if (context.lessonId) {
          params.set("lessonId", context.lessonId);
        }
      });
    },
    [updateSearchParams],
  );

  const requestedTab = searchParams.get("tab");
  const activeTab: DashboardTab = isDashboardTab(requestedTab) ? requestedTab : "classes";

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
      subject: getParam("lessonSubject"),
      date: getParam("lessonDate"),
      sequence: Number.isFinite(sequenceNumber) ? sequenceNumber : null,
      lessonId: getParam("lessonId"),
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
            key: "subject",
            label: t.dashboard.classes.columns.subject,
            value: lessonBuilderContext.subject,
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

  const handleEmbeddedLessonContextChange = useCallback(
    (context: {
      classId: string | null;
      classTitle: string | null;
      lessonId: string | null;
      lessonTitle: string;
      subject: string | null;
      stage: string | null;
      date: string | null;
      sequence: number | null;
    }) => {
      const trimmedTitle = context.lessonTitle.trim();
      const nextContext: LessonBuilderRouteContext = {
        title: trimmedTitle.length > 0 ? trimmedTitle : lessonBuilderContext?.title ?? context.lessonTitle,
        classId: context.classId,
        classTitle: context.classTitle,
        stage: context.stage,
        subject: context.subject,
        date: context.date,
        sequence: context.sequence,
        lessonId: context.lessonId,
      };

      if (areLessonBuilderContextsEqual(lessonBuilderContext, nextContext)) {
        return;
      }

      setLessonBuilderContext(nextContext);
    },
    [lessonBuilderContext, setLessonBuilderContext],
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
    defaultValues: { title: "", stage: "", subject: "", studentNames: "", curriculumTitles: "" },
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
      });

      const rosterNames = splitStudentNames(values.studentNames);
      const curriculumLessons = splitCurriculumTitles(values.curriculumTitles);

      if (rosterNames.length > 0) {
        await bulkAddStudents({ ownerId: user?.id, classId: createdClass.id, names: rosterNames });
      }

      return {
        createdClass,
        rosterCount: rosterNames.length,
        curriculumCount: curriculumLessons.length,
        students: rosterNames,
        curriculum: curriculumLessons.map((title, index) =>
          createCurriculumLesson(title, index, {
            subject: values.subject ?? null,
            stage: values.stage ?? null,
          }),
        ),
      };
    },
    onSuccess: ({ rosterCount, curriculumCount, createdClass, students, curriculum }, variables) => {
      setClassDialogOpen(false);
      classForm.reset();
      setClassEnrichments(prev => ({
        ...prev,
        [createdClass.id]: {
          students,
          curriculum,
        },
      }));
      void classesQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["dashboard-students"] });

      let toastDescription =
        rosterCount > 0
          ? t.dashboard.toasts.classCreatedWithStudents
              .replace("{title}", variables.title)
              .replace("{count}", rosterCount.toLocaleString())
          : t.dashboard.toasts.classCreatedNoStudents.replace("{title}", variables.title);

      if (curriculumCount > 0) {
        const lessonLabel = curriculumCount === 1 ? "lesson" : "lessons";
        toastDescription = `${toastDescription} ${curriculumCount.toLocaleString()} ${lessonLabel} added to the curriculum tab.`;
      }

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

  useEffect(() => {
    if (!classesQuery.data) {
      return;
    }

    setClassEnrichments(prev => {
      const next = { ...prev };
      let hasUpdates = false;

      classesQuery.data?.forEach(item => {
        if (!next[item.id]) {
          next[item.id] = { students: [], curriculum: [] };
          hasUpdates = true;
        }
      });

      return hasUpdates ? next : prev;
    });
  }, [classesQuery.data]);

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

  const curriculumRows = useMemo<CurriculumLessonRow[]>(
    () =>
      classes.flatMap(classItem => {
        const enrichment = classEnrichments[classItem.id];
        if (!enrichment) {
          return [];
        }

        return enrichment.curriculum.map<CurriculumLessonRow>(lesson => ({
          classId: classItem.id,
          lessonId: lesson.id,
          classTitle: classItem.title,
          classStage: lesson.stage ?? classItem.stage ?? null,
          classSubject: lesson.subject ?? classItem.subject ?? null,
          title: lesson.title,
          sequence: lesson.sequence,
          presentationUrl: lesson.presentationUrl ?? null,
          lastUpdatedAt: lesson.lastUpdatedAt ?? null,
        }));
      }),
    [classes, classEnrichments],
  );

  const handleUpdatePresentationLink = useCallback(
    (classId: string, lessonId: string, url: string | null) => {
      setClassEnrichments(prev => {
        const existing = prev[classId];
        if (!existing) {
          return prev;
        }

        let hasChanges = false;
        const updatedLessons = existing.curriculum.map(lesson => {
          if (lesson.id !== lessonId) {
            return lesson;
          }

          if (lesson.presentationUrl === url) {
            return lesson;
          }

          hasChanges = true;
          return {
            ...lesson,
            presentationUrl: url,
            lastUpdatedAt: new Date().toISOString(),
          };
        });

        if (!hasChanges) {
          return prev;
        }

        return {
          ...prev,
          [classId]: {
            ...existing,
            curriculum: updatedLessons,
          },
        };
      });
    },
    [],
  );

  const handleLaunchLessonBuilder = useCallback(
    (row: CurriculumLessonRow) => {
      setClassEnrichments(prev => {
        const existing = prev[row.classId];
        if (!existing) {
          return prev;
        }

        return {
          ...prev,
          [row.classId]: {
            ...existing,
            curriculum: existing.curriculum.map(lesson =>
              lesson.id === row.lessonId
                ? { ...lesson, lastUpdatedAt: new Date().toISOString() }
                : lesson,
            ),
          },
        };
      });

      setLessonBuilderContext({
        title: row.title,
        classId: row.classId,
        classTitle: row.classTitle,
        stage: row.classStage,
        subject: row.classSubject,
        date: null,
        sequence: row.sequence,
        lessonId: row.lessonId,
      });
    },
    [setLessonBuilderContext],
  );

  const handleAddAssessmentFromCurriculum = useCallback(
    (row: CurriculumLessonRow) => {
      setClassEnrichments(prev => {
        const existing = prev[row.classId];
        if (!existing) {
          return prev;
        }

        return {
          ...prev,
          [row.classId]: {
            ...existing,
            curriculum: existing.curriculum.map(lesson =>
              lesson.id === row.lessonId
                ? { ...lesson, lastUpdatedAt: new Date().toISOString() }
                : lesson,
            ),
          },
        };
      });
      setAssessmentSuggestion({
        classId: row.classId,
        classTitle: row.classTitle,
        lessonTitle: row.title,
      });
      updateSearchParams(params => {
        params.set("tab", "assessments");
      });
    },
    [updateSearchParams],
  );

  const handleAssessmentSuggestionHandled = useCallback(() => {
    setAssessmentSuggestion(null);
  }, []);

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
              <TabsTrigger value="classes" className={GLASS_TAB_TRIGGER_CLASS}>
                {t.dashboard.tabs.classes}
              </TabsTrigger>
              <TabsTrigger value="curriculum" className={GLASS_TAB_TRIGGER_CLASS}>
                {t.dashboard.tabs.curriculum}
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
                enrichments={classEnrichments}
              />
            </TabsContent>
            <TabsContent value="curriculum" className="space-y-6">
              <section className={cn(GLASS_PANEL_CLASS, "space-y-6")}>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
                    {t.dashboard.tabs.curriculum}
                  </h2>
                  <p className="text-sm text-white/70">
                    Build curriculum outlines that stay in sync with each class roster.
                  </p>
                </div>
                <CurriculumTable
                  lessons={curriculumRows}
                  onLaunchLessonBuilder={handleLaunchLessonBuilder}
                  onUpdatePresentationLink={(lesson, url) =>
                    handleUpdatePresentationLink(lesson.classId, lesson.lessonId, url)
                  }
                  onAddAssessment={handleAddAssessmentFromCurriculum}
                  onCreateClass={() => setClassDialogOpen(true)}
                />
              </section>
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
                    <LessonBuilderPage
                      initialMeta={{
                        title: lessonBuilderContext.title,
                        subject: (lessonBuilderContext.subject as Subject | null | undefined) ?? undefined,
                        date: lessonBuilderContext.date ?? undefined,
                        classId: lessonBuilderContext.classId ?? undefined,
                        lessonId: lessonBuilderContext.lessonId ?? undefined,
                        sequence: lessonBuilderContext.sequence ?? undefined,
                        stage: lessonBuilderContext.stage ?? undefined,
                      }}
                      initialClassId={lessonBuilderContext.classId}
                      onLessonContextChange={handleEmbeddedLessonContextChange}
                    />
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
                      subject: null,
                      date: null,
                      sequence: null,
                      lessonId: null,
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
              <AssessmentsSection
                className={cn(GLASS_PANEL_CLASS, "space-y-6")}
                initialClassId={assessmentSuggestion?.classId ?? null}
                initialAssessmentSuggestion={
                  assessmentSuggestion
                    ? {
                        title: `${assessmentSuggestion.lessonTitle} assessment`,
                        description: `Plan how students will demonstrate learning from ${assessmentSuggestion.lessonTitle}.`,
                      }
                    : null
                }
                onSuggestionHandled={handleAssessmentSuggestionHandled}
              />
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
            <div className="grid gap-2">
              <Label htmlFor="class-curriculum">{t.dashboard.dialogs.newClass.curriculum.label}</Label>
              <Textarea
                id="class-curriculum"
                rows={5}
                placeholder={t.dashboard.dialogs.newClass.curriculum.placeholder}
                className="rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/40"
                {...classForm.register("curriculumTitles")}
              />
              <p className="text-xs text-white/60">{t.dashboard.dialogs.newClass.curriculum.helper}</p>
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
