import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClass, type Class } from "@/lib/classes";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type ClassFormState = {
  title: string;
  summary: string;
  subject: string;
  stage: string;
  startDate: string;
  endDate: string;
  meetingSchedule: string;
  meetingLink: string;
  maxCapacity: string;
};

const initialFormState: ClassFormState = {
  title: "",
  summary: "",
  subject: "",
  stage: "",
  startDate: "",
  endDate: "",
  meetingSchedule: "",
  meetingLink: "",
  maxCapacity: "",
};

export interface ClassCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (createdClass: Class) => void;
}

export function ClassCreateDialog({ open, onOpenChange, onCreated }: ClassCreateDialogProps) {
  const { toast } = useToast();
  const [formState, setFormState] = useState<ClassFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFormState(initialFormState);
      setFormError(null);
    }
  }, [open]);

  const createClassMutation = useMutation({
    mutationFn: async (values: ClassFormState) => {
      const parsedCapacity = values.maxCapacity.trim();
      const maxCapacity = parsedCapacity.length > 0 ? Number.parseInt(parsedCapacity, 10) : null;

      const payload = {
        title: values.title.trim(),
        summary: values.summary.trim() || null,
        subject: values.subject.trim() || null,
        stage: values.stage.trim() || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        meetingSchedule: values.meetingSchedule.trim() || null,
        meetingLink: values.meetingLink.trim() || null,
        maxCapacity: Number.isNaN(maxCapacity) ? null : maxCapacity,
      };

      return createClass(payload);
    },
    onSuccess: created => {
      toast({
        title: "Class created",
        description: `“${created.title}” has been added to your classes.`,
      });
      setFormState(initialFormState);
      setFormError(null);
      onOpenChange(false);
      onCreated?.(created);
    },
    onError: error => {
      toast({
        title: "Unable to create class",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = formState.title.trim();
    if (!trimmedTitle) {
      setFormError("Title is required.");
      return;
    }

    setFormError(null);
    createClassMutation.mutate(formState);
  };

  const handleChange = (field: keyof ClassFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState(prev => ({ ...prev, [field]: event.target.value }));
      if (formError) {
        setFormError(null);
      }
    };

  const isSubmitting = createClassMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a class</DialogTitle>
          <DialogDescription>
            Add the key details about your class to help keep schedules organised.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="class-title">Title</Label>
            <Input
              id="class-title"
              value={formState.title}
              onChange={handleChange("title")}
              placeholder="e.g. Year 6 Science"
              disabled={isSubmitting}
              required
            />
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-summary">Summary</Label>
            <Textarea
              id="class-summary"
              value={formState.summary}
              onChange={handleChange("summary")}
              placeholder="What will this class cover?"
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class-subject">Subject</Label>
              <Input
                id="class-subject"
                value={formState.subject}
                onChange={handleChange("subject")}
                placeholder="Math, History, ..."
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-stage">Stage</Label>
              <Input
                id="class-stage"
                value={formState.stage}
                onChange={handleChange("stage")}
                placeholder="Grade 4, Secondary, ..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class-start-date">Start date</Label>
              <Input
                id="class-start-date"
                type="date"
                value={formState.startDate}
                onChange={handleChange("startDate")}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-end-date">End date</Label>
              <Input
                id="class-end-date"
                type="date"
                value={formState.endDate}
                onChange={handleChange("endDate")}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-meeting-schedule">Meeting schedule</Label>
            <Input
              id="class-meeting-schedule"
              value={formState.meetingSchedule}
              onChange={handleChange("meetingSchedule")}
              placeholder="e.g. Mondays at 3:30 PM"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-meeting-link">Meeting link</Label>
            <Input
              id="class-meeting-link"
              type="url"
              value={formState.meetingLink}
              onChange={handleChange("meetingLink")}
              placeholder="https://..."
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-max-capacity">Max capacity</Label>
            <Input
              id="class-max-capacity"
              type="number"
              inputMode="numeric"
              min={0}
              value={formState.maxCapacity}
              onChange={handleChange("maxCapacity")}
              placeholder="Optional"
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating
                </>
              ) : (
                "Create class"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ClassCreateDialog;
