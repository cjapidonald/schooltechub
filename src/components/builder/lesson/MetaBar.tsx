import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LogoUploader } from "./LogoUploader";
import type { LessonBuilderPlan } from "@/types/lesson-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LessonPlanOverview } from "@/types/lesson-plans";

function ensureOverview(plan: LessonBuilderPlan): LessonPlanOverview {
  const candidate = (plan.overview ?? {}) as Partial<LessonPlanOverview> & {
    successCriteria?: unknown;
  };

  return {
    summary: candidate.summary ?? null,
    essentialQuestion: candidate.essentialQuestion ?? null,
    objectives: Array.isArray(candidate.objectives) ? candidate.objectives : [],
    successCriteria: Array.isArray(candidate.successCriteria)
      ? (candidate.successCriteria as string[])
      : [],
    materials: Array.isArray(candidate.materials) ? candidate.materials : [],
    assessment: Array.isArray(candidate.assessment) ? candidate.assessment : [],
    technology: Array.isArray(candidate.technology) ? candidate.technology : [],
    delivery: Array.isArray(candidate.delivery) ? candidate.delivery : [],
    stage: (candidate.stage ?? plan.stage) ?? null,
    subjects: Array.isArray(candidate.subjects) ? candidate.subjects : plan.subjects ?? [],
    durationMinutes:
      typeof candidate.durationMinutes === "number" && Number.isFinite(candidate.durationMinutes)
        ? candidate.durationMinutes
        : plan.durationMinutes ?? null,
  };
}

const STORAGE_DATE_FORMAT = "yyyy-MM-dd";

interface MetaBarCopy {
  titleLabel: string;
  summaryLabel: string;
  stageLabel: string;
  subjectsLabel: string;
  durationLabel: string;
  technologyLabel: string;
  logoLabel: string;
  logoChangeLabel: string;
  logoUploadingLabel: string;
  logoAlt: string;
  dateLabel: string;
  datePlaceholder: string;
  stagePlaceholder: string;
  objectivesLabel: string;
  objectivesPlaceholder: string;
  successCriteriaLabel: string;
  successCriteriaPlaceholder: string;
}

interface MetaBarProps {
  plan: LessonBuilderPlan;
  copy: MetaBarCopy;
  onUpdate: (updater: (plan: LessonBuilderPlan) => LessonBuilderPlan) => void;
  profileId: string | null;
}

const CLEAR_STAGE_VALUE = "__no_stage__";

export const MetaBar = ({ plan, copy, onUpdate, profileId }: MetaBarProps) => {
  const [isDateOpen, setIsDateOpen] = useState(false);

  const stageOptions = useMemo(() => {
    const unique = new Set(plan.stages ?? []);
    if (plan.stage) {
      unique.add(plan.stage);
    }
    return Array.from(unique);
  }, [plan.stage, plan.stages]);

  const objectivesValue = Array.isArray(plan.overview?.objectives)
    ? plan.overview?.objectives.join("\n")
    : "";

  const successCriteriaValue = Array.isArray(plan.overview?.successCriteria)
    ? plan.overview?.successCriteria.join("\n")
    : "";

  const handleTitleChange = (value: string) => {
    onUpdate((current) => ({ ...current, title: value }));
  };

  const handleSummaryChange = (value: string) => {
    onUpdate((current) => {
      const summary = value.length > 0 ? value : null;
      const overview = ensureOverview(current);
      return { ...current, summary, overview: { ...overview, summary } };
    });
  };

  const handleLogoChange = (url: string | null) => {
    onUpdate((current) => ({ ...current, schoolLogoUrl: url }));
  };

  const handleStageChange = (value: string) => {
    const effectiveValue = value === CLEAR_STAGE_VALUE ? "" : value;
    const trimmed = effectiveValue.trim();
    onUpdate((current) => {
      const nextStage = trimmed.length > 0 ? trimmed : null;
      const overview = ensureOverview(current);
      return {
        ...current,
        stage: nextStage,
        overview: { ...overview, stage: nextStage },
      };
    });
  };

  const handleObjectivesChange = (value: string) => {
    const items = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    onUpdate((current) => {
      const overview = ensureOverview(current);
      return {
        ...current,
        overview: { ...overview, objectives: items },
      };
    });
  };

  const handleSuccessCriteriaChange = (value: string) => {
    const items = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    onUpdate((current) => {
      const overview = ensureOverview(current);
      return {
        ...current,
        overview: { ...overview, successCriteria: items },
      };
    });
  };

  const selectedDate = useMemo(() => {
    if (!plan.lessonDate) {
      return undefined;
    }
    const [year, month, day] = plan.lessonDate.split("-").map((part) => Number.parseInt(part, 10));
    if (!year || !month || !day) {
      return undefined;
    }
    return new Date(year, month - 1, day);
  }, [plan.lessonDate]);

  const formattedDate = selectedDate ? format(selectedDate, "PPP") : copy.datePlaceholder;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      return;
    }
    const stored = format(date, STORAGE_DATE_FORMAT);
    onUpdate((current) => ({ ...current, lessonDate: stored }));
    setIsDateOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{copy.titleLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Input
            value={plan.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder={copy.titleLabel}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{copy.stageLabel}</p>
          <Select value={plan.stage ?? CLEAR_STAGE_VALUE} onValueChange={handleStageChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={copy.stagePlaceholder} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={CLEAR_STAGE_VALUE}>{copy.stagePlaceholder}</SelectItem>
              {stageOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{copy.summaryLabel}</p>
          <Textarea
            value={plan.summary ?? ""}
            onChange={(event) => handleSummaryChange(event.target.value)}
            placeholder={copy.summaryLabel}
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{copy.objectivesLabel}</p>
          <Textarea
            value={objectivesValue}
            onChange={(event) => handleObjectivesChange(event.target.value)}
            placeholder={copy.objectivesPlaceholder}
            className="min-h-[120px] whitespace-pre-wrap"
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{copy.successCriteriaLabel}</p>
          <Textarea
            value={successCriteriaValue}
            onChange={(event) => handleSuccessCriteriaChange(event.target.value)}
            placeholder={copy.successCriteriaPlaceholder}
            className="min-h-[120px] whitespace-pre-wrap"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-[auto,1fr] md:items-center">
          <LogoUploader
            value={plan.schoolLogoUrl}
            profileId={profileId}
            onChange={handleLogoChange}
            label={copy.logoLabel}
            changeLabel={copy.logoChangeLabel}
            uploadingLabel={copy.logoUploadingLabel}
            alt={copy.logoAlt}
            inputTestId="logo-input"
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{copy.dateLabel}</p>
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className={!selectedDate ? "text-muted-foreground" : undefined}>{formattedDate}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetaGroup label={copy.stageLabel} values={plan.stage ? [plan.stage] : []} />
          <MetaGroup label={copy.subjectsLabel} values={plan.subjects} />
          <MetaGroup
            label={copy.durationLabel}
            values={plan.durationMinutes != null ? [`${plan.durationMinutes} min`] : []}
          />
          <MetaGroup label={copy.technologyLabel} values={plan.technologyTags} />
        </div>
      </CardContent>
    </Card>
  );
};

interface MetaGroupProps {
  label: string;
  values: string[];
}

const MetaGroup = ({ label, values }: MetaGroupProps) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
    {values.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={value} variant="secondary">
            {value}
          </Badge>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">—</p>
    )}
  </div>
);
