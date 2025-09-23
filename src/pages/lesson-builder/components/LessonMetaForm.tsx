import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyClasses } from "@/hooks/useMyClasses";
import { SUBJECTS, type Subject } from "@/lib/constants/subjects";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const STORAGE_DATE_FORMAT = "yyyy-MM-dd";
const DISPLAY_DATE_FORMAT = "PPP";
const NO_SUBJECT_VALUE = "__no_subject__";
const EMPTY_CLASS_VALUE = "__no_class__";

export interface LessonMetaFormValue {
  title: string;
  subject: Subject | null;
  classId: string | null;
  date: string | null;
}

interface LessonMetaFormProps {
  value: LessonMetaFormValue;
  onChange: (value: LessonMetaFormValue) => void;
  onSubmit?: (value: LessonMetaFormValue) => void;
  isSubmitting?: boolean;
}

function parseStoredDate(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(part => Number.parseInt(part, 10));
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

export function LessonMetaForm({ value, onChange, onSubmit, isSubmitting }: LessonMetaFormProps) {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const { classes, isLoading, error } = useMyClasses();
  const { language } = useLanguage();
  const accountClassesPath = useMemo(
    () => getLocalizedPath("/account?tab=classes", language),
    [language],
  );

  useEffect(() => {
    if (value.date) {
      return;
    }

    const today = format(new Date(), STORAGE_DATE_FORMAT);
    if (value.date === today) {
      return;
    }

    onChange({ ...value, date: today });
  }, [value, onChange]);

  const selectedDate = useMemo(() => parseStoredDate(value.date), [value.date]);
  const formattedDate = selectedDate ? format(selectedDate, DISPLAY_DATE_FORMAT) : "Select a date";

  const handleTitleChange = (title: string) => {
    onChange({ ...value, title });
  };

  const handleSubjectChange = (subjectValue: string) => {
    const nextSubject = subjectValue === NO_SUBJECT_VALUE ? null : (subjectValue as Subject);
    onChange({ ...value, subject: nextSubject });
  };

  const handleClassChange = (classValue: string) => {
    const nextClassId = classValue === EMPTY_CLASS_VALUE ? null : classValue;
    onChange({ ...value, classId: nextClassId });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      return;
    }

    const stored = format(date, STORAGE_DATE_FORMAT);
    onChange({ ...value, date: stored });
    setIsDateOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.title.trim()) {
      return;
    }

    onSubmit?.(value);
  };

  const canSubmit = value.title.trim().length > 0 && !isSubmitting;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="lesson-meta-title">Title</Label>
        <Input
          id="lesson-meta-title"
          value={value.title}
          onChange={event => handleTitleChange(event.target.value)}
          placeholder="e.g. Exploring fractions"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lesson-meta-subject">Subject</Label>
          <Select value={value.subject ?? undefined} onValueChange={handleSubjectChange}>
            <SelectTrigger id="lesson-meta-subject">
              <SelectValue placeholder="Choose a subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SUBJECT_VALUE}>No subject</SelectItem>
              {SUBJECTS.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lesson-meta-class">Class</Label>
          <Select value={value.classId ?? EMPTY_CLASS_VALUE} onValueChange={handleClassChange}>
            <SelectTrigger id="lesson-meta-class" disabled={isLoading}>
              <SelectValue placeholder={isLoading ? "Loading classes…" : "Select a class"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_CLASS_VALUE}>No class</SelectItem>
              {classes.map(classItem => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error ? (
            <p className="text-sm text-destructive">{error.message}</p>
          ) : null}
          {!isLoading && !error && classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't created any classes yet.{' '}
              <Link
                to={accountClassesPath}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Go to your account's Classes tab
              </Link>{' '}
              to create one.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lesson-meta-date">Date</Label>
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild>
            <Button
              id="lesson-meta-date"
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formattedDate}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate ?? new Date()}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default LessonMetaForm;
