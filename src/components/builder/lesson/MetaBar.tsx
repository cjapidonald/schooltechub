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
}

interface MetaBarProps {
  plan: LessonBuilderPlan;
  copy: MetaBarCopy;
  onUpdate: (updater: (plan: LessonBuilderPlan) => LessonBuilderPlan) => void;
  profileId: string | null;
}

export const MetaBar = ({ plan, copy, onUpdate, profileId }: MetaBarProps) => {
  const [isDateOpen, setIsDateOpen] = useState(false);

  const handleTitleChange = (value: string) => {
    onUpdate((current) => ({ ...current, title: value }));
  };

  const handleSummaryChange = (value: string) => {
    onUpdate((current) => ({ ...current, summary: value.length > 0 ? value : null }));
  };

  const handleLogoChange = (url: string | null) => {
    onUpdate((current) => ({ ...current, schoolLogoUrl: url }));
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
          <p className="text-sm font-medium text-muted-foreground">{copy.summaryLabel}</p>
          <Textarea
            value={plan.summary ?? ""}
            onChange={(event) => handleSummaryChange(event.target.value)}
            placeholder={copy.summaryLabel}
            className="min-h-[120px]"
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
