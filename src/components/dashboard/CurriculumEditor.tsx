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
import { GripVertical, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DashboardCurriculumItem } from "@/features/dashboard/examples";

interface CurriculumEditorProps {
  items: DashboardCurriculumItem[];
  loading?: boolean;
  reordering?: boolean;
  quickAttachBusyId?: string | null;
  onPlanLesson: (item: DashboardCurriculumItem) => void;
  onOpenLessonPlan?: (item: DashboardCurriculumItem) => void;
  onQuickAttachResource?: (item: DashboardCurriculumItem) => void;
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
  onQuickAttachResource?: (item: DashboardCurriculumItem) => void;
  quickAttachBusyId?: string | null;
  dragHandle?: DragHandleProps;
}

const RowContent = ({
  item,
  index,
  t,
  onPlanLesson,
  onOpenLessonPlan,
  onQuickAttachResource,
  quickAttachBusyId,
  dragHandle,
}: RowContentProps) => {
  const displayOrder = item.seq_index ?? item.position ?? index + 1;
  const isExample = Boolean(item.isExample);
  const hasLessonPlan = Boolean(item.lesson_plan_id);
  const resourceShortcutCount = item.resource_shortcut_ids?.length ?? 0;
  const canOpenLessonPlan = Boolean(onOpenLessonPlan) && hasLessonPlan && !isExample;
  const canQuickAttach =
    Boolean(onQuickAttachResource) && hasLessonPlan && resourceShortcutCount > 0 && !isExample;
  const quickAttachLoading = quickAttachBusyId === item.id;
  const createDisabled = !item.id || isExample;
  const openDisabled = !canOpenLessonPlan;
  const quickAttachDisabled = !canQuickAttach || quickAttachLoading;

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
        <div className="flex flex-wrap items-center justify-end gap-2">
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
            disabled={quickAttachDisabled}
            onClick={() => onQuickAttachResource?.(item)}
            aria-label={t.dashboard.curriculumView.actions.quickAttachResource}
          >
            {quickAttachLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t.dashboard.curriculumView.actions.quickAttachResource}
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
  onQuickAttachResource?: (item: DashboardCurriculumItem) => void;
  quickAttachBusyId?: string | null;
  reorderEnabled: boolean;
  reordering: boolean;
}

const SortableCurriculumRow = ({
  item,
  index,
  t,
  onPlanLesson,
  onOpenLessonPlan,
  onQuickAttachResource,
  quickAttachBusyId,
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
        onQuickAttachResource={onQuickAttachResource}
        quickAttachBusyId={quickAttachBusyId}
        dragHandle={dragHandle}
      />
    </TableRow>
  );
};

const StaticCurriculumRow = (props: RowProps) => {
  const { item, index, t, onPlanLesson, onOpenLessonPlan, onQuickAttachResource, quickAttachBusyId } = props;
  return (
    <TableRow>
      <RowContent
        item={item}
        index={index}
        t={t}
        onPlanLesson={onPlanLesson}
        onOpenLessonPlan={onOpenLessonPlan}
        onQuickAttachResource={onQuickAttachResource}
        quickAttachBusyId={quickAttachBusyId}
        dragHandle={{ attributes: {}, listeners: {}, disabled: true }}
      />
    </TableRow>
  );
};

export function CurriculumEditor({
  items,
  loading = false,
  reordering = false,
  quickAttachBusyId = null,
  onPlanLesson,
  onOpenLessonPlan,
  onQuickAttachResource,
  onReorder,
}: CurriculumEditorProps) {
  const { t } = useLanguage();
  const { orderedItems, setOrderedItems } = useSortedItems(items);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
                    onQuickAttachResource={onQuickAttachResource}
                    quickAttachBusyId={quickAttachBusyId ?? null}
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
                onQuickAttachResource={onQuickAttachResource}
                quickAttachBusyId={quickAttachBusyId ?? null}
                reorderEnabled={false}
                reordering={reordering}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
