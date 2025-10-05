import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useToast } from "@/hooks/use-toast";
import { StudentSkillChart } from "@/components/students/StudentSkillChart";
import { fetchMyClasses } from "@/features/dashboard/api";
import { DASHBOARD_EXAMPLE_CLASS } from "@/features/dashboard/examples";
import {
  fetchStudents,
  getStudentsQueryKey,
  shouldUseStudentExamples,
  updateStudentComments,
  upsertStudentSkillScore,
} from "@/features/students/api";
import type { Class } from "../../types/supabase-tables";

export default function StudentDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useOptionalUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [behaviorDraft, setBehaviorDraft] = useState("");
  const [academicDraft, setAcademicDraft] = useState("");

  const classesQuery = useQuery<Class[]>({
    queryKey: ["dashboard-classes", user?.id],
    queryFn: () => fetchMyClasses(user!.id),
    enabled: Boolean(user?.id),
  });

  const classes = useMemo(() => {
    if (classesQuery.data && classesQuery.data.length > 0) {
      return classesQuery.data;
    }
    return [DASHBOARD_EXAMPLE_CLASS];
  }, [classesQuery.data]);

  const classIds = useMemo(() => classes.map(item => item.id), [classes]);
  const studentsQueryKey = useMemo(
    () => getStudentsQueryKey(user?.id, classIds),
    [classIds, user?.id],
  );

  const studentsQuery = useQuery({
    queryKey: studentsQueryKey,
    queryFn: () => fetchStudents({ ownerId: user?.id, classIds }),
    enabled: classIds.length > 0 && (Boolean(user?.id) || shouldUseStudentExamples(user?.id)),
  });

  const students = studentsQuery.data ?? [];
  const student = useMemo(() => students.find(item => item.id === id) ?? null, [id, students]);

  useEffect(() => {
    if (studentsQuery.error) {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    }
  }, [studentsQuery.error, t.dashboard.toasts.error, toast]);

  useEffect(() => {
    setBehaviorDraft(student?.behaviorComment ?? "");
    setAcademicDraft(student?.academicComment ?? "");
  }, [student?.behaviorComment, student?.academicComment, student?.id]);

  useEffect(() => {
    if (!studentsQuery.isLoading && !student && id) {
      toast({ description: t.studentDashboard.toasts.notFound, variant: "destructive" });
      navigate("/dashboard?tab=students", { replace: true });
    }
  }, [id, navigate, student, studentsQuery.isLoading, t.studentDashboard.toasts.notFound, toast]);

  const behaviorCommentMutation = useMutation({
    mutationFn: (input: { studentId: string; comment: string }) =>
      updateStudentComments({ ownerId: user?.id, studentId: input.studentId, behaviorComment: input.comment }),
    onSuccess: () => {
      toast({ description: t.studentDashboard.toasts.commentsSaved });
      void queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const academicCommentMutation = useMutation({
    mutationFn: (input: { studentId: string; comment: string }) =>
      updateStudentComments({ ownerId: user?.id, studentId: input.studentId, academicComment: input.comment }),
    onSuccess: () => {
      toast({ description: t.studentDashboard.toasts.commentsSaved });
      void queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const recordSkillScoreMutation = useMutation({
    mutationFn: (input: { studentId: string; skillId: string; month: string; score: number }) =>
      upsertStudentSkillScore({ ownerId: user?.id, ...input }),
    onSuccess: () => {
      toast({ description: t.studentDashboard.toasts.scoreSaved });
      void queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <main className="container space-y-8 py-10">
        <SEO title="Student Dashboard" description="Student progress" />
        <div className="rounded-xl border bg-muted/10 p-10 text-center text-muted-foreground">
          {t.dashboard.common.signInPrompt}
        </div>
      </main>
    );
  }

  if (!student) {
    return null;
  }

  const studentClass = classes.find(item => item.id === student.classId) ?? null;

  const handleBehaviorBlur = () => {
    if (!student) {
      return;
    }
    behaviorCommentMutation.mutate({ studentId: student.id, comment: behaviorDraft.trim() });
  };

  const handleAcademicBlur = () => {
    if (!student) {
      return;
    }
    academicCommentMutation.mutate({ studentId: student.id, comment: academicDraft.trim() });
  };

  const handleScoreSubmit = (skillId: string, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!student) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const month = String(formData.get("month"));
    const scoreValue = formData.get("score");
    if (!month || !scoreValue) {
      return;
    }

    const score = Number(scoreValue);
    if (Number.isNaN(score)) {
      return;
    }

    if (score < 0 || score > 100) {
      toast({ description: t.studentDashboard.toasts.scoreRange, variant: "destructive" });
      return;
    }

    recordSkillScoreMutation.mutate({ studentId: student.id, skillId, month, score });
    event.currentTarget.reset();
  };

  return (
    <main className="container space-y-8 py-10">
      <SEO title={`${student.fullName} • ${t.studentDashboard.title}`} description="Student progress overview" />
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard?tab=students")}
        className="-ml-2 w-fit"
      >
        ← {t.studentDashboard.actions.back}
      </Button>

      <section className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader>
            <CardTitle>{student.fullName}</CardTitle>
            <CardDescription>{t.studentDashboard.basicInfo.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.studentDashboard.basicInfo.classLabel}
              </span>
              <p className="text-base text-foreground">{studentClass?.title ?? t.studentDashboard.basicInfo.unknownClass}</p>
              {studentClass?.stage ? <p>{studentClass.stage}</p> : null}
              {studentClass?.subject ? <p>{studentClass.subject}</p> : null}
            </div>
            <Separator />
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.studentDashboard.basicInfo.guardian}
              </span>
              <p className="text-foreground">{student.guardianName ?? t.studentDashboard.basicInfo.unknownGuardian}</p>
              {student.guardianContact ? <p>{student.guardianContact}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.studentDashboard.comments.title}</CardTitle>
            <CardDescription>{t.studentDashboard.comments.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="behavior-comment">{t.studentDashboard.comments.behavior}</Label>
              <Textarea
                id="behavior-comment"
                rows={4}
                value={behaviorDraft}
                onChange={event => setBehaviorDraft(event.target.value)}
                onBlur={handleBehaviorBlur}
                placeholder={t.studentDashboard.comments.behaviorPlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="academic-comment">{t.studentDashboard.comments.academic}</Label>
              <Textarea
                id="academic-comment"
                rows={4}
                value={academicDraft}
                onChange={event => setAcademicDraft(event.target.value)}
                onBlur={handleAcademicBlur}
                placeholder={t.studentDashboard.comments.academicPlaceholder}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t.studentDashboard.comments.helper}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t.studentDashboard.skills.title}</h2>
          <p className="text-sm text-muted-foreground">{t.studentDashboard.skills.subtitle}</p>
        </div>
        {student.skills.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t.studentDashboard.skills.empty}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {student.skills.map(skill => (
              <Card key={skill.skillId} className="flex flex-col">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">{skill.skillName}</CardTitle>
                  <CardDescription>{t.studentDashboard.skills.chartLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StudentSkillChart skill={skill} emptyLabel={t.studentDashboard.skills.emptyChart} />
                  <form className="grid gap-3" onSubmit={event => handleScoreSubmit(skill.skillId, event)}>
                    <div className="grid gap-2">
                      <Label htmlFor={`month-${skill.skillId}`}>{t.studentDashboard.skills.fields.month}</Label>
                      <Input id={`month-${skill.skillId}`} name="month" type="month" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`score-${skill.skillId}`}>{t.studentDashboard.skills.fields.score}</Label>
                      <Input
                        id={`score-${skill.skillId}`}
                        name="score"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        required
                      />
                    </div>
                    <Button type="submit" className="justify-self-start" disabled={recordSkillScoreMutation.isPending}>
                      {t.studentDashboard.skills.fields.submit}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
