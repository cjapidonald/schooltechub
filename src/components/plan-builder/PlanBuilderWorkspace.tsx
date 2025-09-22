import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { usePlanEditor } from "@/contexts/PlanEditorContext";
import type { PlanPartTemplate } from "@/contexts/PlanEditorContext";
import type { PlanStep } from "@/types/plan-builder";
import { PlanCanvas } from "@/components/plan-builder/PlanCanvas";
import { PlanCommandPalette } from "@/components/plan-builder/PlanCommandPalette";
import { PartsSidebar } from "@/components/plan-builder/PartsSidebar";

function StepOverlay({ step }: { step: PlanStep }) {
  return (
    <div className="min-w-[16rem] rounded-lg border bg-background p-4 shadow-lg">
      <p className="text-sm font-medium">{step.title}</p>
      <p className="text-xs text-muted-foreground">{step.durationMinutes} min</p>
    </div>
  );
}

function TemplateOverlay({ template }: { template: PlanPartTemplate }) {
  return (
    <div className="min-w-[14rem] rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm font-medium">{template.title}</p>
      {template.description ? <p className="text-xs text-muted-foreground">{template.description}</p> : null}
    </div>
  );
}

export function PlanBuilderWorkspace() {
  const {
    steps,
    addStepFromTemplate,
    addCustomStep,
    duplicateStep,
    reorderSteps,
    undo,
    redo,
  } = usePlanEditor();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<PlanStep | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<PlanPartTemplate | null>(null);
  const [altDuplicate, setAltDuplicate] = useState(false);

  const quickInsertRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    function handleKeyboardShortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!isEditable) {
          setPaletteOpen((value) => !value);
        }
        return;
      }

      if (isEditable) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [redo, undo]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    const activator = event.activatorEvent;
    const altKey =
      activator instanceof PointerEvent || activator instanceof KeyboardEvent ? activator.altKey : false;
    setAltDuplicate(Boolean(altKey));

    if (data?.type === "step") {
      const step = steps.find((item) => item.id === data.stepId);
      if (step) {
        setActiveStep(step);
      }
      setActiveTemplate(null);
    } else if (data?.type === "part") {
      setActiveTemplate(data.template as PlanPartTemplate);
      setActiveStep(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setAltDuplicate(false);
    const { active, over } = event;
    if (!over) {
      setActiveStep(null);
      setActiveTemplate(null);
      return;
    }

    const data = active.data.current;
    const overId = over.id;
    const overIndex = steps.findIndex((step) => step.id === overId);

    if (data?.type === "part" && data.template) {
      const template = data.template as PlanPartTemplate;
      const index = overId === "plan-canvas" || overIndex === -1 ? steps.length : overIndex;
      addStepFromTemplate(template, index);
    }

    if (data?.type === "step") {
      const activeIndex = steps.findIndex((step) => step.id === data.stepId);
      if (activeIndex === -1) {
        setActiveStep(null);
        setActiveTemplate(null);
        return;
      }

      if (altDuplicate) {
        const insertIndex = overId === "plan-canvas" || overIndex === -1 ? steps.length : overIndex;
        const targetIndex = insertIndex <= activeIndex ? activeIndex + 1 : insertIndex;
        duplicateStep(data.stepId, targetIndex);
      } else if (overId === "plan-canvas" && activeIndex !== steps.length - 1) {
        reorderSteps(activeIndex, steps.length - 1);
      } else if (overIndex !== -1 && overIndex !== activeIndex) {
        reorderSteps(activeIndex, overIndex);
      }
    }

    setActiveStep(null);
    setActiveTemplate(null);
  };

  const handleDragCancel = () => {
    setActiveStep(null);
    setActiveTemplate(null);
    setAltDuplicate(false);
  };

  const quickInsert = useMemo(
    () =>
      (value: string) => {
        addCustomStep({
          type: "activity",
          title: value,
          durationMinutes: 10,
          notes: "",
        });
      },
    [addCustomStep],
  );

  return (
    <>
      <PlanCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelectTemplate={(template) => {
          addStepFromTemplate(template);
          setPaletteOpen(false);
        }}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <PlanCanvas activeId={activeStep?.id ?? null} quickInsertRef={quickInsertRef} onQuickInsert={quickInsert} />
          <PartsSidebar
            onSelectTemplate={(template) => {
              addStepFromTemplate(template);
              setPaletteOpen(false);
            }}
          />
        </div>
        <DragOverlay>
          {activeStep ? <StepOverlay step={activeStep} /> : null}
          {!activeStep && activeTemplate ? <TemplateOverlay template={activeTemplate} /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
