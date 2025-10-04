import { useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentType } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  FileDown,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Loader2,
  NotebookPen,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import { ClassCreateDialog } from "@/components/classes/ClassCreateDialog";
import { listMyClassesWithPlanCount, type ClassWithPlanCount } from "@/lib/classes";
import {
  getStudentProfile,
  listMyStudents,
  recordStudentReportRequest,
  saveStudentAppraisalNote,
  saveStudentBehaviorNote,
} from "@/lib/data/students";
import { listCurriculumItems } from "@/lib/data/curriculum";
import {
  createAssessment,
  listAssessmentGrades,
  listAssessmentSubmissions,
  listAssessments,
  recordAssessmentGrade,
} from "@/lib/data/assessments";
import LessonBuilderPage from "@/pages/lesson-builder/LessonBuilderPage";
import type {
  AssessmentGrade,
  AssessmentSubmission,
  AssessmentTemplate,
  CurriculumItem,
  GradeScale,
  StudentBehaviorEntry,
  StudentProfile,
  StudentSummary,
} from "@/types/platform";
import type { LessonPlanMetaDraft } from "@/pages/lesson-builder/types";

const tabs = [
  { value: "classes", label: "My Classes" },
  { value: "students", label: "My Students" },
  { value: "curriculum", label: "Curriculum" },
  { value: "lessonBuilder", label: "Lesson Builder" },
  { value: "assessments", label: "Assessment Tracking" },
] as const;

type DashboardTab = (typeof tabs)[number]["value"];

type LessonBuilderPreset = {
  meta: Partial<LessonPlanMetaDraft>;
  classId: string | null;
  curriculumItem?: CurriculumItem | null;
} | null;

const sentimentOptions: Array<{ value: StudentBehaviorEntry["sentiment"]; label: string }> = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "needs_support", label: "Needs support" },
];

const gradeScales: Array<{ value: GradeScale; label: string }> = [
  { value: "letter", label: "Letter" },
  { value: "percentage", label: "Percentage" },
  { value: "points", label: "Points" },
  { value: "rubric", label: "Rubric" },
];

const presetGrades: Record<GradeScale, string[]> = {
  letter: ["A", "B", "C", "D"],
  percentage: ["100", "95", "90", "85"],
  points: ["10", "9", "8", "7"],
  rubric: ["Exceeds", "Meets", "Developing", "Beginning"],
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "PPP");
};

const AccountDashboard = () => {
  const { user, loading } = useRequireAuth();
  const { language } = useLanguage();
  const { fullName } = useMyProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const initial = searchParams.get("tab");
    return tabs.some(tab => tab.value === initial) ? (initial as DashboardTab) : "classes";
  });
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [lessonPreset, setLessonPreset] = useState<LessonBuilderPreset>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [behaviorNote, setBehaviorNote] = useState("");
  const [behaviorSentiment, setBehaviorSentiment] = useState<StudentBehaviorEntry["sentiment"]>("positive");
  const [appraisalNote, setAppraisalNote] = useState("");
  const [curriculumFilters, setCurriculumFilters] = useState({
    classId: "all" as string | "all",
    stage: "all" as string | "all",
    subject: "all" as string | "all",
    week: "all" as string | "all",
    date: "",
  });
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [gradingContext, setGradingContext] = useState({
    assessment: null as AssessmentTemplate | null,
    studentId: "",
    scale: "letter" as GradeScale,
    grade: "",
    numeric: "",
    feedback: "",
  });
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const classesQuery = useQuery({
    queryKey: ["dashboard-classes"],
    queryFn: () => listMyClassesWithPlanCount(),
    enabled: Boolean(user),
  });

  const studentsQuery = useQuery({
    queryKey: ["dashboard-students"],
    queryFn: () => listMyStudents(),
    enabled: Boolean(user),
  });

  const curriculumQuery = useQuery({
    queryKey: ["dashboard-curriculum"],
    queryFn: () => listCurriculumItems(),
    enabled: Boolean(user),
  });

  const assessmentsQuery = useQuery({
    queryKey: ["dashboard-assessments"],
    queryFn: () => listAssessments(),
    enabled: Boolean(user),
  });

  const studentProfileQuery = useQuery<StudentProfile | null>({
    queryKey: ["dashboard-student", selectedStudentId],
    queryFn: () => (selectedStudentId ? getStudentProfile(selectedStudentId) : Promise.resolve(null)),
    enabled: Boolean(selectedStudentId) && studentDialogOpen,
  });

  const assessmentGradesQuery = useQuery<AssessmentGrade[]>({
    queryKey: ["dashboard-assessment-grades", gradingContext.assessment?.id],
    queryFn: () =>
      gradingContext.assessment?.id
        ? listAssessmentGrades(gradingContext.assessment.id)
        : Promise.resolve([]),
    enabled: gradingDialogOpen && Boolean(gradingContext.assessment?.id),
  });

  const assessmentSubmissionsQuery = useQuery<AssessmentSubmission[]>({
    queryKey: ["dashboard-assessment-submissions", gradingContext.assessment?.id],
    queryFn: () =>
      gradingContext.assessment?.id
        ? listAssessmentSubmissions(gradingContext.assessment.id)
        : Promise.resolve([]),
    enabled: gradingDialogOpen && Boolean(gradingContext.assessment?.id),
  });

  const behaviorMutation = useMutation({
    mutationFn: (payload: { studentId: string; note: string; sentiment: StudentBehaviorEntry["sentiment"] }) =>
      saveStudentBehaviorNote({ studentId: payload.studentId, note: payload.note, sentiment: payload.sentiment }),
    onSuccess: () => {
      toast({ title: "Behavior note saved" });
      void studentProfileQuery.refetch();
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to save note",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const appraisalMutation = useMutation({
    mutationFn: (payload: { studentId: string; highlight: string }) =>
      saveStudentAppraisalNote({ studentId: payload.studentId, highlight: payload.highlight }),
    onSuccess: () => {
      toast({ title: "Appraisal saved" });
      void studentProfileQuery.refetch();
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to save appraisal",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (studentId: string) => {
      if (!user) throw new Error("Sign in required");
      return recordStudentReportRequest({ studentId, requestedBy: user.id });
    },
    onSuccess: () => {
      toast({ title: "AI report requested", description: "We'll email you when it's ready." });
      void studentProfileQuery.refetch();
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to request report",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: (payload: {
      classId: string;
      title: string;
      description: string;
      dueDate: string;
      scale: GradeScale;
    }) =>
      createAssessment({
        classId: payload.classId,
        title: payload.title,
        description: payload.description,
        dueDate: payload.dueDate || null,
        gradingScale: payload.scale,
      }),
    onSuccess: () => {
      toast({ title: "Assessment created" });
      queryClient.invalidateQueries({ queryKey: ["dashboard-assessments"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to create assessment",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const recordGradeMutation = useMutation({
    mutationFn: () =>
      recordAssessmentGrade({
        assessmentId: gradingContext.assessment?.id ?? "",
        studentId: gradingContext.studentId,
        gradeValue: gradingContext.grade || null,
        gradeNumeric: gradingContext.numeric ? Number(gradingContext.numeric) : null,
        scale: gradingContext.scale,
        feedback: gradingContext.feedback || null,
      }),
    onSuccess: () => {
      toast({ title: "Grade recorded" });
      queryClient.invalidateQueries({ queryKey: ["dashboard-assessment-grades", gradingContext.assessment?.id] });
      if (gradingContext.studentId) {
        queryClient.invalidateQueries({ queryKey: ["dashboard-student", gradingContext.studentId] });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to save grade",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const curriculumItems = useMemo(() => curriculumQuery.data ?? [], [curriculumQuery.data]);
  const assessments = useMemo(() => assessmentsQuery.data ?? [], [assessmentsQuery.data]);

  const summary = useMemo(() => {
    const upcomingLessons = curriculumItems.filter(item => item.date && parseISO(item.date) > new Date());
    return {
      classes: classes.length,
      students: students.length,
      lessons: upcomingLessons.length,
      assessments: assessments.length,
    };
  }, [assessments.length, classes.length, curriculumItems, students.length]);

  const curriculumOptions = useMemo(() => {
    const stages = new Set<string>();
    const subjects = new Set<string>();
    const weeks = new Set<number>();
    curriculumItems.forEach(item => {
      if (item.stage) stages.add(item.stage);
      if (item.subject) subjects.add(item.subject);
      if (typeof item.week === "number") weeks.add(item.week);
    });
    return {
      stages: Array.from(stages),
      subjects: Array.from(subjects),
      weeks: Array.from(weeks).sort((a, b) => a - b),
    };
  }, [curriculumItems]);

  const filteredCurriculum = useMemo(() => {
    return curriculumItems.filter(item => {
      const matchesClass = curriculumFilters.classId === "all" || item.classId === curriculumFilters.classId;
      const matchesStage = curriculumFilters.stage === "all" || item.stage === curriculumFilters.stage;
      const matchesSubject = curriculumFilters.subject === "all" || item.subject === curriculumFilters.subject;
      const matchesWeek =
        curriculumFilters.week === "all" || String(item.week ?? "") === curriculumFilters.week;
      const matchesDate = !curriculumFilters.date || (item.date && item.date.startsWith(curriculumFilters.date));
      return matchesClass && matchesStage && matchesSubject && matchesWeek && matchesDate;
    });
  }, [curriculumFilters, curriculumItems]);

  const handleTabChange = (value: string) => {
    if (!tabs.some(tab => tab.value === value)) return;
    setActiveTab(value as DashboardTab);
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    setSearchParams(params, { replace: true });
  };

  const handleOpenLessonBuilder = (item?: CurriculumItem | null, classId?: string | null) => {
    const meta: Partial<LessonPlanMetaDraft> = {
      title: item?.title ?? "",
      date: item?.date ?? null,
      subject: (item?.subject as LessonPlanMetaDraft["subject"]) ?? null,
    };
    setLessonPreset({ meta, classId: classId ?? item?.classId ?? null, curriculumItem: item ?? null });
    setActiveTab("lessonBuilder");
    const params = new URLSearchParams(searchParams);
    params.set("tab", "lessonBuilder");
    setSearchParams(params, { replace: true });
  };

  const handleDownloadCurriculum = () => {
    const rows = filteredCurriculum.map(item => [
      item.title,
      item.topic ?? "",
      item.subject ?? "",
      item.stage ?? "",
      item.week ?? "",
      item.date ?? "",
    ]);
    const csv = [["Title", "Topic", "Subject", "Stage", "Week", "Date"], ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "curriculum.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadCurriculum = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    console.info("Uploaded curriculum CSV", text.slice(0, 200));
    toast({ title: "Curriculum upload received", description: "We'll map it to your planner." });
    event.target.value = "";
  };

  const handleSelectStudent = (student: StudentSummary) => {
    setSelectedStudentId(student.id);
    setStudentDialogOpen(true);
    setBehaviorNote("");
    setBehaviorSentiment("positive");
    setAppraisalNote("");
  };

  if (loading) {
    return (
      <div className="container space-y-6 py-10">
        <div className="h-10 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: `/account?tab=${activeTab}`, language }} />;
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO
        title="Teacher Workspace Dashboard"
        description="Manage classes, students, curriculum, lessons, and assessments from a single workspace."
        canonicalUrl="https://schooltechhub.com/account"
      />
      <div className="container space-y-8 py-10">
        <Card className="border border-primary/30 bg-background/80 shadow-[0_0_35px_hsl(var(--glow-primary)/0.15)]">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">
                Welcome back{fullName ? `, {fullName.split(" ")[0]}` : ""}
              </CardTitle>
              <CardDescription>Everything you need to run your classroom in one place.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <Link to="/blog/new">Post a blog</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/forum/new">Ask a question</Link>
              </Button>
              <Button onClick={() => handleOpenLessonBuilder(null, null)}>
                <NotebookPen className="mr-2 h-4 w-4" /> Plan a lesson
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard icon={GraduationCap} label="Active classes" value={summary.classes} />
              <SummaryCard icon={Users} label="Enrolled students" value={summary.students} />
              <SummaryCard icon={CalendarClock} label="Upcoming lessons" value={summary.lessons} />
              <SummaryCard icon={ClipboardCheck} label="Assessments" value={summary.assessments} />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-2 bg-transparent p-0">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1 whitespace-nowrap">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="classes" className="space-y-6">
            <ClassesPanel
              classes={classes}
              isLoading={classesQuery.isLoading}
              error={classesQuery.error instanceof Error ? classesQuery.error : null}
              onCreate={() => setIsCreateClassOpen(true)}
              onPlanLesson={handleOpenLessonBuilder}
            />
            <ClassCreateDialog
              open={isCreateClassOpen}
              onOpenChange={setIsCreateClassOpen}
              onCreated={() => queryClient.invalidateQueries({ queryKey: ["dashboard-classes"] })}
            />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <StudentsPanel
              students={students}
              isLoading={studentsQuery.isLoading}
              error={studentsQuery.error instanceof Error ? studentsQuery.error : null}
              onSelectStudent={handleSelectStudent}
            />
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-6">
            <CurriculumPanel
              classes={classes}
              items={filteredCurriculum}
              filters={curriculumFilters}
              options={curriculumOptions}
              onChangeFilters={setCurriculumFilters}
              onDownloadCsv={handleDownloadCurriculum}
              onUploadCsv={() => uploadRef.current?.click()}
              onBuildLesson={handleOpenLessonBuilder}
            />
            <input
              ref={uploadRef}
              type="file"
              accept=".csv"
              onChange={handleUploadCurriculum}
              className="hidden"
            />
          </TabsContent>

          <TabsContent value="lessonBuilder" className="space-y-6">
            {lessonPreset?.curriculumItem ? (
              <Card>
                <CardHeader>
                  <CardTitle>Lesson context</CardTitle>
                  <CardDescription>Prefilled from {lessonPreset.curriculumItem.title}.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {lessonPreset.curriculumItem.subject ? (
                    <Badge variant="outline">{lessonPreset.curriculumItem.subject}</Badge>
                  ) : null}
                  {lessonPreset.curriculumItem.stage ? (
                    <Badge variant="outline">Stage {lessonPreset.curriculumItem.stage}</Badge>
                  ) : null}
                  {lessonPreset.curriculumItem.week ? (
                    <Badge variant="outline">Week {lessonPreset.curriculumItem.week}</Badge>
                  ) : null}
                  {lessonPreset.curriculumItem.date ? (
                    <Badge variant="outline">{formatDate(lessonPreset.curriculumItem.date)}</Badge>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
            <div className="rounded-xl border bg-background p-2 shadow-sm">
              <LessonBuilderPage
                layoutMode="embedded"
                initialMeta={lessonPreset?.meta ?? undefined}
                initialClassId={lessonPreset?.classId ?? null}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              When your AI co-pilot is ready we will generate summaries and attach them back to the curriculum item automatically.
            </p>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <AssessmentsPanel
              assessments={assessments}
              classes={classes}
              isLoading={assessmentsQuery.isLoading}
              error={assessmentsQuery.error instanceof Error ? assessmentsQuery.error : null}
              onCreate={createAssessmentMutation.mutateAsync}
              isCreating={createAssessmentMutation.isPending}
              onOpenGrades={assessment => {
                setGradingContext(context => ({
                  ...context,
                  assessment,
                  scale: assessment.gradingScale,
                  studentId: "",
                  grade: "",
                  numeric: "",
                  feedback: "",
                }));
                setGradingDialogOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <StudentDialog
        open={studentDialogOpen}
        onOpenChange={setStudentDialogOpen}
        profile={studentProfileQuery.data}
        isLoading={studentProfileQuery.isLoading}
        behaviorNote={behaviorNote}
        onBehaviorNoteChange={setBehaviorNote}
        behaviorSentiment={behaviorSentiment}
        onBehaviorSentimentChange={setBehaviorSentiment}
        onSaveBehavior={() =>
          selectedStudentId &&
          behaviorNote.trim().length > 0 &&
          behaviorMutation.mutate({ studentId: selectedStudentId, note: behaviorNote, sentiment: behaviorSentiment })
        }
        appraisalNote={appraisalNote}
        onAppraisalNoteChange={setAppraisalNote}
        onSaveAppraisal={() =>
          selectedStudentId &&
          appraisalNote.trim().length > 0 &&
          appraisalMutation.mutate({ studentId: selectedStudentId, highlight: appraisalNote })
        }
        onGenerateReport={() => selectedStudentId && reportMutation.mutate(selectedStudentId)}
      />

      <GradingDialog
        open={gradingDialogOpen}
        onOpenChange={setGradingDialogOpen}
        context={gradingContext}
        onChange={setGradingContext}
        presets={presetGrades}
        gradeScales={gradeScales}
        submissions={assessmentSubmissionsQuery.data ?? []}
        grades={assessmentGradesQuery.data ?? []}
        onSubmit={() => recordGradeMutation.mutate()}
        isSubmitting={recordGradeMutation.isPending}
      />
    </div>
  );
};

interface SummaryCardProps {
  icon: ComponentType<ComponentProps<typeof Activity>>;
  label: string;
  value: number;
}

const SummaryCard = ({ icon: Icon, label, value }: SummaryCardProps) => (
  <div className="rounded-lg border bg-muted/30 p-4">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  </div>
);

interface ClassesPanelProps {
  classes: ClassWithPlanCount[];
  isLoading: boolean;
  error: Error | null;
  onCreate: () => void;
  onPlanLesson: (item?: CurriculumItem | null, classId?: string | null) => void;
}

const ClassesPanel = ({ classes, isLoading, error, onCreate, onPlanLesson }: ClassesPanelProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>My classes</CardTitle>
          <CardDescription>Organise rosters, meeting details, and linked lesson plans.</CardDescription>
        </div>
        <Button variant="outline" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" /> New class
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error.message}
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Create your first class to start planning lessons.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classes.map(classItem => (
              <div key={classItem.id} className="rounded-xl border bg-background/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{classItem.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {classItem.summary ?? "Keep attendance, assignments, and resources in sync."}
                    </p>
                  </div>
                  <Badge variant="outline">{classItem.planCount} plans</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {classItem.stage ? <Badge variant="outline">{classItem.stage}</Badge> : null}
                  {classItem.subject ? <Badge variant="outline">{classItem.subject}</Badge> : null}
                  {classItem.startDate ? <Badge variant="outline">{formatDate(classItem.startDate)}</Badge> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onPlanLesson(null, classItem.id)}>
                    <BookOpen className="mr-2 h-4 w-4" /> Plan a lesson
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/account/classes/${classItem.id}`}>Open dashboard</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StudentsPanelProps {
  students: StudentSummary[];
  isLoading: boolean;
  error: Error | null;
  onSelectStudent: (student: StudentSummary) => void;
}

const StudentsPanel = ({ students, isLoading, error, onSelectStudent }: StudentsPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My students</CardTitle>
        <CardDescription>Click a learner to review assignments, behaviour, and appraisal notes.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error.message}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Enrol students once your classes are ready.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Recent behaviour</TableHead>
                  <TableHead>Latest achievement</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-foreground">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.classes.map(cls => cls.title).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.latestBehaviorNote?.note ?? "No recent notes"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.latestAppraisalNote?.highlight ?? "No highlights yet"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => onSelectStudent(student)}>
                        View profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CurriculumPanelProps {
  classes: ClassWithPlanCount[];
  items: CurriculumItem[];
  filters: {
    classId: string | "all";
    stage: string | "all";
    subject: string | "all";
    week: string | "all";
    date: string;
  };
  options: {
    stages: string[];
    subjects: string[];
    weeks: number[];
  };
  onChangeFilters: (filters: CurriculumPanelProps["filters"]) => void;
  onDownloadCsv: () => void;
  onUploadCsv: () => void;
  onBuildLesson: (item: CurriculumItem) => void;
}

const CurriculumPanel = ({
  classes,
  items,
  filters,
  options,
  onChangeFilters,
  onDownloadCsv,
  onUploadCsv,
  onBuildLesson,
}: CurriculumPanelProps) => {
  const updateFilters = (patch: Partial<CurriculumPanelProps["filters"]>) => {
    onChangeFilters({ ...filters, ...patch });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curriculum planner</CardTitle>
        <CardDescription>Filter by class, stage, subject, or week to map your term.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select
            value={filters.classId === "all" ? "" : filters.classId}
            onValueChange={value => updateFilters({ classId: value || "all" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.stage === "all" ? "" : filters.stage}
            onValueChange={value => updateFilters({ stage: value || "all" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All stages</SelectItem>
              {options.stages.map(stage => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.subject === "all" ? "" : filters.subject}
            onValueChange={value => updateFilters({ subject: value || "all" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All subjects</SelectItem>
              {options.subjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.week === "all" ? "" : filters.week}
            onValueChange={value => updateFilters({ week: value || "all" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All weeks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All weeks</SelectItem>
              {options.weeks.map(week => (
                <SelectItem key={week} value={String(week)}>
                  Week {week}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={filters.date} onChange={event => updateFilters({ date: event.target.value })} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onDownloadCsv}>
            <FileDown className="mr-2 h-4 w-4" /> Download CSV
          </Button>
          <Button variant="outline" onClick={onUploadCsv}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Upload CSV
          </Button>
          <Button
            variant="ghost"
            onClick={() => updateFilters({ classId: "all", stage: "all", subject: "all", week: "all", date: "" })}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reset filters
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[160px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    Nothing scheduled yet—add curriculum items or import a CSV.
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.topic ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.subject ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.stage ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.week ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(item.date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onBuildLesson(item)}>
                          Build lesson
                        </Button>
                        <Button size="sm" variant="ghost">
                          View lesson plan
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar sync</CardTitle>
              <CardDescription>Push lessons to Google Calendar once connected.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Keep your teaching schedule aligned across SchoolTech Hub and your calendar.</p>
              <Button size="sm" variant="outline">
                <Calendar className="mr-2 h-4 w-4" /> Connect Google Calendar
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Curriculum insights</CardTitle>
              <CardDescription>See how your plan is balanced across subjects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Science lessons scheduled: {items.filter(item => item.subject === "Science").length}</p>
              <p>Literacy lessons scheduled: {items.filter(item => item.subject === "English").length}</p>
              <p>Average week alignment: {items.reduce((acc, item) => acc + (item.week ?? 0), 0) / (items.length || 1)}</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

interface AssessmentsPanelProps {
  assessments: AssessmentTemplate[];
  classes: ClassWithPlanCount[];
  isLoading: boolean;
  error: Error | null;
  onCreate: (input: {
    classId: string;
    title: string;
    description: string;
    dueDate: string;
    scale: GradeScale;
  }) => Promise<unknown>;
  isCreating: boolean;
  onOpenGrades: (assessment: AssessmentTemplate) => void;
}

const AssessmentsPanel = ({
  assessments,
  classes,
  isLoading,
  error,
  onCreate,
  isCreating,
  onOpenGrades,
}: AssessmentsPanelProps) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    scale: "letter" as GradeScale,
  });

  useEffect(() => {
    if (selectedClassId && !classes.some(cls => cls.id === selectedClassId)) {
      setSelectedClassId(null);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    setForm({ title: "", description: "", dueDate: "", scale: "letter" });
  }, [selectedClassId]);

  const assessmentCounts = useMemo(() => {
    const map = new Map<string, number>();
    assessments.forEach(assessment => {
      map.set(assessment.classId, (map.get(assessment.classId) ?? 0) + 1);
    });
    return map;
  }, [assessments]);

  const selectedClass = useMemo(
    () => (selectedClassId ? classes.find(cls => cls.id === selectedClassId) ?? null : null),
    [classes, selectedClassId],
  );

  const classAssessments = useMemo(
    () => (selectedClassId ? assessments.filter(assessment => assessment.classId === selectedClassId) : []),
    [assessments, selectedClassId],
  );

  const handleSubmit = async () => {
    if (!selectedClassId || !form.title.trim()) {
      return;
    }
    try {
      await onCreate({
        classId: selectedClassId,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate,
        scale: form.scale,
      });
      setForm({ title: "", description: "", dueDate: "", scale: "letter" });
    } catch (_error) {
      // Notification handled by caller
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        {selectedClass ? (
          <>
            <Button variant="ghost" size="sm" className="w-fit pl-0" onClick={() => setSelectedClassId(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to classes
            </Button>
            <div>
              <CardTitle>{selectedClass.title}</CardTitle>
              <CardDescription>
                Review assessments, track submissions, and record grades for this class.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {selectedClass.stage ? <Badge variant="outline">{selectedClass.stage}</Badge> : null}
              {selectedClass.subject ? <Badge variant="outline">{selectedClass.subject}</Badge> : null}
              {selectedClass.startDate ? (
                <Badge variant="outline">Started {formatDate(selectedClass.startDate)}</Badge>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <CardTitle>Assessment tracking</CardTitle>
            <CardDescription>
              Choose a class to review assessments, track submissions, and add new ones.
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {selectedClass ? (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                {error.message}
              </div>
            ) : classAssessments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No assessments for this class yet. Use the form below to create one.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Scale</TableHead>
                      <TableHead className="w-[140px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classAssessments.map(assessment => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium text-foreground">{assessment.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(assessment.dueDate)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{assessment.gradingScale}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => onOpenGrades(assessment)}>
                            Record grades
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <section className="rounded-lg border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold text-foreground">Add new assessment</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Share expectations, due dates, and grading scales with your class.
              </p>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assessment-title">Title</Label>
                  <Input
                    id="assessment-title"
                    value={form.title}
                    onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                    placeholder="Forces and motion quiz"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assessment-due">Due date</Label>
                    <Input
                      id="assessment-due"
                      type="date"
                      value={form.dueDate}
                      onChange={event => setForm(current => ({ ...current, dueDate: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment-scale">Grading scale</Label>
                    <Select
                      value={form.scale}
                      onValueChange={value =>
                        setForm(current => ({ ...current, scale: value as GradeScale }))
                      }
                    >
                      <SelectTrigger id="assessment-scale">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeScales.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessment-description">Instructions</Label>
                  <Textarea
                    id="assessment-description"
                    value={form.description}
                    onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
                    placeholder="Outline objectives, required materials, and success criteria"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={!form.title.trim() || isCreating}
                  >
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add assessment
                  </Button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                {error.message}
              </div>
            ) : null}
            {classes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                Create a class to start tracking assessments.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {classes.map(classItem => (
                  <button
                    key={classItem.id}
                    type="button"
                    onClick={() => setSelectedClassId(classItem.id)}
                    className="flex w-full flex-col items-start gap-3 rounded-xl border bg-background/80 p-4 text-left shadow-sm transition hover:border-primary/60 hover:shadow"
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{classItem.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {classItem.summary ?? "Track assignments, submissions, and feedback in one place."}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {assessmentCounts.get(classItem.id) ?? 0} assessments
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {classItem.stage ? <Badge variant="outline">{classItem.stage}</Badge> : null}
                      {classItem.subject ? <Badge variant="outline">{classItem.subject}</Badge> : null}
                      {classItem.startDate ? (
                        <Badge variant="outline">Starts {formatDate(classItem.startDate)}</Badge>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile | null | undefined;
  isLoading: boolean;
  behaviorNote: string;
  onBehaviorNoteChange: (value: string) => void;
  behaviorSentiment: StudentBehaviorEntry["sentiment"];
  onBehaviorSentimentChange: (value: StudentBehaviorEntry["sentiment"]) => void;
  onSaveBehavior: () => void;
  appraisalNote: string;
  onAppraisalNoteChange: (value: string) => void;
  onSaveAppraisal: () => void;
  onGenerateReport: () => void;
}

const StudentDialog = ({
  open,
  onOpenChange,
  profile,
  isLoading,
  behaviorNote,
  onBehaviorNoteChange,
  behaviorSentiment,
  onBehaviorSentimentChange,
  onSaveBehavior,
  appraisalNote,
  onAppraisalNoteChange,
  onSaveAppraisal,
  onGenerateReport,
}: StudentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Student profile</DialogTitle>
          <DialogDescription>Blend class assignments, behaviour observations, and AI reporting in one view.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !profile ? (
          <p className="text-sm text-muted-foreground">Select a learner to view details.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="text-lg font-semibold text-foreground">
                {profile.student.firstName} {profile.student.lastName}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                {profile.classes.map(cls => (
                  <Badge key={cls.id} variant="outline">
                    {cls.title}
                  </Badge>
                ))}
              </div>
            </div>
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-background/70 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-foreground">Assignments</h4>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {profile.assignments.length ? (
                    profile.assignments.map(assignment => (
                      <li key={assignment.id}>
                        <span className="font-medium text-foreground">{assignment.title}</span>
                        {assignment.dueDate ? ` • Due ${formatDate(assignment.dueDate)}` : ""}
                        {assignment.grade ? ` • ${assignment.grade}` : ""}
                      </li>
                    ))
                  ) : (
                    <li>No assignments recorded yet.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-lg border bg-background/70 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-foreground">Progress</h4>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {profile.progress.length ? (
                    profile.progress.map(metric => (
                      <li key={`${metric.metric}-${metric.capturedAt}`}>
                        <span className="font-medium text-foreground">{metric.metric}:</span> {metric.value}% ({metric.trend})
                      </li>
                    ))
                  ) : (
                    <li>No progress metrics yet.</li>
                  )}
                </ul>
              </div>
            </section>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border bg-background/70 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Behaviour notes</h4>
                  <Badge variant="outline">{profile.behaviorNotes.length}</Badge>
                </div>
                <Textarea
                  placeholder="Record behaviour notes"
                  value={behaviorNote}
                  onChange={event => onBehaviorNoteChange(event.target.value)}
                />
                <Select
                  value={behaviorSentiment}
                  onValueChange={value =>
                    onBehaviorSentimentChange(value as StudentBehaviorEntry["sentiment"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sentimentOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={onSaveBehavior}
                  disabled={!behaviorNote.trim().length}
                >
                  Save behaviour note
                </Button>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {profile.behaviorNotes.slice(0, 3).map(note => (
                    <p key={note.id}>
                      {formatDate(note.recordedAt)} — {note.note}
                    </p>
                  ))}
                </div>
              </div>
              <div className="space-y-3 rounded-lg border bg-background/70 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Appraisal notes</h4>
                  <Badge variant="outline">{profile.appraisalNotes.length}</Badge>
                </div>
                <Textarea
                  placeholder="Celebrate achievements and participation"
                  value={appraisalNote}
                  onChange={event => onAppraisalNoteChange(event.target.value)}
                />
                <Button size="sm" onClick={onSaveAppraisal} disabled={!appraisalNote.trim().length}>
                  Save appraisal
                </Button>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {profile.appraisalNotes.slice(0, 3).map(note => (
                    <p key={note.id}>
                      {formatDate(note.recordedAt)} — {note.highlight}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-background/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">AI progress reports</h4>
                  <p className="text-xs text-muted-foreground">
                    Generate a personalised progress summary using your notes and assessment data.
                  </p>
                </div>
                <Button size="sm" onClick={onGenerateReport} disabled={profile.reportStatus?.status === "processing"}>
                  <FileText className="mr-2 h-4 w-4" />
                  {profile.reportStatus?.status === "ready" ? "Regenerate report" : "Generate report"}
                </Button>
              </div>
              {profile.reportStatus ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Status: {profile.reportStatus.status} — requested {formatDate(profile.reportStatus.requestedAt)}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface GradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: {
    assessment: AssessmentTemplate | null;
    studentId: string;
    scale: GradeScale;
    grade: string;
    numeric: string;
    feedback: string;
  };
  onChange: (context: GradingDialogProps["context"]) => void;
  presets: Record<GradeScale, string[]>;
  gradeScales: Array<{ value: GradeScale; label: string }>;
  submissions: AssessmentSubmission[];
  grades: AssessmentGrade[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

const GradingDialog = ({
  open,
  onOpenChange,
  context,
  onChange,
  presets,
  gradeScales,
  submissions,
  grades,
  onSubmit,
  isSubmitting,
}: GradingDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Grade submissions</DialogTitle>
          <DialogDescription>Record progress and share personalised feedback.</DialogDescription>
        </DialogHeader>
        {context.assessment ? (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">{context.assessment.title}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {context.assessment.dueDate ? (
                  <Badge variant="outline">Due {formatDate(context.assessment.dueDate)}</Badge>
                ) : null}
                <Badge variant="outline">Scale: {context.assessment.gradingScale}</Badge>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grade-student">Student ID</Label>
                <Input
                  id="grade-student"
                  value={context.studentId}
                  onChange={event => onChange({ ...context, studentId: event.target.value })}
                  placeholder="Enter student identifier"
                />
              </div>
              <div className="space-y-2">
                <Label>Scale</Label>
                <Select value={context.scale} onValueChange={value => onChange({ ...context, scale: value as GradeScale })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeScales.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grade-value">Grade</Label>
                <Select value={context.grade} onValueChange={value => onChange({ ...context, grade: value })}>
                  <SelectTrigger id="grade-value">
                    <SelectValue placeholder="Select or type" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets[context.scale].map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="mt-2"
                  placeholder="Custom grade"
                  value={context.grade}
                  onChange={event => onChange({ ...context, grade: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade-numeric">Numeric value</Label>
                <Input
                  id="grade-numeric"
                  type="number"
                  value={context.numeric}
                  onChange={event => onChange({ ...context, numeric: event.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-feedback">Feedback</Label>
              <Textarea
                id="grade-feedback"
                value={context.feedback}
                onChange={event => onChange({ ...context, feedback: event.target.value })}
                placeholder="Celebrate wins and outline next steps"
              />
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Recent submissions</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {submissions.length ? (
                  submissions.map(item => (
                    <li key={item.id}>
                      {item.studentId} — {item.status}
                      {item.submittedAt ? ` • ${formatDate(item.submittedAt)}` : ""}
                    </li>
                  ))
                ) : (
                  <li>No submissions yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Recent grades</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {grades.length ? (
                  grades.map(grade => (
                    <li key={grade.id}>
                      {grade.studentId} — {grade.gradeValue ?? grade.gradeNumeric ?? "Pending"}
                    </li>
                  ))
                ) : (
                  <li>No grades recorded yet.</li>
                )}
              </ul>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onSubmit} disabled={!context.assessment || !context.studentId || isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDashboard;
