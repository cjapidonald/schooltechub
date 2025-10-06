import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Sparkles, X } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { useLanguage } from "@/contexts/LanguageContext";
import type { DashboardCurriculumItem } from "@/features/dashboard/examples";

interface CurriculumEditorProps {
  items: DashboardCurriculumItem[];
  loading?: boolean;
  reordering?: boolean;
  onPlanLesson: (item: DashboardCurriculumItem) => void;
  onOpenLessonPlan?: (item: DashboardCurriculumItem) => void;
  onReorder?: (orderedIds: string[]) => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "PPP");
  } catch {
    return value;
  }
};

const useSortedItems = (items: DashboardCurriculumItem[]) => {
  const [orderedItems, setOrderedItems] = useState(items);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  return { orderedItems, setOrderedItems } as const;
};

type DragHandleProps = {
  ref?: (element: HTMLElement | null) => void;
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown>;
  disabled: boolean;
};

interface RowContentProps {
  item: DashboardCurriculumItem;
  index: number;
  t: ReturnType<typeof useLanguage>["t"];
  onPlanLesson: (item: DashboardCurriculumItem) => void;
  onOpenLessonPlan?: (item: DashboardCurriculumItem) => void;
  presentations: string[];
  onManagePresentations: (item: DashboardCurriculumItem) => void;
  onRemovePresentation: (itemId: string, index: number) => void;
  dragHandle?: DragHandleProps;
}

const STATUS_BADGE_STYLES: Record<DashboardCurriculumItem["status"], string> = {
  planned: "border-sky-400/40 bg-sky-500/15 text-sky-100",
  in_progress: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  done: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
};

const RowContent = ({
  item,
  index,
  t,
  onPlanLesson,
  onOpenLessonPlan,
  presentations,
  onManagePresentations,
  onRemovePresentation,
  dragHandle,
}: RowContentProps) => {
  const displayOrder = item.seq_index ?? item.position ?? index + 1;
  const isExample = Boolean(item.isExample);
  const hasLessonPlan = Boolean(item.lesson_plan_id);
  const canOpenLessonPlan = Boolean(onOpenLessonPlan) && hasLessonPlan && !isExample;
  const createDisabled = !item.id || isExample;
  const openDisabled = !canOpenLessonPlan;

  const handleDisabled = dragHandle?.disabled ?? true;
  const handleAttributes = dragHandle?.attributes ?? {};
  const handleListeners = dragHandle?.listeners ?? {};

  return (
    <>
      <TableCell className="font-semibold text-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            ref={dragHandle?.ref}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition",
              handleDisabled
                ? "cursor-not-allowed opacity-40"
                : "cursor-grab text-white/90 shadow-[0_10px_35px_-20px_rgba(15,23,42,0.8)] active:cursor-grabbing",
            )}
            disabled={handleDisabled}
            aria-label={t.dashboard.curriculumView.actions.reorder}
            title={t.dashboard.curriculumView.actions.reorder}
            {...handleAttributes}
            {...handleListeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm text-white/70">{displayOrder}</span>
        </div>
      </TableCell>
      <TableCell className="text-white/80">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold text-white">{item.lesson_title}</div>
            {isExample ? (
              <Badge
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80"
              >
                {t.dashboard.common.exampleTag}
              </Badge>
            ) : null}
          </div>
          {isExample ? (
            <p className="text-xs text-white/60">{t.dashboard.common.exampleDescription}</p>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-white/80">
        {item.stage ? (
          <Badge className="border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            {item.stage}
          </Badge>
        ) : (
          <span className="text-white/50">—</span>
        )}
      </TableCell>
      <TableCell className="text-white/80">{formatDate(item.scheduled_on)}</TableCell>
      <TableCell className="text-white">
        <Badge className={cn("px-3 py-1 text-xs font-semibold uppercase tracking-wide", STATUS_BADGE_STYLES[item.status])}>
          {t.dashboard.curriculumView.status[item.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-right text-white">
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {presentations.length > 0 ? (
              presentations.map((url, linkIndex) => (
                <div
                  key={`${item.id}-presentation-${linkIndex}`}
                  className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur"
                >
                  <span className="max-w-[10rem] truncate" title={url}>
                    {t.dashboard.curriculumView.presentations.linkLabel.replace(
                      "{index}",
                      String(linkIndex + 1),
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/20"
                    type="button"
                    onClick={() => window.open(url, "_blank", "noopener")}
                    aria-label={t.dashboard.curriculumView.presentations.open}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/20"
                    type="button"
                    onClick={() => onRemovePresentation(item.id, linkIndex)}
                    aria-label={t.dashboard.curriculumView.presentations.removeLabel.replace(
                      "{index}",
                      String(linkIndex + 1),
                    )}
                    disabled={isExample}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60">
                {t.dashboard.curriculumView.presentations.empty}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={createDisabled}
            className="rounded-xl border-white/40 bg-white/10 text-white transition hover:border-white/70 hover:bg-white/20"
            onClick={() => onPlanLesson(item)}
            aria-label={t.dashboard.curriculumView.actions.createLessonPlan}
          >
            {t.dashboard.curriculumView.actions.createLessonPlan}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={openDisabled}
            className="rounded-xl border-white/20 bg-white/90 text-slate-900 transition hover:bg-white"
            onClick={() => onOpenLessonPlan?.(item)}
            aria-label={t.dashboard.curriculumView.actions.openLessonPlan}
          >
            {t.dashboard.curriculumView.actions.openLessonPlan}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => onManagePresentations(item)}
            aria-label={t.dashboard.curriculumView.actions.addPresentation}
            disabled={isExample}
            className="rounded-xl border border-white/20 bg-white/5 text-white transition hover:border-white/40 hover:bg-white/10"
          >
            {t.dashboard.curriculumView.actions.addPresentation}
          </Button>
        </div>
        {isExample ? (
          <p className="mt-2 text-xs text-white/60">{t.dashboard.common.exampleActionsDisabled}</p>
        ) : null}
      </TableCell>
    </>
  );
};

interface RowProps {
  item: DashboardCurriculumItem;
  index: number;
  t: ReturnType<typeof useLanguage>["t"];
  onPlanLesson: (item: DashboardCurriculumItem) => void;
  onOpenLessonPlan?: (item: DashboardCurriculumItem) => void;
  presentations: string[];
  onManagePresentations: (item: DashboardCurriculumItem) => void;
  onRemovePresentation: (itemId: string, index: number) => void;
  reorderEnabled: boolean;
  reordering: boolean;
}

const SortableCurriculumRow = ({
  item,
  index,
  t,
  onPlanLesson,
  onOpenLessonPlan,
  presentations,
  onManagePresentations,
  onRemovePresentation,
  reorderEnabled,
  reordering,
}: RowProps) => {
  const disabled = !reorderEnabled || reordering || Boolean(item.isExample);
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle: DragHandleProps = {
    ref: setActivatorNodeRef,
    attributes: attributes as Record<string, unknown>,
    listeners: (listeners ?? {}) as Record<string, unknown>,
    disabled,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={isDragging ? "dragging" : undefined}
      className={cn(
        "border-white/10 bg-white/5 text-white transition hover:bg-white/10",
        isDragging ? "border-white/40 bg-white/20" : undefined,
      )}
    >
      <RowContent
        item={item}
        index={index}
        t={t}
        onPlanLesson={onPlanLesson}
        onOpenLessonPlan={onOpenLessonPlan}
        presentations={presentations}
        onManagePresentations={onManagePresentations}
        onRemovePresentation={onRemovePresentation}
        dragHandle={dragHandle}
      />
    </TableRow>
  );
};

const StaticCurriculumRow = (props: RowProps) => {
  const { item, index, t, onPlanLesson, onOpenLessonPlan, presentations, onManagePresentations, onRemovePresentation } = props;
  return (
    <TableRow className="border-white/10 bg-white/5 text-white transition hover:bg-white/10">
      <RowContent
        item={item}
        index={index}
        t={t}
        onPlanLesson={onPlanLesson}
        onOpenLessonPlan={onOpenLessonPlan}
        presentations={presentations}
        onManagePresentations={onManagePresentations}
        onRemovePresentation={onRemovePresentation}
        dragHandle={{ attributes: {}, listeners: {}, disabled: true }}
      />
    </TableRow>
  );
};

export function CurriculumEditor({
  items,
  loading = false,
  reordering = false,
  onPlanLesson,
  onOpenLessonPlan,
  onReorder,
}: CurriculumEditorProps) {
  const { t } = useLanguage();
  const { orderedItems, setOrderedItems } = useSortedItems(items);
  const [presentationsByItem, setPresentationsByItem] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const item of items) {
      initial[item.id] = Array.isArray(item.presentation_links) ? [...item.presentation_links] : [];
    }
    return initial;
  });
  const [presentationDialog, setPresentationDialog] = useState<{
    open: boolean;
    item: DashboardCurriculumItem | null;
    value: string;
    error: string;
  }>({ open: false, item: null, value: "", error: "" });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setPresentationsByItem(prev => {
      const next: Record<string, string[]> = {};
      for (const item of items) {
        if (prev[item.id]) {
          next[item.id] = prev[item.id];
        } else {
          next[item.id] = Array.isArray(item.presentation_links) ? [...item.presentation_links] : [];
        }
      }
      return next;
    });
  }, [items]);

  const reorderEnabled = useMemo(
    () => Boolean(onReorder) && !loading && orderedItems.length > 1,
    [onReorder, loading, orderedItems.length],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!reorderEnabled || reordering) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedItems.findIndex(item => item.id === active.id);
    const newIndex = orderedItems.findIndex(item => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const next = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(next);
    onReorder?.(next.map(item => item.id));
  };

  const handleManagePresentations = (item: DashboardCurriculumItem) => {
    if (item.isExample) {
      return;
    }
    setPresentationDialog({ open: true, item, value: "", error: "" });
  };

  const handleClosePresentationDialog = () => {
    setPresentationDialog({ open: false, item: null, value: "", error: "" });
  };

  const handleSavePresentation = () => {
    if (!presentationDialog.item) {
      return;
    }

    const value = presentationDialog.value.trim();
    if (!value) {
      setPresentationDialog(prev => ({ ...prev, error: t.dashboard.curriculumView.presentations.required }));
      return;
    }

    setPresentationsByItem(prev => {
      const next = { ...prev };
      const current = next[presentationDialog.item!.id] ? [...next[presentationDialog.item!.id]] : [];
      if (!current.includes(value)) {
        current.push(value);
      }
      next[presentationDialog.item!.id] = current;
      return next;
    });
    setPresentationDialog(prev => ({ ...prev, value: "", error: "" }));
  };

  const handleRemovePresentation = (itemId: string, index: number) => {
    setPresentationsByItem(prev => {
      const current = prev[itemId] ?? [];
      if (!current.length) {
        return prev;
      }
      const nextList = current.filter((_, idx) => idx !== index);
      return { ...prev, [itemId]: nextList };
    });
  };

  const activePresentations = presentationDialog.item
    ? presentationsByItem[presentationDialog.item.id] ?? []
    : [];

  const totals = useMemo(() => {
    const counts: Record<DashboardCurriculumItem["status"], number> = {
      planned: 0,
      in_progress: 0,
      done: 0,
    };
    let nearest: { item: DashboardCurriculumItem; time: number } | null = null;
    const now = Date.now();
    for (const item of items) {
      counts[item.status] += 1;
      if (item.scheduled_on) {
        const ts = new Date(item.scheduled_on).getTime();
        if (!Number.isNaN(ts) && ts >= now) {
          if (!nearest || ts < nearest.time) {
            nearest = { item, time: ts };
          }
        }
      }
    }
    const total = items.length;
    const completePercent = total > 0 ? Math.round((counts.done / total) * 100) : 0;
    const inFlightPercent = total > 0 ? Math.round(((counts.done + counts.in_progress) / total) * 100) : 0;
    return { counts, total, completePercent, inFlightPercent, nearest };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
            {t.dashboard.curriculumDetail.header.lessonsLabel}
            <Sparkles className="h-4 w-4 text-white/50" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{totals.total}</p>
          <p className="mt-2 text-sm text-white/70">{t.dashboard.curriculumView.summary.totalDescription}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent p-5 text-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
          <div className="text-xs uppercase tracking-wide text-white/70">
            {t.dashboard.curriculumView.summary.completion}
          </div>
          <p className="mt-3 text-3xl font-semibold">{totals.completePercent}%</p>
          <p className="mt-2 text-sm text-white/70">{t.dashboard.curriculumView.summary.completionDescription}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-transparent p-5 text-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
          <div className="text-xs uppercase tracking-wide text-white/70">
            {t.dashboard.curriculumView.summary.progress}
          </div>
          <p className="mt-3 text-3xl font-semibold">{totals.inFlightPercent}%</p>
          <div className="mt-2 text-xs text-white/60">
            {t.dashboard.curriculumView.summary.statusBreakdown
              .replace("{planned}", String(totals.counts.planned))
              .replace("{inProgress}", String(totals.counts.in_progress))
              .replace("{complete}", String(totals.counts.done))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
          <div className="text-xs uppercase tracking-wide text-white/70">
            {t.dashboard.curriculumView.summary.nextLesson}
          </div>
          {totals.nearest ? (
            <>
              <p className="mt-3 text-lg font-semibold">{totals.nearest.item.lesson_title}</p>
              <p className="mt-1 text-sm text-white/70">{formatDate(totals.nearest.item.scheduled_on)}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/60">{t.dashboard.curriculumView.summary.noUpcoming}</p>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
        <Table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
          <TableHeader className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
            <TableRow className="border-white/10">
              <TableHead className="w-16 text-white/70">#</TableHead>
              <TableHead className="text-white/70">{t.dashboard.curriculumView.columns.lessonTitle}</TableHead>
              <TableHead className="text-white/70">{t.dashboard.curriculumView.columns.stage}</TableHead>
              <TableHead className="text-white/70">{t.dashboard.curriculumView.columns.date}</TableHead>
              <TableHead className="text-white/70">{t.dashboard.curriculumView.columns.status}</TableHead>
              <TableHead className="text-right text-white/70">{t.dashboard.curriculumView.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/10">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-white/60">
                {t.dashboard.common.loading}
              </TableCell>
            </TableRow>
          ) : orderedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-white/60">
                {t.dashboard.curriculumView.empty}
              </TableCell>
            </TableRow>
          ) : reorderEnabled ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={orderedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                {orderedItems.map((item, index) => (
                  <SortableCurriculumRow
                    key={item.id}
                    item={item}
                    index={index}
                    t={t}
                    onPlanLesson={onPlanLesson}
                    onOpenLessonPlan={onOpenLessonPlan}
                    presentations={presentationsByItem[item.id] ?? []}
                    onManagePresentations={handleManagePresentations}
                    onRemovePresentation={handleRemovePresentation}
                    reorderEnabled={reorderEnabled}
                    reordering={reordering}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            orderedItems.map((item, index) => (
              <StaticCurriculumRow
                key={item.id}
                item={item}
                index={index}
                t={t}
                onPlanLesson={onPlanLesson}
                onOpenLessonPlan={onOpenLessonPlan}
                presentations={presentationsByItem[item.id] ?? []}
                onManagePresentations={handleManagePresentations}
                onRemovePresentation={handleRemovePresentation}
                reorderEnabled={false}
                reordering={reordering}
              />
            ))
          )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={presentationDialog.open}
        onOpenChange={open => {
          if (!open) {
            handleClosePresentationDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg border border-white/20 bg-slate-950/80 text-white shadow-[0_35px_120px_-45px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {t.dashboard.curriculumView.presentations.dialogTitle.replace(
                "{lesson}",
                presentationDialog.item?.lesson_title ?? t.dashboard.curriculumView.presentations.untitled,
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              {t.dashboard.curriculumView.presentations.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="presentation-url" className="text-sm font-medium text-white/80">
                {t.dashboard.curriculumView.presentations.urlLabel}
              </Label>
              <Input
                id="presentation-url"
                placeholder="https://"
                value={presentationDialog.value}
                onChange={event =>
                  setPresentationDialog(prev => ({ ...prev, value: event.target.value, error: "" }))
                }
                className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/60 focus-visible:ring-white/40"
              />
              {presentationDialog.error ? (
                <p className="text-sm text-rose-300">{presentationDialog.error}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">
                {t.dashboard.curriculumView.presentations.listTitle}
              </p>
              {activePresentations.length > 0 ? (
                <ul className="space-y-2">
                  {activePresentations.map((url, index) => (
                    <li
                      key={`${presentationDialog.item?.id ?? "item"}-presentation-${index}`}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur"
                    >
                      <span className="max-w-[16rem] truncate" title={url}>
                        {url}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/15"
                          type="button"
                          onClick={() => window.open(url, "_blank", "noopener")}
                          aria-label={t.dashboard.curriculumView.presentations.open}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/15"
                          type="button"
                          onClick={() =>
                            presentationDialog.item
                              ? handleRemovePresentation(presentationDialog.item.id, index)
                              : undefined
                          }
                          aria-label={t.dashboard.curriculumView.presentations.removeLabel.replace(
                            "{index}",
                            String(index + 1),
                          )}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/60">
                  {t.dashboard.curriculumView.presentations.empty}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleClosePresentationDialog}
              className="rounded-xl border-white/40 bg-white/10 text-white hover:border-white/70 hover:bg-white/20"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSavePresentation}
              className="rounded-xl border-white/20 bg-white/90 text-slate-900 hover:bg-white"
            >
              {t.dashboard.curriculumView.presentations.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
