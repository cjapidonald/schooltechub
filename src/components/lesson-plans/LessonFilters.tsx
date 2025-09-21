import { useEffect, useMemo, useState } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Filter, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import type { DeliveryMode, Stage } from "@/types/lesson-plans";
import { FilterSection } from "@/components/filters/FilterSection";

type FilterValue = string;

interface LessonFiltersProps {
  stages: Stage[];
  deliveryModes: DeliveryMode[];
  technologyOptions: { value: string; label: string }[];
  selectedStages: FilterValue[];
  selectedDeliveryModes: FilterValue[];
  selectedTechnologies: FilterValue[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onStagesChange: (values: FilterValue[]) => void;
  onDeliveryChange: (values: FilterValue[]) => void;
  onTechnologyChange: (values: FilterValue[]) => void;
  onClearFilters: () => void;
  searchPlaceholder: string;
  title: string;
  stageLabel: string;
  deliveryLabel: string;
  technologyLabel: string;
  clearLabel: string;
  closeLabel: string;
}

const MOBILE_BREAKPOINT = 1024;

export function LessonFilters({
  stages,
  deliveryModes,
  technologyOptions,
  selectedStages,
  selectedDeliveryModes,
  selectedTechnologies,
  searchTerm,
  onSearchChange,
  onStagesChange,
  onDeliveryChange,
  onTechnologyChange,
  onClearFilters,
  searchPlaceholder,
  title,
  stageLabel,
  deliveryLabel,
  technologyLabel,
  clearLabel,
  closeLabel,
}: LessonFiltersProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentSearch, setCurrentSearch] = useState(searchTerm);

  useEffect(() => {
    setCurrentSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setIsSheetOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const selectedCount = useMemo(
    () =>
      selectedStages.length +
      selectedDeliveryModes.length +
      selectedTechnologies.length,
    [selectedStages.length, selectedDeliveryModes.length, selectedTechnologies.length],
  );

  const renderStageOption = (stage: Stage) => (
    <label
      key={stage.value}
      className="flex items-start space-x-3 rounded-lg border border-transparent px-3 py-2 transition hover:border-border"
    >
      <Checkbox
        checked={selectedStages.includes(stage.value)}
        onCheckedChange={(checked: CheckedState) => {
          const value = stage.value;
          if (checked === true) {
            if (!selectedStages.includes(value)) {
              onStagesChange([...selectedStages, value]);
            }
          } else {
            onStagesChange(selectedStages.filter((item) => item !== value));
          }
        }}
        aria-label={stage.label}
      />
      <span className="flex flex-1 flex-col text-sm">
        <span className="font-medium">{stage.label}</span>
        {stage.description ? (
          <span className="text-muted-foreground">{stage.description}</span>
        ) : null}
        {stage.gradeRange ? (
          <span className="text-xs text-muted-foreground">{stage.gradeRange}</span>
        ) : null}
      </span>
    </label>
  );

  const renderDeliveryOption = (delivery: DeliveryMode) => (
    <label
      key={delivery.value}
      className="flex items-start space-x-3 rounded-lg border border-transparent px-3 py-2 transition hover:border-border"
    >
      <Checkbox
        checked={selectedDeliveryModes.includes(delivery.value)}
        onCheckedChange={(checked: CheckedState) => {
          const value = delivery.value;
          if (checked === true) {
            if (!selectedDeliveryModes.includes(value)) {
              onDeliveryChange([...selectedDeliveryModes, value]);
            }
          } else {
            onDeliveryChange(selectedDeliveryModes.filter((item) => item !== value));
          }
        }}
        aria-label={delivery.label}
      />
      <span className="flex flex-1 flex-col text-sm">
        <span className="font-medium">{delivery.label}</span>
        {delivery.description ? (
          <span className="text-muted-foreground">{delivery.description}</span>
        ) : null}
        {delivery.durationHint ? (
          <span className="text-xs text-muted-foreground">{delivery.durationHint}</span>
        ) : null}
      </span>
    </label>
  );

  const content = (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="lesson-search">
          {searchPlaceholder}
        </label>
        <Input
          id="lesson-search"
          type="search"
          placeholder={searchPlaceholder}
          value={currentSearch}
          onChange={(event) => {
            const value = event.target.value;
            setCurrentSearch(value);
            onSearchChange(value);
          }}
          aria-label={searchPlaceholder}
        />
      </div>

      <FilterSection title={stageLabel} defaultOpen={selectedStages.length > 0}>
        {stages.map(renderStageOption)}
      </FilterSection>

      <FilterSection title={deliveryLabel} defaultOpen={selectedDeliveryModes.length > 0}>
        {deliveryModes.map(renderDeliveryOption)}
      </FilterSection>

      <FilterSection title={technologyLabel} defaultOpen={selectedTechnologies.length > 0}>
        <ToggleGroup
          type="multiple"
          value={selectedTechnologies}
          onValueChange={onTechnologyChange}
          className="flex flex-wrap gap-2"
          aria-label={technologyLabel}
        >
          {technologyOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="rounded-full border px-4 py-2 text-sm font-medium"
              aria-pressed={selectedTechnologies.includes(option.value)}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FilterSection>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onClearFilters();
            setCurrentSearch("");
            onSearchChange("");
          }}
        >
          {clearLabel}
        </Button>
        {selectedCount > 0 ? (
          <Badge variant="secondary" aria-live="polite">
            {selectedCount}
          </Badge>
        ) : null}
      </div>
    </div>
  );

  return (
    <aside>
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">{title}</span>
          {selectedCount > 0 ? (
            <Badge variant="secondary" aria-live="polite">
              {selectedCount}
            </Badge>
          ) : null}
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" aria-label={title}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {title}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2">
              {content}
            </div>
            <SheetFooter className="mt-6">
              <Button
                type="button"
                className="w-full"
                onClick={() => setIsSheetOpen(false)}
              >
                {closeLabel}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{title}</h2>
            {selectedCount > 0 ? (
              <Badge variant="secondary" aria-live="polite">
                {selectedCount}
              </Badge>
            ) : null}
          </div>
          {content}
        </div>
      </div>
    </aside>
  );
}
