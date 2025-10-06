import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { UseFormReturn } from "react-hook-form";

import type { ClassFormValues } from "./dashboard-forms";
import type { DashboardTranslations } from "./dashboard-utils";

interface NewClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ClassFormValues>;
  translations: DashboardTranslations;
  onSubmit: (values: ClassFormValues) => void;
  submitting: boolean;
}

export function NewClassDialog({
  open,
  onOpenChange,
  form,
  translations,
  onSubmit,
  submitting,
}: NewClassDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{translations.dashboard.dialogs.newClass.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="class-title">
              {translations.dashboard.dialogs.newClass.fields.title}
            </Label>
            <Input id="class-title" {...form.register("title")} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="class-stage">
              {translations.dashboard.dialogs.newClass.fields.stage}
            </Label>
            <Input id="class-stage" {...form.register("stage")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="class-subject">
              {translations.dashboard.dialogs.newClass.fields.subject}
            </Label>
            <Input id="class-subject" {...form.register("subject")} />
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="class-start">
                {translations.dashboard.dialogs.newClass.fields.startDate}
              </Label>
              <Input id="class-start" type="date" {...form.register("start_date")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class-end">
                {translations.dashboard.dialogs.newClass.fields.endDate}
              </Label>
              <Input id="class-end" type="date" {...form.register("end_date")} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {translations.common.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {translations.dashboard.dialogs.newClass.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
