import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useToast } from "@/hooks/use-toast";
import {
  bulkAddStudents,
  fetchStudents,
  getStudentsQueryKey,
  shouldUseStudentExamples,
} from "@/features/students/api";
import type { StudentRecord } from "@/features/students/types";
import type { Class } from "../../../types/supabase-tables";
import { cn } from "@/lib/utils";

const splitNames = (input: string) =>
  input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

type SortOption = "name-asc" | "name-desc" | "class-asc" | "class-desc" | "stage-asc" | "stage-desc";

type EnrichedStudent = StudentRecord & {
  classTitle: string;
  classStage: string | null;
  classSubject: string | null;
};

const sortStudents = (list: EnrichedStudent[], option: SortOption): EnrichedStudent[] => {
  const normalize = (value: string | null | undefined) => (value ?? "").toLocaleLowerCase();
  const sorted = [...list];

  sorted.sort((a, b) => {
    switch (option) {
      case "name-desc":
        return normalize(b.fullName).localeCompare(normalize(a.fullName));
      case "class-asc": {
        const diff = normalize(a.classTitle).localeCompare(normalize(b.classTitle));
        if (diff !== 0) {
          return diff;
        }
        return normalize(a.fullName).localeCompare(normalize(b.fullName));
      }
      case "class-desc": {
        const diff = normalize(b.classTitle).localeCompare(normalize(a.classTitle));
        if (diff !== 0) {
          return diff;
        }
        return normalize(b.fullName).localeCompare(normalize(a.fullName));
      }
      case "stage-asc": {
        const diff = normalize(a.classStage).localeCompare(normalize(b.classStage));
        if (diff !== 0) {
          return diff;
        }
        return normalize(a.fullName).localeCompare(normalize(b.fullName));
      }
      case "stage-desc": {
        const diff = normalize(b.classStage).localeCompare(normalize(a.classStage));
        if (diff !== 0) {
          return diff;
        }
        return normalize(b.fullName).localeCompare(normalize(a.fullName));
      }
      case "name-asc":
      default:
        return normalize(a.fullName).localeCompare(normalize(b.fullName));
    }
  });

  return sorted;
};

type StudentsSectionProps = {
  classes: Class[];
  onOpenStudent: (studentId: string) => void;
  className?: string;
};

export function StudentsSection({ classes, onOpenStudent, className }: StudentsSectionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useOptionalUser();
  const queryClient = useQueryClient();

  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
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

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  const classLookup = useMemo(() => {
    const map = new Map<string, Class>();
    classes.forEach(item => {
      map.set(item.id, item);
    });
    return map;
  }, [classes]);

  const classOptions = useMemo(() => classes.map(item => ({ id: item.id, title: item.title })), [classes]);

  const stageOptions = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(item => {
      const value = (item.stage ?? "").trim();
      if (value.length > 0) {
        set.add(value);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [classes]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(item => {
      const value = (item.subject ?? "").trim();
      if (value.length > 0) {
        set.add(value);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [classes]);

  const unknownClassLabel = t.dashboard.students.labels.unknownClass;

  const enrichedStudents = useMemo(() => {
    return students.map<EnrichedStudent>(student => {
      const classInfo = classLookup.get(student.classId);
      const trimmedStage = classInfo?.stage ? classInfo.stage.trim() : "";
      const trimmedSubject = classInfo?.subject ? classInfo.subject.trim() : "";

      return {
        ...student,
        classTitle: classInfo?.title ?? unknownClassLabel,
        classStage: trimmedStage.length > 0 ? trimmedStage : null,
        classSubject: trimmedSubject.length > 0 ? trimmedSubject : null,
      };
    });
  }, [classLookup, students, unknownClassLabel]);

  const filteredStudents = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();
    const hasSearch = searchValue.length > 0;

    const filtered = enrichedStudents.filter(student => {
      if (filterClassId !== "all" && student.classId !== filterClassId) {
        return false;
      }
      if (stageFilter !== "all" && student.classStage !== stageFilter) {
        return false;
      }
      if (subjectFilter !== "all" && student.classSubject !== subjectFilter) {
        return false;
      }

      if (hasSearch) {
        const haystack = [
          student.fullName,
          student.preferredName ?? "",
          student.classTitle,
          student.classStage ?? "",
          student.classSubject ?? "",
          student.academicComment ?? "",
          student.behaviorComment ?? "",
          student.skills.map(skill => skill.skillName).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchValue)) {
          return false;
        }
      }

      return true;
    });

    return sortStudents(filtered, sortOption);
  }, [enrichedStudents, filterClassId, stageFilter, subjectFilter, searchTerm, sortOption]);

  const totalStudents = students.length;
  const visibleStudents = filteredStudents.length;
  const visibleClassCount = new Set(filteredStudents.map(student => student.classId)).size;
  const activeFiltersCount = [
    filterClassId !== "all",
    stageFilter !== "all",
    subjectFilter !== "all",
    searchTerm.trim().length > 0,
  ].filter(Boolean).length;
  const hasCustomSort = sortOption !== "name-asc";
  const shouldShowClear = activeFiltersCount > 0 || hasCustomSort;
  const filtersMetricLabel = t.dashboard.students.metrics.filters.replace(
    "{count}", activeFiltersCount.toString(),
  );

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

  const handleClearFilters = () => {
    setFilterClassId("all");
    setStageFilter("all");
    setSubjectFilter("all");
    setSearchTerm("");
    setSortOption("name-asc");
  };

  const isLoading = studentsQuery.isLoading;
  const hasStudents = totalStudents > 0;
  const hasFilteredStudents = visibleStudents > 0;

  return (
    <Card
      className={cn(
        "rounded-[2rem] border border-white/15 bg-white/10 text-white shadow-[0_35px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl",
        className,
      )}
    >
      <CardHeader className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-white md:text-3xl">
              {t.dashboard.students.title}
            </CardTitle>
            <CardDescription className="text-white/70">
              {t.dashboard.students.subtitle}
            </CardDescription>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={classOptions.length === 0}
            className="inline-flex h-11 items-center rounded-xl border border-white/40 bg-white/90 px-5 text-sm font-semibold text-slate-900 shadow-[0_18px_55px_-25px_rgba(255,255,255,0.9)] transition hover:bg-white disabled:border-white/20 disabled:text-slate-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t.dashboard.students.actions.add}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-white/60">
              {t.dashboard.students.metrics.totalLabel}
            </p>
            <p className="text-2xl font-semibold text-white">
              {isLoading ? "—" : totalStudents.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-white/60">
              {t.dashboard.students.metrics.visibleLabel}
            </p>
            <p className="text-2xl font-semibold text-white">
              {isLoading ? "—" : visibleStudents.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-white/60">
              {t.dashboard.students.metrics.classesLabel}
            </p>
            <p className="text-2xl font-semibold text-white">
              {isLoading ? "—" : visibleClassCount.toLocaleString()}
            </p>
          </div>
        </div>
        {activeFiltersCount > 0 ? (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            {filtersMetricLabel}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.8)]">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-white/60">
                {t.dashboard.students.filters.searchLabel}
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder={t.dashboard.students.filters.searchPlaceholder}
                  className="h-11 rounded-xl border border-white/15 bg-white/10 pl-9 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/30"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-white/60">
                  {t.dashboard.students.filters.classLabel}
                </Label>
                <Select value={filterClassId} onValueChange={setFilterClassId}>
                  <SelectTrigger className="h-11 rounded-xl border border-white/15 bg-white/10 text-sm text-white focus:border-white/40 focus:ring-white/30">
                    <SelectValue placeholder={t.dashboard.students.filters.classPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
                    <SelectItem value="all">{t.dashboard.students.filters.allClasses}</SelectItem>
                    {classOptions.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-white/60">
                  {t.dashboard.students.filters.stageLabel}
                </Label>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="h-11 rounded-xl border border-white/15 bg-white/10 text-sm text-white focus:border-white/40 focus:ring-white/30">
                    <SelectValue placeholder={t.dashboard.students.filters.stagePlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
                    <SelectItem value="all">{t.dashboard.students.filters.allStages}</SelectItem>
                    {stageOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-white/60">
                  {t.dashboard.students.filters.subjectLabel}
                </Label>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="h-11 rounded-xl border border-white/15 bg-white/10 text-sm text-white focus:border-white/40 focus:ring-white/30">
                    <SelectValue placeholder={t.dashboard.students.filters.subjectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
                    <SelectItem value="all">{t.dashboard.students.filters.allSubjects}</SelectItem>
                    {subjectOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-white/60">
                {t.dashboard.students.filters.sortLabel}
              </Label>
              <Select value={sortOption} onValueChange={value => setSortOption(value as SortOption)}>
                <SelectTrigger className="h-11 min-w-[180px] rounded-xl border border-white/15 bg-white/10 text-sm text-white focus:border-white/40 focus:ring-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
                  <SelectItem value="name-asc">{t.dashboard.students.filters.sortNameAsc}</SelectItem>
                  <SelectItem value="name-desc">{t.dashboard.students.filters.sortNameDesc}</SelectItem>
                  <SelectItem value="class-asc">{t.dashboard.students.filters.sortClassAsc}</SelectItem>
                  <SelectItem value="class-desc">{t.dashboard.students.filters.sortClassDesc}</SelectItem>
                  <SelectItem value="stage-asc">{t.dashboard.students.filters.sortStageAsc}</SelectItem>
                  <SelectItem value="stage-desc">{t.dashboard.students.filters.sortStageDesc}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {shouldShowClear ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/20"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t.dashboard.students.filters.clear}
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.85)]">
            <Table className="min-w-full text-white/80">
              <TableHeader className="bg-white/5 text-white/70 [&_tr]:border-white/10 [&_th]:text-xs [&_th]:font-semibold">
                <TableRow className="border-white/10">
                  <TableHead>{t.dashboard.students.columns.student}</TableHead>
                  <TableHead>{t.dashboard.students.columns.class}</TableHead>
                  <TableHead>{t.dashboard.students.columns.subject}</TableHead>
                  <TableHead>{t.dashboard.students.columns.stage}</TableHead>
                  <TableHead>{t.dashboard.students.columns.skills}</TableHead>
                  <TableHead>{t.dashboard.students.columns.comments}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-white/10">
                {Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={`student-skeleton-${index}`}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <TableCell key={`skeleton-cell-${index}-${cellIndex}`}>
                        <Skeleton className="h-5 w-3/4 bg-white/10" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !hasStudents ? (
          <div className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-10 text-center text-sm text-white/70">
            {t.dashboard.students.empty}
          </div>
        ) : !hasFilteredStudents ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-white/25 bg-white/5 p-10 text-center text-sm text-white/70">
            <p>{t.dashboard.students.emptyFiltered}</p>
            {shouldShowClear ? (
              <Button
                type="button"
                onClick={handleClearFilters}
                variant="outline"
                className="mx-auto inline-flex items-center gap-2 rounded-full border-white/40 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t.dashboard.students.filters.clear}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.85)]">
            <Table className="min-w-full text-white/80">
              <TableHeader className="bg-white/5 text-white/70 [&_tr]:border-white/10 [&_th]:text-xs [&_th]:font-semibold">
                <TableRow className="border-white/10">
                  <TableHead>{t.dashboard.students.columns.student}</TableHead>
                  <TableHead>{t.dashboard.students.columns.class}</TableHead>
                  <TableHead>{t.dashboard.students.columns.subject}</TableHead>
                  <TableHead>{t.dashboard.students.columns.stage}</TableHead>
                  <TableHead>{t.dashboard.students.columns.skills}</TableHead>
                  <TableHead>{t.dashboard.students.columns.comments}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-white/10">
                {filteredStudents.map(student => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer transition hover:bg-white/15"
                    onClick={() => onOpenStudent(student.id)}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{student.fullName}</span>
                        {student.preferredName ? (
                          <Badge variant="secondary" className="border-white/30 bg-white/15 text-xs text-white">
                            {t.dashboard.students.labels.preferred.replace("{name}", student.preferredName)}
                          </Badge>
                        ) : null}
                        {student.isExample ? (
                          <Badge variant="outline" className="border-white/40 bg-white/10 text-xs uppercase text-white/80">
                            {t.dashboard.common.exampleTag}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/80">{student.classTitle}</TableCell>
                    <TableCell className="text-white/80">
                      {student.classSubject ? (
                        <Badge variant="secondary" className="border-white/30 bg-white/15 text-xs text-white">
                          {student.classSubject}
                        </Badge>
                      ) : (
                        <span className="text-white/60">{t.dashboard.students.labels.unknownSubject}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {student.classStage ? (
                        <Badge variant="outline" className="border-white/40 bg-white/10 text-xs uppercase tracking-wide text-white/80">
                          {student.classStage}
                        </Badge>
                      ) : (
                        <span className="text-white/60">{t.dashboard.students.labels.unknownStage}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.skills.map(skill => (
                            <Badge key={skill.skillId} variant="secondary" className="border-white/30 bg-white/15 text-xs text-white">
                              {skill.skillName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/60">{t.dashboard.students.labels.noSkills}</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[320px] text-sm text-white/70">
                      {student.academicComment || student.behaviorComment ? (
                        <span className="line-clamp-2">
                          {[student.behaviorComment, student.academicComment]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      ) : (
                        <span>{t.dashboard.students.labels.noComments}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg border border-white/20 bg-white/10 text-white shadow-[0_35px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">{t.dashboard.students.dialog.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-white/80">{t.dashboard.students.dialog.classLabel}</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="rounded-xl border border-white/30 bg-white/5 text-white focus:ring-white/40">
                  <SelectValue placeholder={t.dashboard.students.dialog.classPlaceholder} />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-slate-900/90 text-white backdrop-blur-xl">
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
              <Label htmlFor="student-names" className="text-sm font-medium text-white/80">
                {t.dashboard.students.dialog.namesLabel}
              </Label>
              <Textarea
                id="student-names"
                rows={6}
                placeholder={t.dashboard.students.dialog.namesPlaceholder}
                value={namesInput}
                onChange={event => setNamesInput(event.target.value)}
                className="rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/40"
              />
              <p className="text-xs text-white/60">{t.dashboard.students.dialog.helper}</p>
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
              disabled={!selectedClassId || !namesInput.trim() || addStudentsMutation.isPending}
              className="border border-white/40 bg-white/90 text-slate-900 hover:bg-white disabled:border-white/20 disabled:text-slate-700"
            >
              {addStudentsMutation.isPending ? t.common.loading : t.dashboard.students.dialog.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
