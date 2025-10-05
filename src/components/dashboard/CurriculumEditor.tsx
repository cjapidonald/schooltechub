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
import { ExternalLink, GripVertical, X } from "lucide-react";
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
      <TableCell className="font-semibold">
        <div className="flex items-center gap-2">
          <button
            type="button"
            ref={dragHandle?.ref}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded border bg-background text-muted-foreground transition",
              handleDisabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing",
            )}
            disabled={handleDisabled}
            aria-label={t.dashboard.curriculumView.actions.reorder}
            title={t.dashboard.curriculumView.actions.reorder}
            {...handleAttributes}
            {...handleListeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span>{displayOrder}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="font-medium">{item.lesson_title}</div>
          {isExample ? (
            <Badge variant="outline" className="text-xs font-normal uppercase tracking-wide">
              {t.dashboard.common.exampleTag}
            </Badge>
          ) : null}
        </div>
        {isExample ? (
          <p className="mt-1 text-xs text-muted-foreground">{t.dashboard.common.exampleDescription}</p>
        ) : null}
      </TableCell>
      <TableCell>{item.stage ? <Badge variant="secondary">{item.stage}</Badge> : "—"}</TableCell>
      <TableCell>{formatDate(item.scheduled_on)}</TableCell>
      <TableCell>
        <Badge>{t.dashboard.curriculumView.status[item.status]}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {presentations.length > 0 ? (
              presentations.map((url, linkIndex) => (
                <div
                  key={`${item.id}-presentation-${linkIndex}`}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
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
                    className="h-7 w-7"
                    type="button"
                    onClick={() => window.open(url, "_blank", "noopener")}
                    aria-label={t.dashboard.curriculumView.presentations.open}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
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
              <p className="text-sm text-muted-foreground">
                {t.dashboard.curriculumView.presentations.empty}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={createDisabled}
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
          >
            {t.dashboard.curriculumView.actions.addPresentation}
          </Button>
        </div>
        {isExample ? (
          <p className="mt-2 text-xs text-muted-foreground">{t.dashboard.common.exampleActionsDisabled}</p>
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
      className={cn(isDragging ? "bg-muted/60" : undefined)}
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
    <TableRow>
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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>{t.dashboard.curriculumView.columns.lessonTitle}</TableHead>
            <TableHead>{t.dashboard.curriculumView.columns.stage}</TableHead>
            <TableHead>{t.dashboard.curriculumView.columns.date}</TableHead>
            <TableHead>{t.dashboard.curriculumView.columns.status}</TableHead>
            <TableHead className="text-right">{t.dashboard.curriculumView.columns.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                {t.dashboard.common.loading}
              </TableCell>
            </TableRow>
          ) : orderedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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

      <Dialog
        open={presentationDialog.open}
        onOpenChange={open => {
          if (!open) {
            handleClosePresentationDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t.dashboard.curriculumView.presentations.dialogTitle.replace(
                "{lesson}",
                presentationDialog.item?.lesson_title ?? t.dashboard.curriculumView.presentations.untitled,
              )}
            </DialogTitle>
            <DialogDescription>{t.dashboard.curriculumView.presentations.dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="presentation-url">{t.dashboard.curriculumView.presentations.urlLabel}</Label>
              <Input
                id="presentation-url"
                placeholder="https://"
                value={presentationDialog.value}
                onChange={event =>
                  setPresentationDialog(prev => ({ ...prev, value: event.target.value, error: "" }))
                }
              />
              {presentationDialog.error ? (
                <p className="text-sm text-destructive">{presentationDialog.error}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t.dashboard.curriculumView.presentations.listTitle}
              </p>
              {activePresentations.length > 0 ? (
                <ul className="space-y-2">
                  {activePresentations.map((url, index) => (
                    <li
                      key={`${presentationDialog.item?.id ?? "item"}-presentation-${index}`}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="max-w-[16rem] truncate" title={url}>
                        {url}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          type="button"
                          onClick={() => window.open(url, "_blank", "noopener")}
                          aria-label={t.dashboard.curriculumView.presentations.open}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
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
                <p className="text-sm text-muted-foreground">
                  {t.dashboard.curriculumView.presentations.empty}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleClosePresentationDialog}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSavePresentation}>{t.dashboard.curriculumView.presentations.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
