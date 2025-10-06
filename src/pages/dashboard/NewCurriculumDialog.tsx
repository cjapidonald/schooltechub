import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { UseFormReturn } from "react-hook-form";

import type { CurriculumFormValues } from "./dashboard-forms";
import type { DashboardTranslations } from "./dashboard-utils";
import type { Class } from "../../types/supabase-tables";

interface NewCurriculumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CurriculumFormValues>;
  translations: DashboardTranslations;
  classes: Class[];
  onSubmit: (values: CurriculumFormValues) => void;
  submitting: boolean;
}

export function NewCurriculumDialog({
  open,
  onOpenChange,
  form,
  translations,
  classes,
  onSubmit,
  submitting,
}: NewCurriculumDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl border border-white/30 bg-white/10 text-white shadow-[0_35px_120px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-semibold text-white">
            {translations.dashboard.dialogs.newCurriculum.title}
          </DialogTitle>
          <p className="text-sm text-white/70">
            {translations.dashboard.curriculum.empty.description}
          </p>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="curriculum-title" className="text-sm font-medium text-white/80">
              {translations.dashboard.dialogs.newCurriculum.fields.title}
            </Label>
            <Input
              id="curriculum-title"
              className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/70 focus-visible:ring-white/40"
              {...form.register("title")}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-white/80">
              {translations.dashboard.dialogs.newCurriculum.fields.class}
            </Label>
            <Select
              value={form.watch("class_id")}
              onValueChange={value => form.setValue("class_id", value)}
            >
              <SelectTrigger className="rounded-xl border-white/30 bg-white/10 text-white focus:ring-white/40">
                <SelectValue placeholder={
                  translations.dashboard.dialogs.newCurriculum.fields.classPlaceholder
                }
                />
              </SelectTrigger>
              <SelectContent className="border border-white/20 bg-slate-900/90 text-white backdrop-blur-xl">
                {classes.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="curriculum-subject" className="text-sm font-medium text-white/80">
              {translations.dashboard.dialogs.newCurriculum.fields.subject}
            </Label>
            <Input
              id="curriculum-subject"
              className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/70 focus-visible:ring-white/40"
              {...form.register("subject")}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="curriculum-year" className="text-sm font-medium text-white/80">
              {translations.dashboard.dialogs.newCurriculum.fields.academicYear}
            </Label>
            <Input
              id="curriculum-year"
              className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/70 focus-visible:ring-white/40"
              {...form.register("academic_year")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="curriculum-lessons" className="text-sm font-medium text-white/80">
              {translations.dashboard.dialogs.newCurriculum.fields.lessonTitles}
            </Label>
            <Textarea
              id="curriculum-lessons"
              rows={6}
              placeholder={
                translations.dashboard.dialogs.newCurriculum.fields.lessonTitlesPlaceholder
              }
              className="rounded-xl border-white/30 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/40"
              {...form.register("lesson_titles")}
            />
            <p className="text-xs text-white/60">
              {translations.dashboard.dialogs.newCurriculum.helper}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              {translations.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="border-white/60 bg-white/90 text-slate-900 hover:bg-white"
            >
              {translations.dashboard.dialogs.newCurriculum.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
