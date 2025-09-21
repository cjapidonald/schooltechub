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
import { Switch } from "@/components/ui/switch";
import type { WorksheetFiltersState } from "@/types/worksheets";

const MOBILE_BREAKPOINT = 1024;

interface Option {
  value: string;
  label: string;
  description?: string;
  hint?: string;
}

interface WorksheetFiltersCopy {
  title: string;
  searchPlaceholder: string;
  stageLabel: string;
  subjectLabel: string;
  skillLabel: string;
  typeLabel: string;
  difficultyLabel: string;
  formatLabel: string;
  techOnlyLabel: string;
  techOnlyDescription: string;
  answersOnlyLabel: string;
  answersOnlyDescription: string;
  clearLabel: string;
  closeLabel: string;
  mobileToggleLabel: string;
}

interface WorksheetFiltersProps {
  value: WorksheetFiltersState;
  onChange: (value: WorksheetFiltersState) => void;
  onClear: () => void;
  copy: WorksheetFiltersCopy;
  stageOptions: Option[];
  subjectOptions: Option[];
  skillOptions: Option[];
  typeOptions: Option[];
  difficultyOptions: Option[];
  formatOptions: Option[];
}

export function WorksheetFilters({
  value,
  onChange,
  onClear,
  copy,
  stageOptions,
  subjectOptions,
  skillOptions,
  typeOptions,
  difficultyOptions,
  formatOptions,
}: WorksheetFiltersProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value.searchTerm);

  useEffect(() => {
    setSearchValue(value.searchTerm);
  }, [value.searchTerm]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setIsSheetOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedCount = useMemo(() => {
    let total = 0;
    total += value.stages.length;
    total += value.subjects.length;
    total += value.skills.length;
    total += value.worksheetTypes.length;
    total += value.difficulties.length;
    total += value.formats.length;
    if (value.techIntegratedOnly) total += 1;
    if (value.answersOnly) total += 1;
    if (value.searchTerm.trim().length > 0) total += 1;
    return total;
  }, [value]);

  const updateFilters = (patch: Partial<WorksheetFiltersState>) => {
    onChange({ ...value, ...patch });
  };

  const toggleListValue = (
    current: string[],
    nextValue: string,
    checked: CheckedState,
  ) => {
    if (checked === true) {
      if (current.includes(nextValue)) {
        return current;
      }
      return [...current, nextValue];
    }
    return current.filter((item) => item !== nextValue);
  };

  const renderCheckboxOption = (
    option: Option,
    isChecked: boolean,
    onChangeOption: (checked: CheckedState) => void,
  ) => (
    <label
      key={option.value}
      className="flex items-start gap-3 rounded-lg border border-transparent px-3 py-2 transition hover:border-border"
    >
      <Checkbox checked={isChecked} onCheckedChange={onChangeOption} />
      <span className="flex flex-1 flex-col text-sm">
        <span className="font-medium">{option.label}</span>
        {option.description ? (
          <span className="text-muted-foreground">{option.description}</span>
        ) : null}
        {option.hint ? (
          <span className="text-xs text-muted-foreground">{option.hint}</span>
        ) : null}
      </span>
    </label>
  );

  const content = (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="worksheet-search">
          {copy.searchPlaceholder}
        </label>
        <Input
          id="worksheet-search"
          type="search"
          placeholder={copy.searchPlaceholder}
          value={searchValue}
          onChange={(event) => {
            const next = event.target.value;
            setSearchValue(next);
            updateFilters({ searchTerm: next });
          }}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{copy.stageLabel}</span>
        </div>
        <div className="space-y-2">
          {stageOptions.map((option) =>
            renderCheckboxOption(option, value.stages.includes(option.value), (checked) =>
              updateFilters({
                stages: toggleListValue(value.stages, option.value, checked),
              }),
            ),
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{copy.subjectLabel}</span>
        </div>
        <div className="space-y-2">
          {subjectOptions.map((option) =>
            renderCheckboxOption(option, value.subjects.includes(option.value), (checked) =>
              updateFilters({
                subjects: toggleListValue(value.subjects, option.value, checked),
              }),
            ),
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{copy.skillLabel}</span>
        </div>
        <div className="space-y-2">
          {skillOptions.map((option) =>
            renderCheckboxOption(option, value.skills.includes(option.value), (checked) =>
              updateFilters({
                skills: toggleListValue(value.skills, option.value, checked),
              }),
            ),
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{copy.typeLabel}</span>
        </div>
        <div className="space-y-2">
          {typeOptions.map((option) =>
            renderCheckboxOption(option, value.worksheetTypes.includes(option.value), (checked) =>
              updateFilters({
                worksheetTypes: toggleListValue(
                  value.worksheetTypes,
                  option.value,
                  checked,
                ),
              }),
            ),
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{copy.difficultyLabel}</span>
        </div>
        <div className="space-y-2">
          {difficultyOptions.map((option) =>
            renderCheckboxOption(option, value.difficulties.includes(option.value), (checked) =>
              updateFilters({
                difficulties: toggleListValue(value.difficulties, option.value, checked),
              }),
            ),
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{copy.formatLabel}</span>
        </div>
        <div className="space-y-2">
          {formatOptions.map((option) =>
            renderCheckboxOption(option, value.formats.includes(option.value), (checked) =>
              updateFilters({
                formats: toggleListValue(value.formats, option.value, checked),
              }),
            ),
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-dashed p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{copy.techOnlyLabel}</p>
            <p className="text-xs text-muted-foreground">
              {copy.techOnlyDescription}
            </p>
          </div>
          <Switch
            checked={value.techIntegratedOnly}
            onCheckedChange={(checked) =>
              updateFilters({ techIntegratedOnly: checked === true })
            }
            aria-label={copy.techOnlyLabel}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{copy.answersOnlyLabel}</p>
            <p className="text-xs text-muted-foreground">
              {copy.answersOnlyDescription}
            </p>
          </div>
          <Switch
            checked={value.answersOnly}
            onCheckedChange={(checked) =>
              updateFilters({ answersOnly: checked === true })
            }
            aria-label={copy.answersOnlyLabel}
          />
        </div>
      </div>

      <Button type="button" variant="outline" onClick={onClear}>
        {copy.clearLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            {copy.title}
          </h2>
          {selectedCount > 0 ? (
            <Badge variant="secondary">{selectedCount}</Badge>
          ) : null}
        </div>
        {content}
      </div>

      <div className="lg:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
              {copy.mobileToggleLabel}
              {selectedCount > 0 ? (
                <Badge variant="secondary" className="ml-2">
                  {selectedCount}
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{copy.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 max-h-[75vh] overflow-y-auto pr-2">
              {content}
            </div>
            <SheetFooter className="mt-6 flex flex-col gap-2">
              <Button type="button" onClick={() => setIsSheetOpen(false)}>
                {copy.closeLabel}
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                onClear();
                setIsSheetOpen(false);
              }}>
                {copy.clearLabel}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
