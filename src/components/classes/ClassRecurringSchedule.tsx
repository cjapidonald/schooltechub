import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMinutes,
  differenceInCalendarWeeks,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ClassScheduleOccurrence {
  start: string;
  end: string;
}

type RecurrenceFrequency = "daily" | "weekly";
type RecurrenceEnd = "count" | "date";

interface RecurringScheduleConfig {
  startDate: string;
  startTime: string;
  durationMinutes: number;
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: number[];
  endType: RecurrenceEnd;
  occurrenceCount: number;
  endDate: string | null;
}

export interface ClassRecurringScheduleProps {
  classId: string;
  onOccurrencesChange?: (occurrences: ClassScheduleOccurrence[]) => void;
}

const STORAGE_PREFIX = "class-schedule";
const MAX_GENERATED_OCCURRENCES = 60;
const MAX_ITERATIONS = 730; // Roughly two years of weekly checks.

const dayOptions: { value: number; label: string }[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const createDefaultConfig = (): RecurringScheduleConfig => {
  const now = new Date();
  const startDate = format(now, "yyyy-MM-dd");
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return {
    startDate,
    startTime: defaultTime,
    durationMinutes: 45,
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [now.getDay()],
    endType: "count",
    occurrenceCount: 10,
    endDate: null,
  };
};

function normalizeConfig(value: Partial<RecurringScheduleConfig> | null | undefined): RecurringScheduleConfig {
  const fallback = createDefaultConfig();
  if (!value) {
    return fallback;
  }

  return {
    startDate: value.startDate ?? fallback.startDate,
    startTime: value.startTime ?? fallback.startTime,
    durationMinutes: value.durationMinutes ?? fallback.durationMinutes,
    frequency: value.frequency ?? fallback.frequency,
    interval: value.interval && value.interval > 0 ? value.interval : fallback.interval,
    daysOfWeek:
      Array.isArray(value.daysOfWeek) && value.daysOfWeek.length > 0
        ? Array.from(new Set(value.daysOfWeek.filter(day => day >= 0 && day <= 6))).sort()
        : fallback.daysOfWeek,
    endType: value.endType ?? fallback.endType,
    occurrenceCount: value.occurrenceCount && value.occurrenceCount > 0 ? value.occurrenceCount : fallback.occurrenceCount,
    endDate: value.endDate ?? fallback.endDate,
  } satisfies RecurringScheduleConfig;
}

function generateOccurrences(config: RecurringScheduleConfig): ClassScheduleOccurrence[] {
  if (!config.startDate) {
    return [];
  }

  const startDateString = `${config.startDate}T${config.startTime || "00:00"}:00`;
  const startDateTime = parseISO(startDateString);

  if (!isValid(startDateTime)) {
    return [];
  }

  const activeDays = config.frequency === "weekly"
    ? (config.daysOfWeek.length > 0 ? config.daysOfWeek : [startDateTime.getDay()])
    : [];

  const duration = config.durationMinutes > 0 ? config.durationMinutes : 45;
  const limit = config.endType === "count" ? Math.min(config.occurrenceCount, MAX_GENERATED_OCCURRENCES) : MAX_GENERATED_OCCURRENCES;
  const untilDate =
    config.endType === "date" && config.endDate
      ? (() => {
          const parsed = parseISO(`${config.endDate}T23:59:59`);
          return isValid(parsed) ? parsed : null;
        })()
      : null;

  const results: ClassScheduleOccurrence[] = [];

  if (config.frequency === "daily") {
    let current = startDateTime;
    let iterations = 0;

    while (results.length < limit && iterations < MAX_ITERATIONS) {
      if (untilDate && isAfter(current, untilDate)) {
        break;
      }

      results.push({
        start: current.toISOString(),
        end: addMinutes(current, duration).toISOString(),
      });

      current = addDays(current, config.interval > 0 ? config.interval : 1);
      iterations += 1;
    }

    return results;
  }

  const baseDay = startOfDay(startDateTime);
  const hours = startDateTime.getHours();
  const minutes = startDateTime.getMinutes();

  let dayCursor = baseDay;
  let iterations = 0;

  while (results.length < limit && iterations < MAX_ITERATIONS) {
    const candidate = setMinutes(setHours(dayCursor, hours), minutes);

    if (!isBefore(candidate, startDateTime)) {
      const weeksFromStart = Math.max(
        0,
        differenceInCalendarWeeks(candidate, startDateTime, { weekStartsOn: 0 }),
      );
      if (weeksFromStart % (config.interval > 0 ? config.interval : 1) === 0 && activeDays.includes(candidate.getDay())) {
        if (untilDate && isAfter(candidate, untilDate)) {
          break;
        }

        results.push({
          start: candidate.toISOString(),
          end: addMinutes(candidate, duration).toISOString(),
        });
      }
    }

    dayCursor = addDays(dayCursor, 1);
    iterations += 1;
  }

  return results;
}

export function ClassRecurringSchedule({ classId, onOccurrencesChange }: ClassRecurringScheduleProps) {
  const { t } = useLanguage();
  const [config, setConfig] = useState<RecurringScheduleConfig>(createDefaultConfig());
  const savedConfigRef = useRef<RecurringScheduleConfig>(createDefaultConfig());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedRaw = window.localStorage.getItem(`${STORAGE_PREFIX}:${classId}`);
    const nextConfig = normalizeConfig(storedRaw ? (JSON.parse(storedRaw) as Partial<RecurringScheduleConfig>) : null);
    savedConfigRef.current = nextConfig;
    setConfig(nextConfig);
    setIsHydrated(true);
  }, [classId]);

  const occurrences = useMemo(() => generateOccurrences(config), [config]);

  useEffect(() => {
    if (onOccurrencesChange) {
      onOccurrencesChange(occurrences);
    }
  }, [occurrences, onOccurrencesChange]);

  const isDirty = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedConfigRef.current);
  }, [config]);

  const handleConfigChange = useCallback(<K extends keyof RecurringScheduleConfig>(key: K, value: RecurringScheduleConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleDay = (dayValue: number) => {
    setConfig(prev => {
      const set = new Set(prev.daysOfWeek);
      if (set.has(dayValue)) {
        set.delete(dayValue);
      } else {
        set.add(dayValue);
      }
      const next = Array.from(set).filter(day => day >= 0 && day <= 6).sort();
      return { ...prev, daysOfWeek: next.length > 0 ? next : [dayValue] };
    });
  };

  const handleSave = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(`${STORAGE_PREFIX}:${classId}`, JSON.stringify(config));
    savedConfigRef.current = config;
  };

  const handleReset = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(`${STORAGE_PREFIX}:${classId}`);
    const next = createDefaultConfig();
    savedConfigRef.current = next;
    setConfig(next);
  };

  const scheduleSummary = useMemo(() => {
    if (occurrences.length === 0) {
      return t.account.classes.schedule.summaryEmpty;
    }

    const first = occurrences[0];
    const formattedFirst = format(parseISO(first.start), "PPP p");
    if (config.frequency === "daily") {
      return t.account.classes.schedule.summaryDaily.replace("{date}", formattedFirst);
    }

    const selectedDays = config.daysOfWeek.length > 0 ? config.daysOfWeek : [parseISO(first.start).getDay()];
    const labels = dayOptions
      .filter(option => selectedDays.includes(option.value))
      .map(option => option.label);
    const daySummary = labels.join(", ");
    return t.account.classes.schedule.summaryWeekly
      .replace("{days}", daySummary)
      .replace("{date}", formattedFirst);
  }, [config.daysOfWeek, config.frequency, occurrences, t.account.classes.schedule]);

  const helperCopy = config.frequency === "daily"
    ? t.account.classes.schedule.frequencyDailyHelper
    : t.account.classes.schedule.frequencyWeeklyHelper;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.account.classes.schedule.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">{t.account.classes.schedule.description}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="class-schedule-start-date">{t.account.classes.schedule.startDate}</Label>
            <Input
              id="class-schedule-start-date"
              type="date"
              value={config.startDate}
              onChange={event => handleConfigChange("startDate", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-schedule-start-time">{t.account.classes.schedule.startTime}</Label>
            <Input
              id="class-schedule-start-time"
              type="time"
              value={config.startTime}
              onChange={event => handleConfigChange("startTime", event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="class-schedule-frequency">{t.account.classes.schedule.frequencyLabel}</Label>
            <Select
              value={config.frequency}
              onValueChange={value => handleConfigChange("frequency", value as RecurrenceFrequency)}
            >
              <SelectTrigger id="class-schedule-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t.account.classes.schedule.frequencyOptions.daily}</SelectItem>
                <SelectItem value="weekly">{t.account.classes.schedule.frequencyOptions.weekly}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{helperCopy}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-schedule-interval">{t.account.classes.schedule.intervalLabel}</Label>
            <Input
              id="class-schedule-interval"
              type="number"
              min={1}
              value={config.interval}
              onChange={event => handleConfigChange("interval", Number(event.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">{t.account.classes.schedule.intervalHelper}</p>
          </div>
        </div>

        {config.frequency === "weekly" ? (
          <div className="space-y-2">
            <Label>{t.account.classes.schedule.weeklyDays}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {dayOptions.map(option => {
                const checked = config.daysOfWeek.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleDay(option.value)}
                      aria-label={option.label}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="class-schedule-duration">{t.account.classes.schedule.durationLabel}</Label>
            <Input
              id="class-schedule-duration"
              type="number"
              min={5}
              value={config.durationMinutes}
              onChange={event => handleConfigChange("durationMinutes", Number(event.target.value) || 45)}
            />
            <p className="text-xs text-muted-foreground">{t.account.classes.schedule.durationHelper}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-schedule-end-type">{t.account.classes.schedule.endLabel}</Label>
            <Select
              value={config.endType}
              onValueChange={value => handleConfigChange("endType", value as RecurrenceEnd)}
            >
              <SelectTrigger id="class-schedule-end-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">{t.account.classes.schedule.endOptions.count}</SelectItem>
                <SelectItem value="date">{t.account.classes.schedule.endOptions.date}</SelectItem>
              </SelectContent>
            </Select>
            {config.endType === "count" ? (
              <div className="mt-2 space-y-2">
                <Label htmlFor="class-schedule-occurrence-count" className="text-xs font-medium">
                  {t.account.classes.schedule.endCountLabel}
                </Label>
                <Input
                  id="class-schedule-occurrence-count"
                  type="number"
                  min={1}
                  value={config.occurrenceCount}
                  onChange={event => handleConfigChange("occurrenceCount", Number(event.target.value) || 1)}
                />
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <Label htmlFor="class-schedule-end-date" className="text-xs font-medium">
                  {t.account.classes.schedule.endDateLabel}
                </Label>
                <Input
                  id="class-schedule-end-date"
                  type="date"
                  value={config.endDate ?? ""}
                  min={config.startDate}
                  onChange={event => handleConfigChange("endDate", event.target.value || null)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleSave} disabled={!isHydrated || !isDirty}>
            {t.account.classes.schedule.saveButton}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            {t.account.classes.schedule.resetButton}
          </Button>
          <Badge variant="secondary">{scheduleSummary}</Badge>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t.account.classes.schedule.occurrencesTitle.replace("{count}", String(occurrences.length))}
          </h3>
          {occurrences.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t.account.classes.schedule.occurrencesEmpty}
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {occurrences.slice(0, 10).map(occurrence => (
                <li key={occurrence.start} className="flex items-center justify-between rounded-md border p-2">
                  <span>{format(parseISO(occurrence.start), "PPP p")}</span>
                  <span>
                    {t.account.classes.schedule.durationShort.replace(
                      "{minutes}",
                      String(config.durationMinutes),
                    )}
                  </span>
                </li>
              ))}
              {occurrences.length > 10 ? (
                <li className="text-xs text-muted-foreground">
                  {t.account.classes.schedule.additionalOccurrences.replace(
                    "{count}",
                    String(occurrences.length - 10),
                  )}
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ClassRecurringSchedule;
