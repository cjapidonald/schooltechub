import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { Class } from "../../../types/supabase-tables";
import { Plus } from "lucide-react";

type ClassHighlight = {
  students: string[];
  curriculum: string[];
};

interface ClassesTableProps {
  classes: Array<Class & { isExample?: boolean }>;
  loading?: boolean;
  onNewClass: () => void;
  onViewClass?: (classId: string) => void;
  onEditClass?: (classId: string) => void;
  className?: string;
  enrichments?: Record<string, ClassHighlight>;
}

export function ClassesTable({
  classes,
  loading,
  onNewClass,
  onViewClass,
  onEditClass,
  className,
  enrichments,
}: ClassesTableProps) {
  const { t } = useLanguage();
  const hasClasses = classes.length > 0;

  return (
    <section
      className={cn(
        "space-y-6 rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-[0_35px_120px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl md:p-8",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
          {t.dashboard.classes.title}
        </h2>
        <p className="text-sm text-white/70">{t.dashboard.classes.subtitle}</p>
      </div>
      <div className="rounded-3xl border border-white/20 bg-white/5 p-6 text-white/80 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
        {loading ? (
          <div className="py-10 text-center text-white/70">{t.dashboard.common.loading}</div>
        ) : (
          <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={onNewClass}
              aria-label={t.dashboard.quickActions.newClass}
              className="group flex h-full min-h-[240px] flex-col justify-between gap-6 rounded-3xl border border-dashed border-white/30 bg-white/10 p-6 text-left text-white/70 shadow-[0_35px_120px_-60px_rgba(15,23,42,0.95)] transition hover:border-white/60 hover:bg-white/15 hover:text-white"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-white transition group-hover:border-white/60 group-hover:bg-white/20">
                <Plus className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">{t.dashboard.quickActions.newClass}</h3>
                <p className="text-sm text-white/70">
                  Plan your roster and curriculum outline from the same setup screen.
                </p>
              </div>
            </button>
            {hasClasses
              ? classes.map(item => {
                  const highlight = enrichments?.[item.id];
                  const studentPreview = highlight?.students.slice(0, 3) ?? [];
                  const extraStudents = Math.max((highlight?.students.length ?? 0) - studentPreview.length, 0);
                  const lessonPreview = highlight?.curriculum.slice(0, 3) ?? [];
                  const extraLessons = Math.max((highlight?.curriculum.length ?? 0) - lessonPreview.length, 0);

                  return (
                    <div
                      key={item.id}
                      className="group flex h-full min-h-[240px] flex-col gap-5 rounded-3xl border border-white/15 bg-white/10 p-6 text-white/80 shadow-[0_35px_120px_-60px_rgba(15,23,42,0.95)] backdrop-blur-2xl transition duration-300 hover:border-white/30 hover:bg-white/15 hover:text-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                          <p className="text-sm text-white/70">{item.subject || "Subject not set yet"}</p>
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
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/60">Students</p>
                          {studentPreview.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/80">
                              {studentPreview.map((name, index) => (
                                <span
                                  key={`${item.id}-student-${index}`}
                                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1"
                                >
                                  {name}
                                </span>
                              ))}
                              {extraStudents > 0 ? (
                                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/60">
                                  + {extraStudents} more
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-white/60">No students added yet.</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/60">Curriculum lessons</p>
                          {lessonPreview.length > 0 ? (
                            <>
                              <ul className="mt-2 space-y-2 text-white/80">
                                {lessonPreview.map((lesson, index) => (
                                  <li key={`${item.id}-lesson-${index}`} className="flex items-start gap-3 text-left">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[11px] font-semibold text-white/80">
                                      {index + 1}
                                    </span>
                                    <span className="text-sm leading-snug">{lesson}</span>
                                  </li>
                                ))}
                              </ul>
                              {extraLessons > 0 ? (
                                <p className="mt-2 text-xs text-white/60">
                                  + {extraLessons} more lesson{extraLessons === 1 ? "" : "s"}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <p className="mt-2 text-xs text-white/60">Add lesson titles from the curriculum tab.</p>
                          )}
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
                  );
                })
              : null}
            {hasClasses ? null : (
              <div className="col-span-full flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-3xl border border-white/15 bg-white/5 p-6 text-center text-sm text-white/70">
                <p>{t.dashboard.classes.empty}</p>
                <p className="text-xs text-white/50">Click the card above to add your first class.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
