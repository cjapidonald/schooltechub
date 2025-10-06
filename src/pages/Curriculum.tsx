import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, isValid, parse } from "date-fns";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  CalendarIcon,
  ClipboardList,
  ExternalLink,
  ArrowUpDown,
  GripVertical,
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const ORDER_STORAGE_KEY = "curriculum-board-order";
type StatusOptionValue = "needs-plan" | CurriculumLessonLink["status"];

const STATUS_OPTIONS: Array<{
  value: StatusOptionValue;
  label: string;
  helper: string;
}> = [
  {
    value: "needs-plan",
    label: "Needs plan",
    helper: "Start a lesson plan to begin planning.",
  },
  {
    value: "draft",
    label: "Drafting",
    helper: "Lesson plan is in progress.",
  },
  {
    value: "published",
    label: "Ready to teach",
    helper: "Lesson is published and ready.",
  },
  {
    value: "archived",
    label: "Archived",
    helper: "Lesson kept for reference.",
  },
];

const getStatusMeta = (row: CurriculumRow) => {
  const hasPlan = Boolean(row.lessonPlanId);
  const hasPresentation = Boolean(row.presentationUrl);
  const hasDate = Boolean(row.date);

  if (!hasPlan) {
    const base = 15 + (hasDate ? 10 : 0) + (hasPresentation ? 5 : 0);
    return {
      value: "needs-plan" as const,
      label: "Needs lesson plan",
      description: "Create a lesson plan draft to unlock more actions.",
      progress: Math.min(base, 40),
      badgeVariant: "outline" as const,
    };
  }

  switch (row.lessonStatus) {
    case "published":
      return {
        value: "published" as const,
        label: "Ready to teach",
        description: hasPresentation ? "Slides are attached and ready." : "Consider attaching your slides.",
        progress: 100,
        badgeVariant: "default" as const,
      };
    case "archived":
      return {
        value: "archived" as const,
        label: "Archived",
        description: "Stored for reference.",
        progress: 25,
        badgeVariant: "secondary" as const,
      };
    case "draft":
    default:
      return {
        value: "draft" as const,
        label: "Draft in progress",
        description: hasPresentation ? "Slides attached—finish the plan when ready." : "Add resources and publish when finished.",
        progress: Math.min(70 + (hasPresentation ? 10 : 0) + (hasDate ? 5 : 0), 95),
        badgeVariant: "secondary" as const,
      };
  }
};

interface SortableCurriculumTableRowProps {
  row: CurriculumRow;
  classesById: Map<string, string>;
  onFieldChange: (
    row: CurriculumRow,
    patch: Partial<Pick<CurriculumRow, "classId" | "title" | "stage" | "subject" | "date">>,
  ) => void;
  onStatusChange: (value: StatusOptionValue) => void;
  onPlanLesson: () => void;
  onPresentation: () => void;
  onOpenPresentationLink: () => void;
  onDelete: () => void;
  statusMeta: ReturnType<typeof getStatusMeta>;
  statusUpdating: boolean;
  isCreatingLessonPlan: boolean;
  isDeleting: boolean;
}

const SortableCurriculumTableRow = ({
  row,
  classesById,
  onFieldChange,
  onStatusChange,
  onPlanLesson,
  onPresentation,
  onOpenPresentationLink,
  onDelete,
  statusMeta,
  statusUpdating,
  isCreatingLessonPlan,
  isDeleting,
}: SortableCurriculumTableRowProps) => {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const relativeDate = row.date ? formatDistanceToNow(new Date(row.date), { addSuffix: true }) : null;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={isDragging ? "dragging" : undefined}
      className={cn(isDragging ? "bg-muted/60 shadow-sm" : undefined)}
    >
      <TableCell className="align-top">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:text-foreground"
          aria-label={`Reorder ${row.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="align-top">
        <Input
          key={`${row.id}-class-${row.classId}`}
          defaultValue={row.classId}
          onBlur={event => onFieldChange(row, { classId: event.target.value })}
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
      <TableCell className="align-top">
        <Input
          key={`${row.id}-stage-${row.stage ?? ""}`}
          defaultValue={row.stage ?? ""}
          placeholder="Stage"
          onBlur={event => onFieldChange(row, { stage: event.target.value })}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </TableCell>
      <TableCell className="align-top">
        <Input
          key={`${row.id}-subject-${row.subject ?? ""}`}
          defaultValue={row.subject ?? ""}
          placeholder="Subject"
          onBlur={event => onFieldChange(row, { subject: event.target.value })}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </TableCell>
      <TableCell className="align-top">
        <Input
          key={`${row.id}-title-${row.title}`}
          defaultValue={row.title}
          placeholder="Lesson title"
          onBlur={event => onFieldChange(row, { title: event.target.value })}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !row.date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {row.date ? format(new Date(row.date), "PPP") : "Set date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={row.date ? new Date(row.date) : undefined}
                onSelect={date => onFieldChange(row, { date: date ? date.toISOString() : null })}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">{relativeDate ?? "No date assigned"}</p>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{statusMeta.label}</span>
            <span>{statusMeta.progress}%</span>
          </div>
          <Progress value={statusMeta.progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{statusMeta.description}</p>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <Select value={statusMeta.value} onValueChange={onStatusChange} disabled={statusUpdating}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.value === "needs-plan" && !row.lessonPlanId && !row.lessonLinkId}
              >
                <div className="flex flex-col text-left">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.helper}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant={statusMeta.badgeVariant} className="mt-2 w-max">
          {statusMeta.label}
        </Badge>
      </TableCell>
      <TableCell className="align-top">
        <div className="flex flex-col gap-2">
          <Button variant={row.lessonPlanId ? "outline" : "default"} onClick={onPlanLesson} disabled={isCreatingLessonPlan}>
            {isCreatingLessonPlan ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening builder
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
      <TableCell className="align-top">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onPresentation}>
            {row.presentationUrl ? "View presentation" : "Add presentation"}
          </Button>
          {row.presentationUrl ? (
            <Button variant="ghost" size="icon" onClick={onOpenPresentationLink}>
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open presentation link</span>
            </Button>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-right align-top">
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
              <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
};

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

const CurriculumPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { classes, isLoading: isLoadingClasses, error: classesError } = useMyClasses();

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

  const [rowOrder, setRowOrder] = useState<string[]>([]);
  const [orderedRows, setOrderedRows] = useState<CurriculumRow[]>([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRowOrder(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch (error) {
      console.warn("Unable to read stored curriculum order", error);
    }
  }, []);

  useEffect(() => {
    setRowOrder(prev => {
      if (rows.length === 0) {
        return [];
      }

      const idsInRows = new Set(rows.map(row => row.id));
      const filtered = prev.filter(id => idsInRows.has(id));
      const missing = rows
        .map(row => row.id)
        .filter(id => !filtered.includes(id));

      if (filtered.length === 0 && missing.length === 0) {
        return rows.map(row => row.id);
      }

      return [...filtered, ...missing];
    });
  }, [rows]);

  useEffect(() => {
    if (rows.length === 0) {
      setOrderedRows([]);
      return;
    }

    if (rowOrder.length === 0) {
      setOrderedRows(rows);
      return;
    }

    const rowMap = new Map(rows.map(row => [row.id, row] as const));
    const next: CurriculumRow[] = [];

    for (const id of rowOrder) {
      const match = rowMap.get(id);
      if (match) {
        next.push(match);
        rowMap.delete(id);
      }
    }

    for (const remaining of rowMap.values()) {
      next.push(remaining);
    }

    setOrderedRows(next);
  }, [rowOrder, rows]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (rowOrder.length === 0) {
      window.localStorage.removeItem(ORDER_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(rowOrder));
  }, [rowOrder]);

  const updateLocalRow = (id: string, patch: Partial<CurriculumRow>) => {
    setOrderedRows(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)));
  };

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

      const link = await upsertCurriculumLessonLink({
        id: row.lessonLinkId ?? undefined,
        curriculumItemId: row.id,
        lessonPlanId: plan.id,
        viewUrl: row.presentationUrl ?? null,
        status: "draft",
      });

      return { plan, link, rowId: row.id };
    },
    onSuccess: ({ plan, link, rowId }) => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum-lesson-links"] });
      toast({
        title: "Lesson plan created",
        description: "Opening the lesson builder so you can finish planning.",
      });
      updateLocalRow(rowId, {
        lessonPlanId: link.lessonPlanId,
        lessonLinkId: link.id,
        lessonStatus: link.status,
      });
      navigate(`/lesson-builder?id=${encodeURIComponent(plan.id)}`);
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
    onSuccess: (link, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum-lesson-links"] });
      toast({ title: "Presentation link saved" });
      updateLocalRow(variables.curriculumItemId, {
        presentationUrl: variables.url,
        lessonLinkId: link.id,
        lessonPlanId: link.lessonPlanId,
        lessonStatus: link.status ?? null,
      });
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

  const statusMutation = useMutation({
    mutationFn: async (input: { row: CurriculumRow; status: StatusOptionValue }) => {
      if (input.status === "needs-plan") {
        if (input.row.lessonLinkId) {
          await deleteCurriculumLessonLink(input.row.lessonLinkId);
        }

        return {
          lessonLinkId: null,
          lessonPlanId: null,
          lessonStatus: null,
          presentationUrl: null,
        } satisfies Partial<CurriculumRow>;
      }

      const link = await upsertCurriculumLessonLink({
        id: input.row.lessonLinkId ?? undefined,
        curriculumItemId: input.row.id,
        lessonPlanId: input.row.lessonPlanId ?? `plan-${input.row.id}`,
        status: input.status,
        viewUrl: input.row.presentationUrl ?? undefined,
      });

      return {
        lessonLinkId: link.id,
        lessonPlanId: link.lessonPlanId,
        lessonStatus: link.status,
        presentationUrl: link.viewUrl ?? input.row.presentationUrl ?? null,
      } satisfies Partial<CurriculumRow>;
    },
    onMutate: input => {
      setStatusUpdatingId(input.row.id);
      if (input.status === "needs-plan") {
        updateLocalRow(input.row.id, {
          lessonLinkId: null,
          lessonPlanId: null,
          lessonStatus: null,
          presentationUrl: null,
        });
      }
    },
    onSuccess: (patch, variables) => {
      updateLocalRow(variables.row.id, patch);
      toast({
        title: "Status updated",
        description: `Marked "${STATUS_OPTIONS.find(option => option.value === variables.status)?.label ?? variables.status}" for this lesson.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["curriculum-lesson-links"] });
    },
    onError: (error) => {
      const description = error instanceof Error ? error.message : "Unable to update the curriculum status.";
      toast({
        title: "Could not update status",
        description,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setStatusUpdatingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (input: { itemId: string; linkId: string | null }) => {
      await deleteCurriculumItem(input.itemId);
      if (input.linkId) {
        await deleteCurriculumLessonLink(input.linkId);
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum-items"] });
      void queryClient.invalidateQueries({ queryKey: ["curriculum-lesson-links"] });
      toast({ title: "Curriculum entry removed" });
      setOrderedRows(prev => prev.filter(item => item.id !== variables.itemId));
      setRowOrder(prev => prev.filter(id => id !== variables.itemId));
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

  const hasRows = orderedRows.length > 0;

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
    updateLocalRow(row.id, {
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

  const handleStatusChange = (row: CurriculumRow, value: StatusOptionValue) => {
    if (statusMutation.isPending && statusUpdatingId === row.id) {
      return;
    }

    const current = getStatusMeta(row).value;
    if (value === current && !(value === "needs-plan" && (row.lessonPlanId || row.lessonLinkId))) {
      return;
    }

    statusMutation.mutate({ row, status: value });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedRows.findIndex(row => row.id === active.id);
    const newIndex = orderedRows.findIndex(row => row.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const next = arrayMove(orderedRows, oldIndex, newIndex);
    setOrderedRows(next);
    setRowOrder(next.map(item => item.id));
  };

  const handleResetOrder = () => {
    if (rows.length === 0) {
      return;
    }

    const sorted = [...rows].sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (a.date) {
        return -1;
      }
      if (b.date) {
        return 1;
      }
      return a.title.localeCompare(b.title);
    });

    setOrderedRows(sorted);
    setRowOrder(sorted.map(item => item.id));
  };

  const planningSummary = useMemo(() => {
    const total = orderedRows.length;
    let needsPlan = 0;
    let drafting = 0;
    let ready = 0;
    let archived = 0;

    for (const row of orderedRows) {
      const meta = getStatusMeta(row);
      switch (meta.value) {
        case "needs-plan":
          needsPlan += 1;
          break;
        case "published":
          ready += 1;
          break;
        case "archived":
          archived += 1;
          break;
        case "draft":
        default:
          drafting += 1;
          break;
      }
    }

    const readyPercent = total === 0 ? 0 : Math.round((ready / total) * 100);
    const draftingPercent = total === 0 ? 0 : Math.round((drafting / total) * 100);

    return { total, needsPlan, drafting, ready, archived, readyPercent, draftingPercent };
  }, [orderedRows]);

  const nextUpcoming = useMemo(() => {
    const upcoming = orderedRows
      .filter(row => Boolean(row.date))
      .map(row => {
        const date = row.date ? new Date(row.date) : null;
        return { row, date };
      })
      .filter(
        (item): item is { row: CurriculumRow; date: Date } =>
          Boolean(item.date) && !Number.isNaN(item.date.getTime()),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcoming[0] ?? null;
  }, [orderedRows]);

  return (
    <div className="container py-10 space-y-8">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Curriculum readiness</CardTitle>
            <CardDescription>
              Track lesson plan progress and spot lessons that still need attention.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{planningSummary.readyPercent}% ready</span>
              <span>
                {planningSummary.ready} of {planningSummary.total} lessons ready
              </span>
            </div>
            <Progress value={planningSummary.readyPercent} className="h-2" />
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase text-muted-foreground">Needs plan</p>
                <p className="mt-1 text-lg font-semibold">{planningSummary.needsPlan}</p>
                <p className="text-xs text-muted-foreground">
                  Drag rows to prioritize and convert them into lesson plans.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase text-muted-foreground">Drafting</p>
                <p className="mt-1 text-lg font-semibold">{planningSummary.drafting}</p>
                <p className="text-xs text-muted-foreground">
                  {planningSummary.draftingPercent}% of your curriculum is currently being authored.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase text-muted-foreground">Ready to teach</p>
                <p className="mt-1 text-lg font-semibold">{planningSummary.ready}</p>
                <p className="text-xs text-muted-foreground">
                  Publish lesson plans once resources and slides are attached.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase text-muted-foreground">Archived</p>
                <p className="mt-1 text-lg font-semibold">{planningSummary.archived}</p>
                <p className="text-xs text-muted-foreground">
                  Keep a record of lessons that are no longer active this term.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Upcoming lesson</CardTitle>
            <CardDescription>
              {nextUpcoming
                ? "Stay ahead by reviewing the next scheduled lesson."
                : "Assign dates to see what is coming up next."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextUpcoming ? (
              <>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{nextUpcoming.row.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {nextUpcoming.row.classId ? classesById.get(nextUpcoming.row.classId) ?? "" : "Unassigned class"}
                  </p>
                </div>
                <Badge variant="secondary" className="w-max">
                  {format(new Date(nextUpcoming.date), "PPP")} • {formatDistanceToNow(nextUpcoming.date, { addSuffix: true })}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {getStatusMeta(nextUpcoming.row).label}. Use the quick actions in the table to finish preparations.
                </p>
              </>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>No lessons have a scheduled date yet.</p>
                <p>Add a date to any row to see it highlighted here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Curriculum board</CardTitle>
            <CardDescription>
              Edit directly in the table. Changes save automatically when you leave a field.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {hasRows ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                Drag lessons to reshape your scope and sequence
              </div>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOrder}
              disabled={!hasRows}
              className="sm:w-auto"
            >
              <ArrowUpDown className="mr-2 h-4 w-4" /> Reset order
            </Button>
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
          ) : !hasRows ? (
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedRows.map(row => row.id)} strategy={verticalListSortingStrategy}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[52px]">
                          <span className="sr-only">Reorder</span>
                        </TableHead>
                        <TableHead className="min-w-[160px]">Class</TableHead>
                        <TableHead className="min-w-[120px]">Stage</TableHead>
                        <TableHead className="min-w-[140px]">Subject</TableHead>
                        <TableHead className="min-w-[240px]">Lesson title</TableHead>
                        <TableHead className="min-w-[180px]">Date</TableHead>
                        <TableHead className="min-w-[220px]">Progress</TableHead>
                        <TableHead className="min-w-[200px]">Status</TableHead>
                        <TableHead className="min-w-[200px]">Lesson plan</TableHead>
                        <TableHead className="min-w-[200px]">Presentation</TableHead>
                        <TableHead className="w-[60px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderedRows.map(row => {
                        const statusMeta = getStatusMeta(row);
                        const isStatusUpdating = statusUpdatingId === row.id && statusMutation.isPending;
                        const isCreatingLesson =
                          createLessonPlanMutation.isPending &&
                          createLessonPlanMutation.variables?.id === row.id;
                        const isDeleting =
                          deleteMutation.isPending && deleteMutation.variables?.itemId === row.id;

                        return (
                          <SortableCurriculumTableRow
                            key={row.id}
                            row={row}
                            classesById={classesById}
                            onFieldChange={handleFieldChange}
                            onStatusChange={value => handleStatusChange(row, value)}
                            onPlanLesson={() => createLessonPlanMutation.mutate(row)}
                            onPresentation={() => openPresentationEditor(row)}
                            onOpenPresentationLink={() =>
                              row.presentationUrl ? window.open(row.presentationUrl, "_blank") : undefined
                            }
                            onDelete={() => handleDelete(row)}
                            statusMeta={statusMeta}
                            statusUpdating={isStatusUpdating}
                            isCreatingLessonPlan={isCreatingLesson}
                            isDeleting={Boolean(isDeleting)}
                          />
                        );
                      })}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
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
