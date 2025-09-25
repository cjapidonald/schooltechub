import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, parseISO, isValid } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listClassLessonPlans,
  type ClassLessonPlanLinkSummary,
  linkPlanToClass,
} from "@/lib/classes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AttachLessonPlanDialog } from "@/components/classes/AttachLessonPlanDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar } from "@/components/ui/calendar";

const formatDisplayDate = (value: string | null) => {
  if (!value) {
    return "No scheduled date";
  }

  try {
    const parsed = parseISO(value);
    if (!isValid(parsed)) {
      return "No scheduled date";
    }
    return `Scheduled for ${format(parsed, "PPP")}`;
  } catch {
    return "No scheduled date";
  }
};

export interface ClassLessonPlanViewerProps {
  classId: string;
  onUnlink: (lessonPlanId: string) => void;
  isUnlinking?: boolean;
  unlinkingPlanId?: string | null;
  onPlanCountChange?: (count: number) => void;
}

export function ClassLessonPlanViewer({
  classId,
  onUnlink,
  isUnlinking = false,
  unlinkingPlanId = null,
  onPlanCountChange,
}: ClassLessonPlanViewerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarDateStrings, setCalendarDateStrings] = useState<string[]>([]);
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
  const [linkingPlanId, setLinkingPlanId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    setSelectedDate(undefined);
    setCalendarDateStrings([]);
    setIsAttachDialogOpen(false);
    setLinkingPlanId(null);
  }, [classId]);

  const appliedFilters = useMemo(() => {
    if (!selectedDate) {
      return {};
    }

    const formatted = format(selectedDate, "yyyy-MM-dd");
    return { from: formatted, to: formatted };
  }, [selectedDate]);

  const { data, error, isPending, isFetching, refetch } = useQuery<
    ClassLessonPlanLinkSummary[],
    Error
  >({
    queryKey: ["class-lesson-plans", classId, appliedFilters.from ?? null, appliedFilters.to ?? null],
    enabled: Boolean(classId),
    queryFn: async () => {
      return listClassLessonPlans(classId, appliedFilters);
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const plans = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  useEffect(() => {
    setCalendarDateStrings(prev => {
      const next = new Set(prev);
      plans.forEach(plan => {
        if (plan.date) {
          next.add(plan.date.slice(0, 10));
        }
      });
      return Array.from(next).sort();
    });
  }, [plans]);

  useEffect(() => {
    if (!onPlanCountChange) {
      return;
    }

    onPlanCountChange(plans.length);
  }, [plans, onPlanCountChange]);
  const isRefetching = isFetching && !isPending;

  const handleCalendarSelect = (date?: Date) => {
    if (!date) {
      setSelectedDate(undefined);
      return;
    }

    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(undefined);
      return;
    }

    setSelectedDate(date);
  };

  const handleClearFilter = () => {
    setSelectedDate(undefined);
  };

  const linkPlanMutation = useMutation({
    mutationFn: async (lessonPlanId: string) => {
      await linkPlanToClass(lessonPlanId, classId);
    },
    onMutate: (lessonPlanId: string) => {
      setLinkingPlanId(lessonPlanId);
    },
    onSuccess: () => {
      toast({
        title: t.account.toast.attachedToClass,
        description: t.account.toast.attachedToClassDescription,
      });
      setIsAttachDialogOpen(false);
      void refetch();
      queryClient.invalidateQueries({ queryKey: ["class-lesson-plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-classes"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to attach lesson plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLinkingPlanId(null);
    },
  });

  const handleAttachPlan = (lessonPlanId: string) => {
    if (linkPlanMutation.isPending) {
      return;
    }
    linkPlanMutation.mutate(lessonPlanId);
  };

  const highlightedDates = useMemo(() => {
    return calendarDateStrings
      .map(dateString => {
        try {
          const parsed = parseISO(dateString);
          return isValid(parsed) ? parsed : null;
        } catch {
          return null;
        }
      })
      .filter((value): value is Date => value !== null);
  }, [calendarDateStrings]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-background/80 p-4 shadow-sm">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleCalendarSelect}
          modifiers={{ hasPlan: highlightedDates }}
          modifiersClassNames={{
            hasPlan:
              "relative after:absolute after:-bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary after:content-['']",
          }}
          className="mx-auto"
        />
        <p className="mt-3 text-center text-xs text-muted-foreground">Select a date to filter plans.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleClearFilter}
            disabled={!selectedDate}
          >
            Show all plans
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => setIsAttachDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Attach existing plan
          </Button>
        </div>
      </div>
      {isRefetching ? <p className="text-xs text-muted-foreground">Updating results…</p> : null}

      <ScrollArea className="h-[60vh] pr-2">
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load linked plans</AlertTitle>
            <AlertDescription>
              {error.message}
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : plans.length > 0 ? (
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{plan.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDisplayDate(plan.date)}</p>
                    {plan.duration ? (
                      <p className="text-sm text-muted-foreground">Duration: {plan.duration}</p>
                    ) : null}
                    {plan.addedAt ? (
                      <p className="mt-2 text-xs text-muted-foreground/80">
                        Linked on {format(new Date(plan.addedAt), "PPP p")}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUnlink(plan.id)}
                    disabled={isUnlinking && unlinkingPlanId === plan.id}
                  >
                    {isUnlinking && unlinkingPlanId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Unlink className="mr-2 h-4 w-4" />
                        Unlink
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            <p>No lesson plans match the current date filter.</p>
            <p className="mt-2">Clear the filter or attach an existing plan using the button above.</p>
          </div>
        )}
      </ScrollArea>
      <AttachLessonPlanDialog
        open={isAttachDialogOpen}
        onOpenChange={setIsAttachDialogOpen}
        onSelect={handleAttachPlan}
        isLinking={linkPlanMutation.isPending}
        linkingPlanId={linkingPlanId}
        disabledPlanIds={plans.map(plan => plan.id)}
      />
    </div>
  );
}

export default ClassLessonPlanViewer;
