import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import {
  bulkAddStudents,
  fetchStudents,
  getStudentsQueryKey,
  shouldUseStudentExamples,
} from "@/features/students/api";
import type { Class } from "../../../types/supabase-tables";

const splitNames = (input: string) =>
  input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

type StudentsSectionProps = {
  classes: Class[];
  onOpenStudent: (studentId: string) => void;
};

export function StudentsSection({ classes, onOpenStudent }: StudentsSectionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useOptionalUser();
  const queryClient = useQueryClient();

  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [namesInput, setNamesInput] = useState("");

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

  useEffect(() => {
    if (studentsQuery.error) {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    }
  }, [studentsQuery.error, t.dashboard.toasts.error, toast]);

  const addStudentsMutation = useMutation({
    mutationFn: (input: { classId: string; names: string[] }) =>
      bulkAddStudents({ ownerId: user?.id, ...input }),
    onSuccess: (_, variables) => {
      toast({ description: t.dashboard.students.toasts.added });
      setNamesInput("");
      setSelectedClassId("");
      setDialogOpen(false);
      if (filterClassId !== "all" && variables.classId) {
        setFilterClassId(variables.classId);
      }
      void queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const students = studentsQuery.data ?? [];

  const classOptions = useMemo(() => {
    if (classes.length === 0) {
      return [];
    }
    return classes.map(item => ({ id: item.id, title: item.title }));
  }, [classes]);

  const filteredStudents = useMemo(() => {
    const list = [...students].sort((a, b) => a.fullName.localeCompare(b.fullName));
    if (filterClassId === "all") {
      return list;
    }
    return list.filter(student => student.classId === filterClassId);
  }, [filterClassId, students]);

  const handleSubmit = () => {
    if (!selectedClassId) {
      return;
    }
    const names = splitNames(namesInput);
    if (names.length === 0) {
      toast({ description: t.dashboard.students.dialog.emptyNames, variant: "destructive" });
      return;
    }

    addStudentsMutation.mutate({ classId: selectedClassId, names });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{t.dashboard.students.title}</CardTitle>
          <CardDescription>{t.dashboard.students.subtitle}</CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={filterClassId} onValueChange={setFilterClassId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t.dashboard.students.filters.classPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.dashboard.students.filters.allClasses}</SelectItem>
              {classOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} disabled={classOptions.length === 0}>
            {t.dashboard.students.actions.add}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {studentsQuery.isLoading ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t.dashboard.common.loading}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t.dashboard.students.empty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.dashboard.students.columns.student}</TableHead>
                  <TableHead>{t.dashboard.students.columns.class}</TableHead>
                  <TableHead>{t.dashboard.students.columns.skills}</TableHead>
                  <TableHead>{t.dashboard.students.columns.comments}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer"
                    onClick={() => onOpenStudent(student.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{student.fullName}</span>
                        {student.preferredName ? (
                          <Badge variant="secondary" className="text-xs">
                            {t.dashboard.students.labels.preferred.replace("{name}", student.preferredName)}
                          </Badge>
                        ) : null}
                        {student.isExample ? (
                          <Badge variant="outline" className="text-xs uppercase text-muted-foreground">
                            {t.dashboard.common.exampleTag}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {classOptions.find(item => item.id === student.classId)?.title ??
                        t.dashboard.students.labels.unknownClass}
                    </TableCell>
                    <TableCell>
                      {student.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.skills.map(skill => (
                            <Badge key={skill.skillId} variant="secondary">
                              {skill.skillName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {t.dashboard.students.labels.noSkills}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                      {student.academicComment || student.behaviorComment
                        ? `${student.behaviorComment ?? ""}${
                            student.behaviorComment && student.academicComment ? " · " : ""
                          }${student.academicComment ?? ""}`
                        : t.dashboard.students.labels.noComments}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.dashboard.students.dialog.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>{t.dashboard.students.dialog.classLabel}</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.dashboard.students.dialog.classPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {t.dashboard.students.dialog.noClasses}
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
              <Label htmlFor="student-names">{t.dashboard.students.dialog.namesLabel}</Label>
              <Textarea
                id="student-names"
                rows={6}
                placeholder={t.dashboard.students.dialog.namesPlaceholder}
                value={namesInput}
                onChange={event => setNamesInput(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t.dashboard.students.dialog.helper}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedClassId || !namesInput.trim() || addStudentsMutation.isPending}
            >
              {t.dashboard.students.dialog.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
