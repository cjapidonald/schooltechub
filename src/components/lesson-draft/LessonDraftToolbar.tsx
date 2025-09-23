import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarIcon, ChevronDown, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { isBlank } from "@/lib/isBlank";
import { ClassDataError, listMyClasses, linkPlanToClass } from "@/lib/classes";
import {
  LessonPlanDataError,
  exportPlanToDocx,
  exportPlanToPDF,
  saveDraft,
} from "@/lib/lessonPlans";
import type { LessonPlanDraft } from "@/lib/lessonPlans";
import { useLessonDraftStore } from "@/stores/lessonDraft";
import type { Class } from "@/types/platform";

const DATE_DISPLAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const formatDateForStorage = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseStoredDate = (value?: string): Date | null => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const [year, month, day] = value.split("-").map(part => Number.parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const downloadBlob = (blob: Blob, filename: string) => {
  if (typeof window === "undefined") {
    throw new Error("Downloads are not supported in this environment.");
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const buildFilename = (title: string, extension: "pdf" | "docx") => {
  const safeTitle = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const base = safeTitle.length > 0 ? safeTitle : "lesson-plan";
  return `${base}.${extension}`;
};

const RELATED_QUERY_KEYS = new Set(["lesson-plans", "lesson-plan", "classes", "class", "dashboard", "enrollments", "available-classes"]);

export const LessonDraftToolbar = () => {
  const draftDate = useLessonDraftStore(state => state.draft.date);
  const setField = useLessonDraftStore(state => state.setField);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isSavingToClass, setIsSavingToClass] = useState(false);
  const [activeExport, setActiveExport] = useState<"pdf" | "docx" | null>(null);

  useEffect(() => {
    if (!draftDate) {
      setField("date", formatDateForStorage(new Date()));
    }
  }, [draftDate, setField]);

  const classesQuery = useQuery<Class[], Error>({
    queryKey: ["builder", "classes"],
    queryFn: () => listMyClasses(),
    staleTime: 60 * 1000,
    retry: false,
  });

  const selectedDate = useMemo(() => parseStoredDate(draftDate ?? undefined), [draftDate]);
  const formattedDate = selectedDate ? DATE_DISPLAY_FORMAT.format(selectedDate) : "Select a date";

  const setRemoteMetadata = useCallback((planId: string, steps: { id: string; position: number | null }[]) => {
    const remoteStepByPosition = new Map<number, string>();
    steps.forEach(step => {
      const position = typeof step.position === "number" ? step.position : undefined;
      if (position !== undefined) {
        remoteStepByPosition.set(position, step.id);
      }
    });

    useLessonDraftStore.setState(state => ({
      draft: {
        ...state.draft,
        remotePlanId: planId,
        steps: state.draft.steps.map((step, index) => ({
          ...step,
          remoteId: remoteStepByPosition.get(index) ?? step.remoteId ?? null,
        })),
      },
    }));
  }, []);

  const persistDraft = useCallback(async () => {
    const { draft } = useLessonDraftStore.getState();
    const normalizedTitle = !isBlank(draft.title) ? draft.title!.trim() : "Untitled lesson";

    const payload: LessonPlanDraft = {
      id: draft.remotePlanId ?? undefined,
      title: normalizedTitle,
      date: draft.date ?? null,
      duration: !isBlank(draft.duration) ? draft.duration : null,
      grouping: !isBlank(draft.grouping) ? draft.grouping : null,
      deliveryMode: !isBlank(draft.deliveryMode) ? draft.deliveryMode : null,
      logoUrl: !isBlank(draft.logoUrl) ? draft.logoUrl : null,
      steps: draft.steps.map((step, index) => ({
        id: step.remoteId ?? undefined,
        position: index,
        title: step.title.trim().length > 0 ? step.title.trim() : `Step ${index + 1}`,
        notes: !isBlank(step.notes) ? step.notes!.trim() : null,
        resourceIds: step.resourceIds.filter(resourceId => typeof resourceId === "string" && resourceId.trim().length > 0),
      })),
    };

    const result = await saveDraft(payload);
    setRemoteMetadata(result.plan.id, result.steps.map(step => ({ id: step.id, position: step.position })));
    return result;
  }, [setRemoteMetadata]);

  const invalidateRelatedQueries = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: query => {
        if (!Array.isArray(query.queryKey)) {
          return false;
        }
        return query.queryKey.some(part => typeof part === "string" && RELATED_QUERY_KEYS.has(part));
      },
    });
  }, [queryClient]);

  const handleDateSelect = (value: Date | undefined) => {
    if (value) {
      setField("date", formatDateForStorage(value));
    }
    setIsDateOpen(false);
  };

  const handleExport = async (format: "pdf" | "docx") => {
    setActiveExport(format);
    try {
      const { plan } = await persistDraft();
      const blob = format === "pdf" ? await exportPlanToPDF(plan.id) : await exportPlanToDocx(plan.id);
      downloadBlob(blob, buildFilename(plan.title, format));
      toast({ description: `${format.toUpperCase()} download started.` });
    } catch (error) {
      const message =
        error instanceof LessonPlanDataError || error instanceof ClassDataError || error instanceof Error
          ? error.message
          : "Please try again.";
      toast({
        title: format === "pdf" ? "Unable to export PDF" : "Unable to export DOCX",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActiveExport(null);
    }
  };

  const handleSaveToClass = async (classId: string) => {
    setIsSavingToClass(true);
    try {
      const { plan } = await persistDraft();
      await linkPlanToClass(plan.id, classId);
      const classes = classesQuery.data ?? [];
      const targetClass = classes.find(item => item.id === classId);
      toast({
        title: "Lesson saved",
        description: targetClass ? `Linked to ${targetClass.title}.` : "Lesson linked to the selected class.",
      });
      invalidateRelatedQueries();
    } catch (error) {
      const message =
        error instanceof ClassDataError || error instanceof LessonPlanDataError || error instanceof Error
          ? error.message
          : "Please try again.";
      toast({
        title: "Unable to save lesson",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSavingToClass(false);
    }
  };

  const classes = classesQuery.data ?? [];
  const classesError = classesQuery.error;
  const isLoadingClasses = classesQuery.isLoading;
  const isExporting = activeExport !== null;

  return (
    <div className="rounded-lg border border-border/60 bg-background/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Lesson date</p>
          <p className="text-sm text-muted-foreground">Schedule when you plan to teach this lesson.</p>
        </div>
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal sm:w-56"
              aria-label="Select lesson date"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>{formattedDate}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={selectedDate ?? undefined} onSelect={handleDateSelect} initialFocus />
          </PopoverContent>
        </Popover>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleExport("pdf")}
          disabled={isSavingToClass || isExporting}
        >
          {activeExport === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Download as PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleExport("docx")}
          disabled={isSavingToClass || isExporting}
        >
          {activeExport === "docx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Download as DOCX
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" disabled={isSavingToClass || isExporting}>
              {isSavingToClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save to
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Select a class</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoadingClasses ? <DropdownMenuItem disabled>Loading classes…</DropdownMenuItem> : null}
            {!isLoadingClasses && classesError ? (
              <DropdownMenuItem disabled>
                {classesError instanceof ClassDataError ? classesError.message : "Unable to load classes."}
              </DropdownMenuItem>
            ) : null}
            {!isLoadingClasses && !classesError && classes.length === 0 ? (
              <DropdownMenuItem disabled>No classes yet</DropdownMenuItem>
            ) : null}
            {!isLoadingClasses && !classesError
              ? classes.map(cls => (
                  <DropdownMenuItem key={cls.id} onSelect={() => void handleSaveToClass(cls.id)}>
                    {cls.title}
                  </DropdownMenuItem>
                ))
              : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default LessonDraftToolbar;
