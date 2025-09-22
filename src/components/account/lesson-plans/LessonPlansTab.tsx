import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  FileDown,
  FileText,
  Link2,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonPlanPreview } from "@/components/account/lesson-plans/LessonPlanPreview";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import {
  deletePlan,
  exportPlanToDocx,
  exportPlanToPDF,
  getMyPlans,
  getPlanWithSteps,
} from "@/lib/lessonPlans";
import {
  getPlanAttachmentCounts,
  linkPlanToClass,
  listMyClasses,
} from "@/lib/classes";
import type { LessonPlan } from "@/types/platform";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "—";
  }

  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsed);
  } catch (error) {
    console.error("Failed to format date", error);
    return value;
  }
};

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "—";
  }

  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  } catch (error) {
    console.error("Failed to format date", error);
    return value;
  }
};

const makeFileName = (plan: LessonPlan, extension: "pdf" | "docx"): string => {
  const base = plan.title.trim().toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "");
  const safeBase = base.length > 0 ? base : "lesson-plan";
  return `${safeBase}.${extension}`;
};

export const LessonPlansTab = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewPlanId, setPreviewPlanId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["lesson-plans", "mine"],
    queryFn: () => getMyPlans(),
  });

  const planIds = useMemo(
    () => (plansQuery.data ?? []).map(plan => plan.id).filter(id => typeof id === "string" && id.length > 0),
    [plansQuery.data],
  );

  const attachmentCountsQuery = useQuery({
    queryKey: ["lesson-plans", "attachments", planIds],
    queryFn: () => getPlanAttachmentCounts(planIds),
    enabled: planIds.length > 0,
  });

  const classesQuery = useQuery({
    queryKey: ["classes", "mine"],
    queryFn: () => listMyClasses(),
  });

  const previewQuery = useQuery({
    queryKey: ["lesson-plans", "detail", previewPlanId],
    queryFn: () => (previewPlanId ? getPlanWithSteps(previewPlanId) : Promise.resolve(null)),
    enabled: previewOpen && Boolean(previewPlanId),
  });

  const attachMutation = useMutation({
    mutationFn: ({ planId, classId }: { planId: string; classId: string }) => linkPlanToClass(planId, classId),
    onSuccess: () => {
      toast({ description: t.account.lessonPlans.toast.attachSuccess });
      queryClient.invalidateQueries({ queryKey: ["lesson-plans", "attachments"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: t.account.lessonPlans.toast.attachError,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => deletePlan(planId),
    onSuccess: () => {
      toast({ description: t.account.lessonPlans.toast.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ["lesson-plans"] });
      queryClient.invalidateQueries({ queryKey: ["lesson-plans", "attachments"] });
      setPlanToDelete(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: t.account.lessonPlans.toast.deleteError,
      });
    },
  });

  const handleDownload = async (plan: LessonPlan, format: "pdf" | "docx") => {
    try {
      const blob =
        format === "pdf" ? await exportPlanToPDF(plan.id) : await exportPlanToDocx(plan.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = makeFileName(plan, format);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: t.account.lessonPlans.toast.downloadError,
      });
    }
  };

  const openPreview = (planId: string) => {
    setPreviewPlanId(planId);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewPlanId(null);
  };

  const plans = plansQuery.data ?? [];
  const attachmentCounts = attachmentCountsQuery.data ?? {};
  const classes = classesQuery.data ?? [];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{t.account.lessonPlans.heading}</CardTitle>
        <CardDescription>{t.account.lessonPlans.subheading}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {plansQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : plans.length === 0 ? (
          <div className="space-y-4 rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">{t.account.lessonPlans.empty}</p>
            <Button
              variant="secondary"
              onClick={() => navigate(getLocalizedPath("/builder", language))}
            >
              {t.account.lessonPlans.emptyCta}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.account.lessonPlans.table.title}</TableHead>
                  <TableHead>{t.account.lessonPlans.table.date}</TableHead>
                  <TableHead>{t.account.lessonPlans.table.updated}</TableHead>
                  <TableHead className="text-right">{t.account.lessonPlans.table.attached}</TableHead>
                  <TableHead className="text-right">{t.account.lessonPlans.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="min-w-[12rem] space-y-1">
                        <p className="font-medium text-foreground">{plan.title}</p>
                        {plan.duration ? (
                          <p className="text-xs text-muted-foreground">{plan.duration}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(plan.date)}</TableCell>
                    <TableCell>{formatDateTime(plan.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      {attachmentCountsQuery.isLoading ? (
                        <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        attachmentCounts[plan.id] ?? 0
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPreview(plan.id)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {t.account.lessonPlans.actions.preview}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(plan, "pdf")}
                          className="gap-2"
                        >
                          <FileDown className="h-4 w-4" />
                          {t.account.lessonPlans.actions.downloadPdf}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(plan, "docx")}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          {t.account.lessonPlans.actions.downloadDocx}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              disabled={
                                classesQuery.isLoading ||
                                classes.length === 0 ||
                                attachMutation.isPending
                              }
                            >
                              <Link2 className="h-4 w-4" />
                              {t.account.lessonPlans.actions.attach}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>{t.account.lessonPlans.actions.attach}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {classesQuery.isLoading ? (
                              <DropdownMenuItem disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.common.loading}
                              </DropdownMenuItem>
                            ) : classes.length === 0 ? (
                              <DropdownMenuItem disabled>
                                {t.account.lessonPlans.noClasses}
                              </DropdownMenuItem>
                            ) : (
                              classes.map(classItem => (
                                <DropdownMenuItem
                                  key={classItem.id}
                                  disabled={attachMutation.isPending}
                                  onSelect={() =>
                                    attachMutation.mutate({ planId: plan.id, classId: classItem.id })
                                  }
                                >
                                  {classItem.title}
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => setPlanToDelete(plan.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t.account.lessonPlans.actions.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={previewOpen} onOpenChange={next => (next ? setPreviewOpen(true) : closePreview())}>
        <DialogContent className="max-w-3xl gap-4 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewQuery.data?.plan.title ?? t.account.lessonPlans.previewTitle}</DialogTitle>
            <DialogDescription>{t.account.lessonPlans.previewDescription}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {previewQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : previewQuery.data ? (
              <LessonPlanPreview plan={previewQuery.data.plan} steps={previewQuery.data.steps} />
            ) : (
              <p className="text-sm text-muted-foreground">{t.account.lessonPlans.previewFallback}</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(planToDelete)} onOpenChange={next => (!next ? setPlanToDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.account.lessonPlans.deleteConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.account.lessonPlans.deleteConfirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => planToDelete && deleteMutation.mutate(planToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t.common.loading : t.account.lessonPlans.deleteConfirm.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default LessonPlansTab;
