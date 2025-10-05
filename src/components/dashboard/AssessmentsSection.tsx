import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useToast } from "@/hooks/use-toast";
import {
  listMyClassesWithPlanCount,
  type ClassWithPlanCount,
} from "@/lib/classes";
import {
  createAssessment,
  listAssessmentGrades,
  listAssessmentSubmissions,
  listAssessments,
  recordAssessmentGrade,
} from "@/lib/data/assessments";
import type {
  AssessmentGrade,
  AssessmentSubmission,
  AssessmentTemplate,
  GradeScale,
} from "@/types/platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export const AssessmentsSection = () => {
  const { user } = useOptionalUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canManage = Boolean(user);

  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [gradingContext, setGradingContext] = useState({
    assessment: null as AssessmentTemplate | null,
    studentId: "",
    scale: "letter" as GradeScale,
    grade: "",
    numeric: "",
    feedback: "",
  });

  const classesQuery = useQuery({
    queryKey: ["dashboard-classes", user?.id ?? "guest"],
    queryFn: () => listMyClassesWithPlanCount(),
  });

  const assessmentsQuery = useQuery({
    queryKey: ["dashboard-assessments", user?.id ?? "guest"],
    queryFn: () => listAssessments(),
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

  const createAssessmentMutation = useMutation({
    mutationFn: (payload: {
      classId: string;
      title: string;
      description: string;
      dueDate: string;
      scale: GradeScale;
    }) => {
      if (!canManage) {
        throw new Error("Sign in required to create assessments.");
      }
      return createAssessment({
        classId: payload.classId,
        title: payload.title,
        description: payload.description,
        dueDate: payload.dueDate || null,
        gradingScale: payload.scale,
      });
    },
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
    mutationFn: () => {
      if (!canManage) {
        throw new Error("Sign in required to record grades.");
      }
      return recordAssessmentGrade({
        assessmentId: gradingContext.assessment?.id ?? "",
        studentId: gradingContext.studentId,
        gradeValue: gradingContext.grade || null,
        gradeNumeric: gradingContext.numeric ? Number(gradingContext.numeric) : null,
        scale: gradingContext.scale,
        feedback: gradingContext.feedback || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Grade recorded" });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-assessment-grades", gradingContext.assessment?.id],
      });
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
  const assessments = useMemo(() => assessmentsQuery.data ?? [], [assessmentsQuery.data]);

  return (
    <div className="space-y-6">
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
        canManage={canManage}
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
  canManage: boolean;
}

const AssessmentsPanel = ({
  assessments,
  classes,
  isLoading,
  error,
  onCreate,
  isCreating,
  onOpenGrades,
  canManage,
}: AssessmentsPanelProps) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    scale: "letter" as GradeScale,
  });
  const { toast } = useToast();
  const readOnly = !canManage;

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
    if (readOnly) {
      toast({
        title: "Sign in to create assessments",
        description: "Log in to design assignments, collect submissions, and grade student work.",
      });
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
                          <Button
                            size="sm"
                            onClick={() => {
                              if (readOnly) {
                                toast({
                                  title: "Sign in to record grades",
                                  description: "Log in to grade submissions and capture feedback for students.",
                                });
                                return;
                              }
                              onOpenGrades(assessment);
                            }}
                            disabled={readOnly}
                          >
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
                    disabled={readOnly}
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
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment-scale">Grading scale</Label>
                    <Select
                      value={form.scale}
                      onValueChange={value =>
                        setForm(current => ({ ...current, scale: value as GradeScale }))
                      }
                      disabled={readOnly}
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
                    disabled={readOnly}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={!form.title.trim() || isCreating || readOnly}>
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add assessment
                  </Button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            {readOnly ? (
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
                Browse example assessment tracking. Sign in to create assignments, record submissions, and grade students.
              </div>
            ) : null}
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

export default AssessmentsSection;
