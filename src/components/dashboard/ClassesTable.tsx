import { format } from "date-fns";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { Class } from "../../../types/supabase-tables";

interface ClassesTableProps {
  classes: Array<Class & { isExample?: boolean }>;
  loading?: boolean;
  onNewClass: () => void;
  onViewClass?: (classId: string) => void;
  onEditClass?: (classId: string) => void;
  className?: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "PPP");
  } catch (error) {
    console.warn("Could not format date", error);
    return value;
  }
};

export function ClassesTable({
  classes,
  loading,
  onNewClass,
  onViewClass,
  onEditClass,
  className,
}: ClassesTableProps) {
  const { t } = useLanguage();

  return (
    <section
      className={cn(
        "space-y-6 rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-[0_35px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl md:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
            {t.dashboard.classes.title}
          </h2>
          <p className="text-sm text-white/70">{t.dashboard.classes.subtitle}</p>
        </div>
        <Button
          onClick={onNewClass}
          aria-label={t.dashboard.quickActions.newClass}
          className="h-11 rounded-xl border border-white/40 bg-white/90 px-5 text-sm font-semibold text-slate-900 shadow-[0_15px_45px_-25px_rgba(255,255,255,0.9)] transition hover:bg-white"
        >
          {t.dashboard.quickActions.newClass}
        </Button>
      </div>
      <div className="rounded-3xl border border-white/20 bg-white/5 p-6 text-white/80 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
        {loading ? (
          <div className="py-10 text-center text-white/70">{t.dashboard.common.loading}</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={onNewClass}
              className="group flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/40 bg-white/5 p-6 text-center text-white/80 transition hover:border-white/70 hover:bg-white/10"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] transition group-hover:border-white/70 group-hover:bg-white/20">
                <Plus className="h-8 w-8" />
              </span>
              <span className="mt-4 text-lg font-semibold text-white">
                {t.dashboard.classes.cta?.title ?? t.dashboard.quickActions.newClass}
              </span>
              <span className="mt-2 text-sm text-white/70">
                {t.dashboard.classes.cta?.description ?? t.dashboard.classes.subtitle}
              </span>
            </button>
            {classes.length === 0 ? null : (
              classes.map(item => (
                <div
                  key={item.id}
                  className="group flex h-full flex-col gap-4 rounded-3xl border border-white/15 bg-white/10 p-6 text-white/80 shadow-[0_35px_120px_-60px_rgba(15,23,42,0.95)] backdrop-blur-2xl transition duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-[0_45px_140px_-60px_rgba(15,23,42,0.95)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        {item.isExample ? (
                          <p className="mt-1 text-xs text-white/60">{t.dashboard.common.exampleDescription}</p>
                        ) : null}
                      </div>
                      {item.stage ? (
                        <Badge variant="secondary" className="border-white/30 bg-white/15 text-xs uppercase text-white">
                          {item.stage}
                        </Badge>
                      ) : (
                        <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/50">
                          {t.dashboard.classes.columns.stage}: —
                        </span>
                      )}
                    </div>
                    {item.isExample ? (
                      <Badge variant="outline" className="w-fit border-white/40 bg-white/10 text-[11px] font-medium uppercase tracking-wide text-white/80">
                        {t.dashboard.common.exampleTag}
                      </Badge>
                    ) : null}
                    <div className="space-y-2 text-sm">
                      <div className="text-white">{item.subject || "—"}</div>
                      <div className="space-y-1 text-white/70">
                        <p>
                          <span className="font-medium text-white/80">{t.dashboard.classes.labels.start}:</span> {formatDate(item.start_date)}
                        </p>
                        <p>
                          <span className="font-medium text-white/80">{t.dashboard.classes.labels.end}:</span> {formatDate(item.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={item.isExample}
                      onClick={() => onViewClass?.(item.id)}
                      aria-label={t.dashboard.classes.actions.view}
                      className="text-white transition hover:bg-white/15 disabled:text-white/40"
                    >
                      {t.dashboard.classes.actions.view}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={item.isExample}
                      onClick={() => onEditClass?.(item.id)}
                      aria-label={t.dashboard.classes.actions.edit}
                      className="text-white transition hover:bg-white/15 disabled:text-white/40"
                    >
                      {t.dashboard.classes.actions.edit}
                    </Button>
                  </div>
                  {item.isExample ? (
                    <p className="text-xs text-white/60">{t.dashboard.common.exampleActionsDisabled}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
