import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parse } from "date-fns";
import {
  CalendarIcon,
  ClipboardList,
  ExternalLink,
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useMyClasses } from "@/hooks/useMyClasses";
import {
  deleteCurriculumItem,
  deleteCurriculumLessonLink,
  listCurriculumItems,
  listCurriculumLessonLinks,
  saveCurriculumItem,
  upsertCurriculumLessonLink,
} from "@/lib/data/curriculum";
import { createLessonBuilderDraft } from "@/lib/builder-api";
import type { CurriculumItem, CurriculumLessonLink } from "@/types/platform";

interface CurriculumPageProps {
  variant?: "standalone" | "embedded";
  className?: string;
}

interface CurriculumRow extends CurriculumItem {
  lessonLinkId: string | null;
  lessonPlanId: string | null;
  presentationUrl: string | null;
  lessonStatus: CurriculumLessonLink["status"] | null;
}

interface ParsedCurriculumRow {
  title: string;
  stage?: string | null;
  subject?: string | null;
  date?: string | null;
}

interface CreateCurriculumPayload {
  classId: string;
  title: string;
  stage?: string | null;
  subject?: string | null;
  date?: string | null;
}

const DATE_FORMATS = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "MMM d, yyyy"] as const;

const parsePossibleDate = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  for (const formatString of DATE_FORMATS) {
    const parsed = parse(trimmed, formatString, new Date());
    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  }

  const direct = new Date(trimmed);
  if (isValid(direct)) {
    return direct.toISOString();
  }

  return null;
};

const parsePastedCurriculum = (input: string): ParsedCurriculumRow[] => {
  return input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const cells = line.split("\t");

      if (cells.length === 1) {
        return { title: cells[0].trim() } satisfies ParsedCurriculumRow;
      }

      if (cells.length === 2) {
        const [stage, title] = cells;
        return {
          title: title?.trim() ?? "",
          stage: stage?.trim() || null,
        } satisfies ParsedCurriculumRow;
      }

      const [rawStage, rawSubject, ...rest] = cells;
      const trimmedStage = rawStage?.trim() || null;
      const trimmedSubject = rawSubject?.trim() || null;

      if (rest.length === 0) {
        return {
          title: line.trim(),
          stage: trimmedStage,
          subject: trimmedSubject,
        } satisfies ParsedCurriculumRow;
      }

      const lastCell = rest[rest.length - 1];
      const possibleDate = parsePossibleDate(lastCell);

      const contentCells = possibleDate ? rest.slice(0, -1) : rest;
      const title = contentCells.join(" ").trim();

      return {
        title: title.length > 0 ? title : line.trim(),
        stage: trimmedStage,
        subject: trimmedSubject,
        date: possibleDate,
      } satisfies ParsedCurriculumRow;
    });
};

const CurriculumPage = ({ variant = "standalone", className }: CurriculumPageProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { classes, isLoading: isLoadingClasses, error: classesError } = useMyClasses();

  const wrapperClassName = cn(
    "space-y-8",
    variant === "standalone" ? "container py-10" : "",
    className,
  );

  const classesById = useMemo(() => {
    return new Map(classes.map(item => [item.id, item.title]));
  }, [classes]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [pastedTitles, setPastedTitles] = useState("");
  const [defaultClassId, setDefaultClassId] = useState<string>("");
  const [defaultStage, setDefaultStage] = useState("");
  const [defaultSubject, setDefaultSubject] = useState("");
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  useEffect(() => {
    if (classes.length > 0 && !defaultClassId) {
      setDefaultClassId(classes[0]?.id ?? "");
    }
  }, [classes, defaultClassId]);

  const curriculumItemsQuery = useQuery({
    queryKey: ["curriculum-items"],
    queryFn: () => listCurriculumItems(),
  });

  const curriculumLinksQuery = useQuery({
    queryKey: ["curriculum-lesson-links"],
    queryFn: () => listCurriculumLessonLinks(),
  });

  const rows: CurriculumRow[] = useMemo(() => {
    const items = curriculumItemsQuery.data ?? [];
    const links = curriculumLinksQuery.data ?? [];
    const linkByItemId = new Map(links.map(link => [link.curriculumItemId, link]));

    return items.map(item => {
      const link = linkByItemId.get(item.id) ?? null;
      return {
        ...item,
        lessonLinkId: link?.id ?? null,
        lessonPlanId: link?.lessonPlanId ?? null,
        presentationUrl: link?.viewUrl ?? null,
        lessonStatus: link?.status ?? null,
      } satisfies CurriculumRow;
    });
  }, [curriculumItemsQuery.data, curriculumLinksQuery.data]);

  const createItemsMutation = useMutation({
    mutationFn: async (items: CreateCurriculumPayload[]) => {
      const results: CurriculumItem[] = [];
      for (const item of items) {
        const result = await saveCurriculumItem({
          classId: item.classId,
          title: item.title,
          stage: item.stage ?? null,
          subject: item.subject ?? null,
          date: item.date ?? null,
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum-items"] });
      toast({
        title: "Curriculum updated",
        description:
          created.length === 1
            ? "1 lesson was added to your curriculum."
            : `${created.length} lessons were added to your curriculum.`,
      });
      setPastedTitles("");
      setDefaultDate(null);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      const description =
        error instanceof Error ? error.message : "Unable to save the new curriculum rows.";
      toast({
        title: "Could not add curriculum", 
        description,
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: (input: {
      id: string;
      classId: string;
      title: string;
      stage?: string | null;
      subject?: string | null;
      date?: string | null;
    }) =>
      saveCurriculumItem({
        id: input.id,
        classId: input.classId,
        title: input.title,
        stage: input.stage ?? null,
        subject: input.subject ?? null,
        date: input.date ?? null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum-items"] });
    },
    onError: (error) => {
      const description =
        error instanceof Error ? error.message : "Unable to update the curriculum entry.";
      toast({
        title: "Curriculum update failed",
        description,
        variant: "destructive",
      });
    },
  });

  const createLessonPlanMutation = useMutation({
    mutationFn: async (row: CurriculumRow) => {
      const plan = await createLessonBuilderDraft({
        title: row.title,
        stage: row.stage ?? undefined,
        subjects: row.subject ? [row.subject] : undefined,
      });

      await upsertCurriculumLessonLink({
        id: row.lessonLinkId ?? undefined,
        curriculumItemId: row.id,
        lessonPlanId: plan.id,
        viewUrl: row.presentationUrl ?? null,
        status: "draft",
      });

      return plan;
    },
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum-lesson-links"] });
      toast({
        title: "Lesson plan created",
        description: "Opening the lesson builder so you can finish planning.",
      });
      navigate(`/builder/lesson-plans/${plan.id}`);
    },
    onError: (error) => {
      const description =
        error instanceof Error ? error.message : "Unable to create the lesson plan.";
      toast({
        title: "Could not create lesson plan",
        description,
        variant: "destructive",
      });
    },
  });

  const presentationMutation = useMutation({
    mutationFn: (input: {
      curriculumItemId: string;
      linkId: string | null;
      lessonPlanId: string | null;
      url: string | null;
    }) => {
      const sanitizedUrl = input.url?.trim() ?? null;
      const lessonPlanId = input.lessonPlanId ?? `plan-${input.curriculumItemId}`;

      return upsertCurriculumLessonLink({
        id: input.linkId ?? undefined,
        curriculumItemId: input.curriculumItemId,
        lessonPlanId,
        viewUrl: sanitizedUrl,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum-lesson-links"] });
      toast({ title: "Presentation link saved" });
      setPresentationEditor({ open: false, item: null, value: "", linkId: null, lessonPlanId: null });
    },
    onError: (error) => {
      const description =
        error instanceof Error ? error.message : "Unable to save the presentation link.";
      toast({
        title: "Presentation update failed",
        description,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (input: { itemId: string; linkId: string | null }) => {
      await deleteCurriculumItem(input.itemId);
      if (input.linkId) {
        await deleteCurriculumLessonLink(input.linkId);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum-items"] });
      void queryClient.invalidateQueries({ queryKey: ["curriculum-lesson-links"] });
      toast({ title: "Curriculum entry removed" });
    },
    onError: (error) => {
      const description =
        error instanceof Error ? error.message : "Unable to remove the curriculum entry.";
      toast({
        title: "Delete failed",
        description,
        variant: "destructive",
      });
    },
  });

  const [presentationEditor, setPresentationEditor] = useState<{
    open: boolean;
    item: CurriculumRow | null;
    value: string;
    linkId: string | null;
    lessonPlanId: string | null;
  }>({
    open: false,
    item: null,
    value: "",
    linkId: null,
    lessonPlanId: null,
  });

  const isLoading =
    curriculumItemsQuery.isLoading ||
    curriculumLinksQuery.isLoading ||
    (isLoadingClasses && classes.length === 0);

  const handleAddCurriculum = () => {
    const parsedRows = parsePastedCurriculum(pastedTitles);
    const sanitized = parsedRows
      .map(row => {
        const title = row.title?.trim() ?? "";
        if (!title) {
          return null;
        }

        return {
          classId: defaultClassId,
          title,
          stage: row.stage ?? (defaultStage.trim() ? defaultStage.trim() : null),
          subject: row.subject ?? (defaultSubject.trim() ? defaultSubject.trim() : null),
          date: row.date ?? (defaultDate ? defaultDate.toISOString() : null),
        } satisfies CreateCurriculumPayload;
      })
      .filter((item): item is CreateCurriculumPayload => item !== null);

    if (!defaultClassId) {
      toast({
        title: "Select a class",
        description: "Choose which class these lessons belong to before adding them.",
        variant: "destructive",
      });
      return;
    }

    if (sanitized.length === 0) {
      toast({
        title: "Nothing to add",
        description: "Paste one or more lesson titles to create curriculum rows.",
        variant: "destructive",
      });
      return;
    }

    createItemsMutation.mutate(sanitized);
  };

  const handleFieldChange = (
    row: CurriculumRow,
    patch: Partial<Pick<CurriculumRow, "classId" | "title" | "stage" | "subject" | "date">>,
  ) => {
    const nextTitle =
      patch.title !== undefined ? patch.title.trim() : row.title;
    if (nextTitle.length === 0) {
      toast({
        title: "Title required",
        description: "Curriculum rows need a lesson title.",
        variant: "destructive",
      });
      return;
    }

    const nextClassId = patch.classId !== undefined ? patch.classId.trim() : row.classId;
    if (nextClassId.length === 0) {
      toast({
        title: "Class required",
        description: "Assign a class or group to each curriculum row.",
        variant: "destructive",
      });
      return;
    }

    const normalizeNullable = (value: string | null | undefined) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const nextStage = normalizeNullable(patch.stage ?? row.stage ?? undefined);
    const nextSubject = normalizeNullable(patch.subject ?? row.subject ?? undefined);
    const nextDate = patch.date === undefined ? row.date : patch.date;

    if (
      nextTitle === row.title &&
      nextClassId === row.classId &&
      (nextStage ?? null) === (row.stage ?? null) &&
      (nextSubject ?? null) === (row.subject ?? null) &&
      nextDate === row.date
    ) {
      return;
    }

    updateItemMutation.mutate({
      id: row.id,
      classId: nextClassId,
      title: nextTitle,
      stage: nextStage ?? null,
      subject: nextSubject ?? null,
      date: nextDate ?? null,
    });
  };

  const openPresentationEditor = (row: CurriculumRow) => {
    setPresentationEditor({
      open: true,
      item: row,
      value: row.presentationUrl ?? "",
      linkId: row.lessonLinkId,
      lessonPlanId: row.lessonPlanId,
    });
  };

  const handleSavePresentation = () => {
    if (!presentationEditor.item) {
      return;
    }

    presentationMutation.mutate({
      curriculumItemId: presentationEditor.item.id,
      linkId: presentationEditor.linkId,
      lessonPlanId: presentationEditor.lessonPlanId,
      url: presentationEditor.value.trim() ? presentationEditor.value.trim() : null,
    });
  };

  const handleDelete = (row: CurriculumRow) => {
    deleteMutation.mutate({ itemId: row.id, linkId: row.lessonLinkId });
  };

  return (
    <div className={wrapperClassName}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Curriculum planner</h1>
          <p className="text-muted-foreground max-w-2xl">
            Paste lesson titles from Excel or Google Sheets to instantly build a curriculum grid.
            Assign classes, schedule dates, and jump directly into the lesson builder with one click.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Add curriculum rows
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Paste your curriculum titles</DialogTitle>
              <DialogDescription>
                Copy lessons from a spreadsheet. We&apos;ll create a row for each line and apply your defaults.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="curriculum-class">Class or group</Label>
                <Input
                  id="curriculum-class"
                  value={defaultClassId}
                  onChange={event => setDefaultClassId(event.target.value)}
                  placeholder="e.g. Grade 5A"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="curriculum-stage">Default stage (optional)</Label>
                <Input
                  id="curriculum-stage"
                  value={defaultStage}
                  onChange={event => setDefaultStage(event.target.value)}
                  placeholder="Primary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="curriculum-subject">Default subject (optional)</Label>
                <Input
                  id="curriculum-subject"
                  value={defaultSubject}
                  onChange={event => setDefaultSubject(event.target.value)}
                  placeholder="Science"
                />
              </div>
              <div className="grid gap-2">
                <Label>Default date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !defaultDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {defaultDate ? format(defaultDate, "PPP") : "Pick a start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={defaultDate ?? undefined}
                      onSelect={setDefaultDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="curriculum-paste">Paste titles</Label>
                <Textarea
                  id="curriculum-paste"
                  placeholder={`Stage\tSubject\tLesson title\tDate\nStage\tSubject\tAnother lesson`}
                  rows={6}
                  value={pastedTitles}
                  onChange={event => setPastedTitles(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddCurriculum} disabled={createItemsMutation.isPending}>
                {createItemsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Create rows
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {classesError ? (
        <Alert variant="destructive">
          <AlertTitle>We couldn&apos;t load your classes</AlertTitle>
          <AlertDescription>
            {classesError.message || "Sign in to your account so we can show your classes."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Curriculum board</CardTitle>
            <CardDescription>
              Edit directly in the table. Changes save automatically when you leave a field.
            </CardDescription>
          </div>
          {(curriculumItemsQuery.isFetching || curriculumLinksQuery.isFetching) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Refreshing
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-10 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-lg font-semibold">No curriculum yet</p>
                <p className="text-sm text-muted-foreground">
                  Paste lessons from your spreadsheet or add them manually to start planning.
                </p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add your first lessons
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Class</TableHead>
                    <TableHead className="min-w-[140px]">Stage</TableHead>
                    <TableHead className="min-w-[140px]">Subject</TableHead>
                    <TableHead className="min-w-[220px]">Lesson title</TableHead>
                    <TableHead className="min-w-[160px]">Date</TableHead>
                    <TableHead className="min-w-[200px]">Lesson plan</TableHead>
                    <TableHead className="min-w-[200px]">Presentation</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Input
                          key={`${row.id}-class-${row.classId}`}
                          defaultValue={row.classId}
                          onBlur={event => handleFieldChange(row, { classId: event.target.value })}
                          onKeyDown={event => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur();
                            }
                          }}
                          placeholder="Class name"
                        />
                        {classesById.has(row.classId) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Linked to class: {classesById.get(row.classId)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          key={`${row.id}-stage-${row.stage ?? ""}`}
                          defaultValue={row.stage ?? ""}
                          placeholder="Stage"
                          onBlur={event => handleFieldChange(row, { stage: event.target.value })}
                          onKeyDown={event => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          key={`${row.id}-subject-${row.subject ?? ""}`}
                          defaultValue={row.subject ?? ""}
                          placeholder="Subject"
                          onBlur={event => handleFieldChange(row, { subject: event.target.value })}
                          onKeyDown={event => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          key={`${row.id}-title-${row.title}`}
                          defaultValue={row.title}
                          placeholder="Lesson title"
                          onBlur={event => handleFieldChange(row, { title: event.target.value })}
                          onKeyDown={event => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !row.date && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {row.date ? format(new Date(row.date), "PPP") : "Set date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={row.date ? new Date(row.date) : undefined}
                              onSelect={date =>
                                handleFieldChange(row, {
                                  date: date ? date.toISOString() : null,
                                })
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant={row.lessonPlanId ? "outline" : "default"}
                            onClick={() => createLessonPlanMutation.mutate(row)}
                            disabled={createLessonPlanMutation.isPending}
                          >
                            {createLessonPlanMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Opening builder
                              </>
                            ) : row.lessonPlanId ? (
                              <>Open lesson plan</>
                            ) : (
                              <>Create lesson plan</>
                            )}
                          </Button>
                          {row.lessonStatus ? (
                            <Badge variant="secondary" className="w-max">
                              {row.lessonStatus === "draft" ? "Draft" : row.lessonStatus}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => openPresentationEditor(row)}>
                            {row.presentationUrl ? "View presentation" : "Add presentation"}
                          </Button>
                          {row.presentationUrl ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(row.presentationUrl ?? "", "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Open presentation link</span>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete row</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this curriculum row?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone and will remove the lesson from your planning board.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(row)}
                                disabled={deleteMutation.isPending}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={presentationEditor.open}
        onOpenChange={open =>
          setPresentationEditor(prev => ({
            open,
            item: open ? prev.item : null,
            value: open ? prev.value : "",
            linkId: open ? prev.linkId : null,
            lessonPlanId: open ? prev.lessonPlanId : null,
          }))
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Presentation link</DialogTitle>
            <DialogDescription>
              Paste a link to your Google Slides, PowerPoint, or any presentation to launch it quickly before class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid gap-2">
              <Label htmlFor="presentation-url">URL</Label>
              <Input
                id="presentation-url"
                placeholder="https://"
                value={presentationEditor.value}
                onChange={event =>
                  setPresentationEditor(prev => ({ ...prev, value: event.target.value }))
                }
              />
            </div>
            {presentationEditor.item?.lessonPlanId ? (
              <Alert>
                <AlertDescription>
                  Linked plan: {presentationEditor.item.lessonPlanId}. We&apos;ll keep the presentation connected to this lesson.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  No lesson plan yet. We&apos;ll create a placeholder link so you can save the presentation for later.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPresentationEditor({
              open: false,
              item: null,
              value: "",
              linkId: null,
              lessonPlanId: null,
            })}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePresentation} disabled={presentationMutation.isPending}>
              {presentationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumPage;
