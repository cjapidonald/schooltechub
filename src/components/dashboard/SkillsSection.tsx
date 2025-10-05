import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import {
  createSkillForClass,
  fetchClassSkills,
  fetchStudents,
  getSkillsQueryKey,
  getStudentsQueryKey,
  shouldUseStudentExamples,
} from "@/features/students/api";
import type { Class } from "../../../types/supabase-tables";
import { cn } from "@/lib/utils";

type SkillsSectionProps = {
  classes: Class[];
  className?: string;
};

export function SkillsSection({ classes, className }: SkillsSectionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useOptionalUser();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [classId, setClassId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const classOptions = useMemo(() => classes.map(item => ({ id: item.id, title: item.title })), [classes]);
  const classIds = useMemo(() => classes.map(item => item.id), [classes]);

  const skillsQueryKey = useMemo(
    () => getSkillsQueryKey(user?.id, classIds),
    [classIds, user?.id],
  );
  const studentsQueryKey = useMemo(
    () => getStudentsQueryKey(user?.id, classIds),
    [classIds, user?.id],
  );

  const skillsQuery = useQuery({
    queryKey: skillsQueryKey,
    queryFn: () => fetchClassSkills({ ownerId: user?.id, classIds }),
    enabled: classIds.length > 0 && (Boolean(user?.id) || shouldUseStudentExamples(user?.id)),
  });

  const studentsQuery = useQuery({
    queryKey: studentsQueryKey,
    queryFn: () => fetchStudents({ ownerId: user?.id, classIds }),
    enabled: classIds.length > 0 && (Boolean(user?.id) || shouldUseStudentExamples(user?.id)),
  });

  const createSkillMutation = useMutation({
    mutationFn: () =>
      createSkillForClass({
        ownerId: user?.id,
        classId,
        title,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      toast({ description: t.dashboard.skills.toasts.created });
      setDialogOpen(false);
      setClassId("");
      setTitle("");
      setDescription("");
      void queryClient.invalidateQueries({ queryKey: skillsQueryKey });
      void queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const skills = skillsQuery.data ?? [];
  const students = studentsQuery.data ?? [];

  const handleSubmit = () => {
    if (!classId || !title.trim()) {
      return;
    }
    createSkillMutation.mutate();
  };

  return (
    <Card
      className={cn(
        "rounded-[2rem] border border-white/15 bg-white/10 text-white shadow-[0_35px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl",
        className,
      )}
    >
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-white md:text-3xl">
            {t.dashboard.skills.title}
          </CardTitle>
          <CardDescription className="text-white/70">
            {t.dashboard.skills.subtitle}
          </CardDescription>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="h-11 rounded-xl border border-white/40 bg-white/90 px-5 text-sm font-semibold text-slate-900 shadow-[0_15px_45px_-25px_rgba(255,255,255,0.9)] transition hover:bg-white"
        >
          {t.dashboard.skills.actions.add}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {skillsQuery.isLoading ? (
          <div className="col-span-full rounded-2xl border border-dashed border-white/30 bg-white/5 p-8 text-center text-sm text-white/70">
            {t.dashboard.common.loading}
          </div>
        ) : skills.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-white/30 bg-white/5 p-8 text-center text-sm text-white/70">
            {t.dashboard.skills.empty}
          </div>
        ) : (
          skills.map(skill => {
            const skillClass = classOptions.find(option => option.id === skill.classId);
            const studentCount = students.filter(student => student.classId === skill.classId).length;
            return (
              <div
                key={skill.id}
                className="rounded-2xl border border-white/15 bg-white/10 p-6 text-white/80 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight text-white">{skill.title}</h3>
                    {skill.description ? (
                      <p className="mt-2 text-sm text-white/70">{skill.description}</p>
                    ) : null}
                  </div>
                  {skill.isExample ? (
                    <Badge variant="outline" className="border-white/40 bg-white/10 text-xs uppercase text-white/80">
                      {t.dashboard.common.exampleTag}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
                  <Badge variant="secondary" className="border-white/30 bg-white/15 text-white">
                    {skillClass?.title ?? t.dashboard.skills.labels.unknownClass}
                  </Badge>
                  <span>
                    {t.dashboard.skills.labels.studentCount
                      .replace("{count}", String(studentCount))
                      .replace("{class}", skillClass?.title ?? t.dashboard.skills.labels.unknownClass)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg border border-white/20 bg-white/10 text-white shadow-[0_35px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">{t.dashboard.skills.dialog.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-white/80">{t.dashboard.skills.dialog.classLabel}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="rounded-xl border border-white/30 bg-white/5 text-white focus:ring-white/40">
                  <SelectValue placeholder={t.dashboard.skills.dialog.classPlaceholder} />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-slate-900/90 text-white backdrop-blur-xl">
                  {classOptions.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {t.dashboard.skills.dialog.noClasses}
                    </SelectItem>
                  ) : null}
                  {classOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-title" className="text-sm font-medium text-white/80">
                {t.dashboard.skills.dialog.nameLabel}
              </Label>
              <Input
                id="skill-title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder={t.dashboard.skills.dialog.namePlaceholder}
                className="rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/40"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-description" className="text-sm font-medium text-white/80">
                {t.dashboard.skills.dialog.descriptionLabel}
              </Label>
              <Textarea
                id="skill-description"
                rows={4}
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder={t.dashboard.skills.dialog.descriptionPlaceholder}
                className="rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/40 text-white hover:bg-white/15"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!classId || !title.trim() || createSkillMutation.isPending}
              className="border border-white/40 bg-white/90 text-slate-900 hover:bg-white disabled:border-white/20 disabled:text-slate-700"
            >
              {createSkillMutation.isPending ? t.common.loading : t.dashboard.skills.dialog.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
