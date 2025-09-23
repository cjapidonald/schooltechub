import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getMyPlans } from "@/lib/lessonPlans";
import type { LessonPlan } from "@/types/platform";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const formatPlanDate = (value: string | null): string => {
  if (!value) {
    return "No scheduled date";
  }

  try {
    return format(new Date(value), "PPP");
  } catch {
    return value;
  }
};

const normalise = (value: string) => value.trim().toLowerCase();

export interface AttachLessonPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (lessonPlanId: string) => void;
  isLinking?: boolean;
  linkingPlanId?: string | null;
  disabledPlanIds?: string[];
}

export function AttachLessonPlanDialog({
  open,
  onOpenChange,
  onSelect,
  isLinking = false,
  linkingPlanId = null,
  disabledPlanIds = [],
}: AttachLessonPlanDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  const { data, error, isPending, isFetching, refetch } = useQuery<LessonPlan[], Error>({
    queryKey: ["my-lesson-plans"],
    queryFn: () => getMyPlans(),
    enabled: open,
    staleTime: 30_000,
  });

  const plans = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const disabledPlanIdSet = useMemo(() => new Set(disabledPlanIds), [disabledPlanIds]);

  const filteredPlans = useMemo(() => {
    const term = normalise(searchTerm);

    if (term.length === 0) {
      return plans;
    }

    return plans.filter(plan => {
      const title = normalise(plan.title);
      const rawDate = plan.date ? formatPlanDate(plan.date) : "";
      const dateText = normalise(rawDate);

      return title.includes(term) || dateText.includes(term);
    });
  }, [plans, searchTerm]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const isRefetching = isFetching && !isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach an existing lesson plan</DialogTitle>
          <DialogDescription>
            Choose a plan you have previously created. It will be linked to this class immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by title or date"
            autoFocus
          />

          {isRefetching ? (
            <p className="text-xs text-muted-foreground">Refreshing your plans…</p>
          ) : null}

          <ScrollArea className="max-h-[50vh] pr-2">
            {isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to load your lesson plans</AlertTitle>
                <AlertDescription>
                  {error.message}
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Try again
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : plans.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                <p>You have not created any lesson plans yet.</p>
                <p className="mt-2">Build a lesson plan to attach it to this class.</p>
              </div>
            ) : filteredPlans.length > 0 ? (
              <div className="space-y-3">
                {filteredPlans.map(plan => {
                  const formattedDate = formatPlanDate(plan.date ?? null);
                  const isAlreadyLinked = disabledPlanIdSet.has(plan.id);
                  const isCurrentSelection = linkingPlanId === plan.id;
                  const disabled = isAlreadyLinked || (isLinking && !isCurrentSelection);

                  return (
                    <div key={plan.id} className="rounded-md border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{plan.title}</p>
                          <p className="text-sm text-muted-foreground">{formattedDate}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onSelect(plan.id)}
                          disabled={disabled}
                        >
                          {isLinking && isCurrentSelection ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {isAlreadyLinked ? "Already linked" : "Attach"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                <p>No lesson plans match your search.</p>
                <p className="mt-2">Try a different title or date.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AttachLessonPlanDialog;
