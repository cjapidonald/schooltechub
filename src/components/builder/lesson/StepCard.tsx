import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Trash2 } from "lucide-react";
import { Fragment, useCallback, type ClipboardEvent } from "react";

import type { LessonBuilderStep, LessonBuilderStepResource } from "@/types/lesson-builder";

const GROUPING_OPTIONS = ["1:1", "Pairs", "Small Group", "Whole Class", "Stations"];
const DELIVERY_OPTIONS = ["In-class", "Remote", "Hybrid", "Asynchronous"];

interface StepCardCopy {
  titlePlaceholder: string;
  learningGoalsLabel: string;
  learningGoalsPlaceholder: string;
  durationLabel: string;
  durationPlaceholder: string;
  groupingLabel: string;
  deliveryLabel: string;
  instructionalNoteLabel: string;
  instructionalNotePlaceholder: string;
  searchResources: string;
  resourcesTitle: string;
  resourcesEmpty: string;
}

interface StepCardProps {
  step: LessonBuilderStep;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onChange: (updater: (step: LessonBuilderStep) => LessonBuilderStep) => void;
  onRemove?: () => void;
  onSearchResources: () => void;
  copy: StepCardCopy;
}

function normalizePastedGoals(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•*.\d-]+/, "").trim())
    .filter(Boolean)
    .join("\n");
}

export const StepCard = ({
  step,
  index,
  isActive,
  onSelect,
  onChange,
  onRemove,
  onSearchResources,
  copy,
}: StepCardProps) => {
  const handleTitleChange = useCallback(
    (value: string) => {
      onChange((current) => ({ ...current, title: value }));
    },
    [onChange]
  );

  const handleLearningGoalsChange = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      onChange((current) => ({
        ...current,
        learningGoals: trimmed.length > 0 ? value : null,
        description: trimmed.length > 0 ? value : null,
      }));
    },
    [onChange]
  );

  const handleLearningGoalsPaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      const text = event.clipboardData.getData("text");
      if (!text) {
        return;
      }
      const normalized = normalizePastedGoals(text);
      if (normalized === text) {
        return;
      }
      event.preventDefault();
      const target = event.currentTarget;
      const { selectionStart, selectionEnd, value } = target;
      const nextValue = `${value.slice(0, selectionStart)}${normalized}${value.slice(selectionEnd)}`;
      handleLearningGoalsChange(nextValue);
      requestAnimationFrame(() => {
        const position = selectionStart + normalized.length;
        target.setSelectionRange(position, position);
      });
    },
    [handleLearningGoalsChange]
  );

  const handleDurationChange = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const numeric = Number(trimmed);
      const nextDurationMinutes =
        trimmed.length > 0 && Number.isFinite(numeric) && /^\d+$/.test(trimmed)
          ? Math.max(0, Math.trunc(numeric))
          : null;

      onChange((current) => ({
        ...current,
        duration: trimmed.length > 0 ? value : null,
        durationMinutes: nextDurationMinutes,
      }));
    },
    [onChange]
  );

  const handleGroupingChange = useCallback(
    (value: string) => {
      onChange((current) => ({
        ...current,
        grouping: value || null,
      }));
    },
    [onChange]
  );

  const handleDeliveryChange = useCallback(
    (value: string) => {
      onChange((current) => ({
        ...current,
        delivery: value || null,
      }));
    },
    [onChange]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      onChange((current) => ({ ...current, notes: value.trim().length > 0 ? value : null }));
    },
    [onChange]
  );

  const handleRemoveResource = useCallback(
    (resource: LessonBuilderStepResource) => {
      onChange((current) => ({
        ...current,
        resources: current.resources.filter((item) => {
          if (!item.id && !resource.id) {
            return item.url !== resource.url;
          }
          return item.id !== resource.id;
        }),
      }));
    },
    [onChange]
  );

  const durationValue = step.duration ?? (typeof step.durationMinutes === "number" ? String(step.durationMinutes) : "");
  const learningGoalsValue = step.learningGoals ?? step.description ?? "";

  return (
    <Card
      className={`border ${isActive ? "border-primary" : "border-border"} transition-colors`}
      onClick={onSelect}
      data-testid={`builder-step-${index}`}
    >
      <CardContent className="space-y-5 p-4">
        <div className="flex items-center justify-between">
          <Badge variant={isActive ? "default" : "outline"}>{index + 1}</Badge>
          {onRemove ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              ×
            </Button>
          ) : null}
        </div>

        <Input
          value={step.title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder={copy.titlePlaceholder}
          onClick={(event) => event.stopPropagation()}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`step-${step.id}-learning-goals`}>
            {copy.learningGoalsLabel}
          </label>
          <Textarea
            id={`step-${step.id}-learning-goals`}
            value={learningGoalsValue}
            placeholder={copy.learningGoalsPlaceholder}
            className="min-h-[100px] whitespace-pre-wrap"
            onClick={(event) => event.stopPropagation()}
            onPaste={handleLearningGoalsPaste}
            onChange={(event) => handleLearningGoalsChange(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-duration`}>
              {copy.durationLabel}
            </label>
            <Input
              id={`step-${step.id}-duration`}
              value={durationValue}
              placeholder={copy.durationPlaceholder}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => handleDurationChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-grouping`}>
              {copy.groupingLabel}
            </label>
            <Select
              value={step.grouping ?? undefined}
              onValueChange={(value) => handleGroupingChange(value)}
            >
              <SelectTrigger id={`step-${step.id}-grouping`} onClick={(event) => event.stopPropagation()}>
                <SelectValue placeholder={copy.groupingLabel} />
              </SelectTrigger>
              <SelectContent align="start">
                {GROUPING_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-delivery`}>
              {copy.deliveryLabel}
            </label>
            <Select
              value={step.delivery ?? undefined}
              onValueChange={(value) => handleDeliveryChange(value)}
            >
              <SelectTrigger id={`step-${step.id}-delivery`} onClick={(event) => event.stopPropagation()}>
                <SelectValue placeholder={copy.deliveryLabel} />
              </SelectTrigger>
              <SelectContent align="start">
                {DELIVERY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`step-${step.id}-notes`}>
            {copy.instructionalNoteLabel}
          </label>
          <Textarea
            id={`step-${step.id}-notes`}
            value={step.notes ?? ""}
            placeholder={copy.instructionalNotePlaceholder}
            className="min-h-[100px]"
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => handleNotesChange(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">{copy.resourcesTitle}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onSearchResources();
              }}
            >
              {copy.searchResources}
            </Button>
          </div>
          {step.resources.length === 0 ? (
            <p className="text-xs text-muted-foreground">{copy.resourcesEmpty}</p>
          ) : (
            <div className="space-y-3">
              {step.resources.map((resource) => (
                <Fragment key={resource.id ?? resource.url}>
                  <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                    <div className="space-y-1">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {resource.label}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                      <div className="flex flex-wrap gap-2">
                        {resource.type ? (
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                            {resource.type}
                          </Badge>
                        ) : null}
                        {resource.domain ? (
                          <Badge variant="outline" className="text-[10px]">
                            {resource.domain}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveResource(resource);
                      }}
                      aria-label="Remove resource"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
