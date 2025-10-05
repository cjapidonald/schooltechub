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

type SkillsSectionProps = {
  classes: Class[];
};

export function SkillsSection({ classes }: SkillsSectionProps) {
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
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{t.dashboard.skills.title}</CardTitle>
          <CardDescription>{t.dashboard.skills.subtitle}</CardDescription>
        </div>
        <Button onClick={() => setDialogOpen(true)}>{t.dashboard.skills.actions.add}</Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skillsQuery.isLoading ? (
          <div className="col-span-full rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t.dashboard.common.loading}
          </div>
        ) : skills.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t.dashboard.skills.empty}
          </div>
        ) : (
          skills.map(skill => {
            const skillClass = classOptions.find(option => option.id === skill.classId);
            const studentCount = students.filter(student => student.classId === skill.classId).length;
            return (
              <div key={skill.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold leading-tight">{skill.title}</h3>
                    {skill.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{skill.description}</p>
                    ) : null}
                  </div>
                  {skill.isExample ? (
                    <Badge variant="outline" className="text-xs uppercase text-muted-foreground">
                      {t.dashboard.common.exampleTag}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{skillClass?.title ?? t.dashboard.skills.labels.unknownClass}</Badge>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.dashboard.skills.dialog.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>{t.dashboard.skills.dialog.classLabel}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.dashboard.skills.dialog.classPlaceholder} />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="skill-title">{t.dashboard.skills.dialog.nameLabel}</Label>
              <Input
                id="skill-title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder={t.dashboard.skills.dialog.namePlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-description">{t.dashboard.skills.dialog.descriptionLabel}</Label>
              <Textarea
                id="skill-description"
                rows={4}
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder={t.dashboard.skills.dialog.descriptionPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={!classId || !title.trim() || createSkillMutation.isPending}>
              {t.dashboard.skills.dialog.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
