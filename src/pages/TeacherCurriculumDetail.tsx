import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, Layers, NotebookPen } from "lucide-react";

import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  appendCurriculumLessons,
  deleteCurriculumItemById,
  fetchCurriculumDetail,
  fetchCurriculumItems,
  updateCurriculumItemDetails,
} from "@/features/dashboard/api";
import type { DashboardCurriculumItem } from "@/features/dashboard/examples";

type ItemDraft = {
  lesson_title: string;
  stage: string;
  scheduled_on: string;
  status: DashboardCurriculumItem["status"];
};

const statusOptions: DashboardCurriculumItem["status"][] = ["planned", "in_progress", "done"];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "PPP");
  } catch {
    return value;
  }
};

const TeacherCurriculumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const curriculumId = id ?? "";

  const detailQuery = useQuery({
    queryKey: ["dashboard-curriculum-detail", curriculumId],
    queryFn: () => fetchCurriculumDetail(curriculumId),
    enabled: Boolean(curriculumId),
  });

  const itemsQuery = useQuery({
    queryKey: ["dashboard-curriculum-items", curriculumId],
    queryFn: () => fetchCurriculumItems(curriculumId),
    enabled: Boolean(curriculumId),
  });

  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [lessonInput, setLessonInput] = useState("");
  const [defaultStage, setDefaultStage] = useState("");
  const [defaultDate, setDefaultDate] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const curriculum = detailQuery.data ?? null;
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const hasError = detailQuery.isError || itemsQuery.isError;
  const errorMessage =
    detailQuery.error instanceof Error
      ? detailQuery.error.message
      : itemsQuery.error instanceof Error
        ? itemsQuery.error.message
        : null;

  useEffect(() => {
    const map: Record<string, ItemDraft> = {};
    for (const item of items) {
      map[item.id] = {
        lesson_title: item.lesson_title,
        stage: item.stage ?? "",
        scheduled_on: item.scheduled_on ?? "",
        status: item.status,
      } satisfies ItemDraft;
    }
    setDrafts(map);
  }, [items]);

  useEffect(() => {
    const stage = curriculum?.class?.stage ?? "";
    if (stage && !defaultStage) {
      setDefaultStage(stage);
    }
  }, [curriculum, defaultStage]);

  useEffect(() => {
    if (!curriculumId) {
      navigate("/teacher", { replace: true });
      return;
    }
    if (!detailQuery.isLoading && detailQuery.data === null) {
      toast({ description: t.dashboard.curriculumDetail.toasts.notFound, variant: "destructive" });
      navigate("/teacher?tab=curriculum", { replace: true });
    }
  }, [curriculumId, detailQuery.data, detailQuery.isLoading, navigate, t, toast]);

  useEffect(() => {
    if (hasError) {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    }
  }, [hasError, t, toast]);

  const updateMutation = useMutation({
    mutationFn: (input: {
      itemId: string;
      lessonTitle: string;
      stage?: string | null;
      scheduledOn?: string | null;
      status: DashboardCurriculumItem["status"];
    }) => updateCurriculumItemDetails(input),
    onMutate: variables => {
      setUpdatingId(variables.itemId);
    },
    onSuccess: result => {
      queryClient.setQueryData<DashboardCurriculumItem[] | undefined>(
        ["dashboard-curriculum-items", curriculumId],
        current => {
          if (!current) return current;
          return current.map(item => (item.id === result.id ? { ...item, ...result } : item));
        },
      );
      setDrafts(prev => ({
        ...prev,
        [result.id]: {
          lesson_title: result.lesson_title,
          stage: result.stage ?? "",
          scheduled_on: result.scheduled_on ?? "",
          status: result.status,
        },
      }));
      toast({ description: t.dashboard.curriculumDetail.toasts.updated });
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteCurriculumItemById(itemId),
    onMutate: itemId => {
      setDeletingId(itemId);
    },
    onSuccess: (_, itemId) => {
      queryClient.setQueryData<DashboardCurriculumItem[] | undefined>(
        ["dashboard-curriculum-items", curriculumId],
        current => current?.filter(item => item.id !== itemId),
      );
      setDrafts(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      toast({ description: t.dashboard.curriculumDetail.toasts.deleted });
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const appendMutation = useMutation({
    mutationFn: (payload: { titles: string[]; stage: string; date: string }) =>
      appendCurriculumLessons({
        curriculumId,
        startIndex: items.length,
        lessonTitles: payload.titles,
        defaultStage: payload.stage ? payload.stage : null,
        defaultDate: payload.date ? payload.date : null,
      }),
    onSuccess: result => {
      queryClient.setQueryData<DashboardCurriculumItem[] | undefined>(
        ["dashboard-curriculum-items", curriculumId],
        current => (current ? [...current, ...result] : result),
      );
      toast({ description: t.dashboard.curriculumDetail.toasts.added });
      setLessonInput("");
      setAddError(null);
      setAddDialogOpen(false);
    },
    onError: () => {
      toast({ description: t.dashboard.toasts.error, variant: "destructive" });
    },
  });

  const metadata = useMemo(() => {
    if (!curriculum) {
      return [] as Array<{ label: string; value: string }>;
    }
    return [
      {
        label: t.dashboard.curriculumDetail.header.classLabel,
        value: curriculum.class?.title ?? t.dashboard.curriculumDetail.header.unknownClass,
      },
      {
        label: t.dashboard.curriculumDetail.header.subjectLabel,
        value: curriculum.subject ?? "—",
      },
      {
        label: t.dashboard.curriculumDetail.header.academicYearLabel,
        value: curriculum.academic_year ?? "—",
      },
      {
        label: t.dashboard.curriculumDetail.header.createdLabel,
        value: formatDate(curriculum.created_at),
      },
      {
        label: t.dashboard.curriculumDetail.header.lessonsLabel,
        value: String(curriculum.items_count ?? items.length),
      },
    ];
  }, [curriculum, items.length, t]);

  const handleSave = (item: DashboardCurriculumItem) => {
    const draft = drafts[item.id];
    if (!draft) return;
    const trimmedTitle = draft.lesson_title.trim();
    if (!trimmedTitle) {
      toast({ description: t.dashboard.curriculumDetail.validation.titleRequired, variant: "destructive" });
      return;
    }
    const normalizedStage = draft.stage.trim();
    const normalizedDate = draft.scheduled_on.trim();

    if (
      trimmedTitle === item.lesson_title &&
      (normalizedStage || "") === (item.stage ?? "") &&
      (normalizedDate || "") === (item.scheduled_on ?? "") &&
      draft.status === item.status
    ) {
      return;
    }

    updateMutation.mutate({
      itemId: item.id,
      lessonTitle: trimmedTitle,
      stage: normalizedStage || null,
      scheduledOn: normalizedDate || null,
      status: draft.status,
    });
  };

  const handleDelete = (item: DashboardCurriculumItem) => {
    if (!item.id) return;
    deleteMutation.mutate(item.id);
  };

  const handleAddLessons = () => {
    const titles = lessonInput
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (titles.length === 0) {
      setAddError(t.dashboard.curriculumDetail.addDialog.error);
      return;
    }

    appendMutation.mutate({ titles, stage: defaultStage.trim(), date: defaultDate.trim() });
  };

  const renderContent = () => {
    if (detailQuery.isLoading) {
      return (
        <div className="rounded-3xl border border-white/15 bg-white/5 p-8 text-center text-white/70 backdrop-blur-xl">
          {t.dashboard.common.loading}
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="rounded-3xl border border-white/15 bg-white/5 p-10 text-white shadow-[0_25px_80px_-40px_rgba(15,23,42,0.9)]">
          <h2 className="text-2xl font-semibold text-white">{t.dashboard.curriculumDetail.error.title}</h2>
          <p className="mt-2 text-sm text-white/70">{t.dashboard.curriculumDetail.error.description}</p>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/70">
              <span className="block text-xs font-semibold uppercase tracking-wide text-white/50">
                {t.dashboard.curriculumDetail.error.detailsLabel}
              </span>
              <span className="mt-1 block text-white/80">{errorMessage}</span>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              className="rounded-xl border-white/60 bg-white/90 text-slate-900 hover:bg-white"
              onClick={() => {
                void detailQuery.refetch();
                void itemsQuery.refetch();
              }}
            >
              {t.dashboard.curriculumDetail.error.retry}
            </Button>
            <Button
              variant="ghost"
              className="rounded-xl border border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => navigate("/teacher?tab=curriculum")}
            >
              {t.dashboard.curriculumDetail.back}
            </Button>
          </div>
        </div>
      );
    }

    if (!curriculum) {
      return null;
    }

    return (
      <>
        <div className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/10 p-8 text-white shadow-[0_35px_120px_-45px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
            <Layers className="h-3.5 w-3.5" />
            {t.dashboard.curriculumDetail.header.badge}
          </span>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{curriculum.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            {t.dashboard.curriculum.empty.description}
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metadata.map(meta => (
              <div key={meta.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-white/60">{meta.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-white">{meta.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section className="mt-10 space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white shadow-[0_25px_90px_-45px_rgba(15,23,42,0.95)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{t.dashboard.curriculumDetail.actionsPanel.title}</h2>
              <p className="mt-1 text-sm text-white/70">{t.dashboard.curriculumDetail.actionsPanel.description}</p>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="rounded-xl border-white/60 bg-white/90 text-slate-900 hover:bg-white"
              disabled={appendMutation.isPending}
            >
              {appendMutation.isPending
                ? t.common.loading
                : t.dashboard.curriculumDetail.actions.addLessons}
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-white shadow-[0_25px_90px_-45px_rgba(15,23,42,0.95)]">
              <NotebookPen className="mx-auto h-10 w-10 text-white/60" />
              <h3 className="mt-4 text-xl font-semibold">{t.dashboard.curriculumDetail.empty.title}</h3>
              <p className="mt-2 text-sm text-white/70">{t.dashboard.curriculumDetail.empty.description}</p>
              <Button
                className="mt-6 rounded-xl border-white/60 bg-white/90 text-slate-900 hover:bg-white"
                onClick={() => setAddDialogOpen(true)}
              >
                {t.dashboard.curriculumDetail.actions.addLessons}
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {items.map((item, index) => {
                const draft = drafts[item.id];
                const isUpdating = updatingId === item.id && updateMutation.isPending;
                const isDeleting = deletingId === item.id && deleteMutation.isPending;
                return (
                  <Card
                    key={item.id}
                    className="border-white/15 bg-white/5 text-white shadow-[0_25px_90px_-45px_rgba(15,23,42,0.95)] backdrop-blur-xl"
                  >
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl font-semibold">
                          {t.dashboard.curriculumDetail.lessonTitle.replace("{index}", String(index + 1))}
                        </CardTitle>
                        <p className="mt-1 text-sm text-white/70">{item.lesson_title}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <CalendarDays className="h-4 w-4" />
                        {item.scheduled_on ? formatDate(item.scheduled_on) : t.dashboard.curriculumDetail.labels.unscheduled}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label className="text-sm font-medium text-white/80">
                            {t.dashboard.curriculumView.columns.lessonTitle}
                          </Label>
                          <Input
                            value={draft?.lesson_title ?? ""}
                            onChange={event =>
                              setDrafts(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  lesson_title: event.target.value,
                                },
                              }))
                            }
                            className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/70 focus-visible:ring-white/40"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-sm font-medium text-white/80">
                            {t.dashboard.curriculumDetail.labels.stage}
                          </Label>
                          <Input
                            value={draft?.stage ?? ""}
                            onChange={event =>
                              setDrafts(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  stage: event.target.value,
                                },
                              }))
                            }
                            className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/70 focus-visible:ring-white/40"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label className="text-sm font-medium text-white/80">
                            {t.dashboard.curriculumDetail.labels.date}
                          </Label>
                          <Input
                            type="date"
                            value={draft?.scheduled_on ?? ""}
                            onChange={event =>
                              setDrafts(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  scheduled_on: event.target.value,
                                },
                              }))
                            }
                            className="rounded-xl border-white/30 bg-white/10 text-white focus:border-white/70 focus-visible:ring-white/40"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-sm font-medium text-white/80">
                            {t.dashboard.curriculumView.columns.status}
                          </Label>
                          <Select
                            value={draft?.status ?? item.status}
                            onValueChange={value =>
                              setDrafts(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  status: value as DashboardCurriculumItem["status"],
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="rounded-xl border-white/30 bg-white/10 text-white focus:ring-white/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border border-white/20 bg-slate-900/90 text-white backdrop-blur-xl">
                              {statusOptions.map(option => (
                                <SelectItem key={option} value={option}>
                                  {t.dashboard.curriculumView.status[option]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-between">
                      <div className="text-xs uppercase tracking-wide text-white/60">
                        {t.dashboard.curriculumDetail.labels.identifier.replace("{id}", item.id)}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                          variant="secondary"
                          className="rounded-xl border-white/40 bg-white/90 text-slate-900 hover:bg-white"
                          onClick={() => handleSave(item)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? t.common.loading : t.dashboard.curriculumDetail.actions.saveLesson}
                        </Button>
                        <Button
                          variant="ghost"
                          className="rounded-xl border border-white/30 bg-transparent text-white hover:bg-white/10"
                          onClick={() => handleDelete(item)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? t.common.loading : t.dashboard.curriculumDetail.actions.removeLesson}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <SEO
        title={curriculum ? `${curriculum.title} | ${t.dashboard.curriculumDetail.pageTitle}` : t.dashboard.curriculumDetail.pageTitle}
        description={t.dashboard.curriculumDetail.pageDescription}
      />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-1/3 right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-6rem] h-[26rem] w-[26rem] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-5xl flex-col px-4 py-20 md:px-8">
        <Button
          variant="ghost"
          className="self-start rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          onClick={() => navigate("/teacher?tab=curriculum")}
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t.dashboard.curriculumDetail.back}
          </span>
        </Button>

        {renderContent()}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-xl border border-white/30 bg-white/10 text-white shadow-[0_35px_120px_-45px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">
              {t.dashboard.curriculumDetail.addDialog.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              {t.dashboard.curriculumDetail.addDialog.description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-white/80">
                {t.dashboard.curriculumDetail.labels.lessonList}
              </Label>
              <Textarea
                rows={8}
                placeholder={t.dashboard.curriculumDetail.addDialog.textareaPlaceholder}
                value={lessonInput}
                onChange={event => {
                  setLessonInput(event.target.value);
                  if (addError) {
                    setAddError(null);
                  }
                }}
                className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/40"
              />
              <p className="text-xs text-white/60">{t.dashboard.curriculumDetail.addDialog.helper}</p>
              {addError ? <p className="text-xs text-red-300">{addError}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-white/80">
                  {t.dashboard.curriculumDetail.addDialog.stageLabel}
                </Label>
                <Input
                  value={defaultStage}
                  onChange={event => setDefaultStage(event.target.value)}
                  className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/70 focus-visible:ring-white/40"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-white/80">
                  {t.dashboard.curriculumDetail.addDialog.dateLabel}
                </Label>
                <Input
                  type="date"
                  value={defaultDate}
                  onChange={event => setDefaultDate(event.target.value)}
                  className="rounded-xl border-white/30 bg-white/10 text-white focus:border-white/70 focus-visible:ring-white/40"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
              onClick={() => setAddDialogOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              className="border-white/60 bg-white/90 text-slate-900 hover:bg-white"
              onClick={handleAddLessons}
              disabled={appendMutation.isPending}
            >
              {appendMutation.isPending
                ? t.common.loading
                : t.dashboard.curriculumDetail.addDialog.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherCurriculumDetailPage;
