import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, RotateCcw, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AttachLessonPlanDialog } from "@/components/classes/AttachLessonPlanDialog";
import { useLanguage } from "@/contexts/LanguageContext";

const formatDateInputValue = (value: Date) => format(value, "yyyy-MM-dd");

const formatDisplayDate = (value: string | null) => {
  if (!value) {
    return "No scheduled date";
  }

  try {
    return `Scheduled for ${format(new Date(value), "PPP")}`;
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
  const [dateRange, setDateRange] = useState(() => {
    const today = formatDateInputValue(new Date());
    return { from: today, to: today };
  });
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
  const [linkingPlanId, setLinkingPlanId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const today = formatDateInputValue(new Date());
    setDateRange({ from: today, to: today });
    setIsAttachDialogOpen(false);
    setLinkingPlanId(null);
  }, [classId]);

  const appliedFilters = useMemo(() => {
    return {
      from: dateRange.from && dateRange.from.length > 0 ? dateRange.from : undefined,
      to: dateRange.to && dateRange.to.length > 0 ? dateRange.to : undefined,
    };
  }, [dateRange.from, dateRange.to]);

  const { data, error, isPending, isFetching, refetch } = useQuery<
    ClassLessonPlanLinkSummary[],
    Error
  >({
    queryKey: ["class-lesson-plans", classId, appliedFilters.from ?? null, appliedFilters.to ?? null],
    enabled: Boolean(classId),
    queryFn: async () => {
      const filters: { from?: string; to?: string } = {};
      if (appliedFilters.from) {
        filters.from = appliedFilters.from;
      }
      if (appliedFilters.to) {
        filters.to = appliedFilters.to;
      }
      return listClassLessonPlans(classId, filters);
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const plans = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  useEffect(() => {
    if (!onPlanCountChange) {
      return;
    }

    onPlanCountChange(plans.length);
  }, [plans, onPlanCountChange]);
  const isRefetching = isFetching && !isPending;

  const handleDateChange = (key: "from" | "to") => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setDateRange(prev => ({ ...prev, [key]: value.length > 0 ? value : null }));
  };

  const handleResetFilters = () => {
    const today = formatDateInputValue(new Date());
    setDateRange({ from: today, to: today });
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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="class-plan-filter-from">From date</Label>
              <Input
                id="class-plan-filter-from"
                type="date"
                value={dateRange.from ?? ""}
                onChange={handleDateChange("from")}
                max={dateRange.to ?? undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="class-plan-filter-to">To date</Label>
              <Input
                id="class-plan-filter-to"
                type="date"
                value={dateRange.to ?? ""}
                onChange={handleDateChange("to")}
                min={dateRange.from ?? undefined}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleResetFilters}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to today
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
        {isRefetching ? (
          <p className="text-xs text-muted-foreground">Updating results…</p>
        ) : null}
      </div>

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
                    onClick={() => onUnlink(plan.lessonPlanId)}
                    disabled={isUnlinking && unlinkingPlanId === plan.lessonPlanId}
                  >
                    {isUnlinking && unlinkingPlanId === plan.lessonPlanId ? (
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
            <p>No lesson plans match the selected date range.</p>
            <p className="mt-2">
              Adjust the dates or attach an existing plan using the button above.
            </p>
          </div>
        )}
      </ScrollArea>
      <AttachLessonPlanDialog
        open={isAttachDialogOpen}
        onOpenChange={setIsAttachDialogOpen}
        onSelect={handleAttachPlan}
        isLinking={linkPlanMutation.isPending}
        linkingPlanId={linkingPlanId}
        disabledPlanIds={plans.map(plan => plan.lessonPlanId)}
      />
    </div>
  );
}

export default ClassLessonPlanViewer;
