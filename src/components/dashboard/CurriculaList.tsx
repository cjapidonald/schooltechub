import { format } from "date-fns";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Class, Curriculum } from "../../../types/supabase-tables";

type CurriculumSummary = Curriculum & {
  class: Class | null;
  items_count: number;
  created_at?: string;
  isExample?: boolean;
};

interface CurriculaListProps {
  curricula: CurriculumSummary[];
  loading?: boolean;
  onNewCurriculum: () => void;
  onOpenCurriculum: (curriculumId: string) => void;
  onExportCurriculum: (curriculumId: string) => void;
}

const formatYear = (value?: string | null) => (value ? value : "—");
const formatCreatedAt = (value?: string) => {
  if (!value) return "";
  try {
    return format(new Date(value), "PP");
  } catch (error) {
    console.warn("Could not format curriculum created_at", error);
    return value;
  }
};

export function CurriculaList({ curricula, loading, onNewCurriculum, onOpenCurriculum, onExportCurriculum }: CurriculaListProps) {
  const { t } = useLanguage();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t.dashboard.curriculum.title}</h2>
          <p className="text-sm text-muted-foreground">{t.dashboard.curriculum.subtitle}</p>
        </div>
        <Button onClick={onNewCurriculum} aria-label={t.dashboard.quickActions.newCurriculum}>
          {t.dashboard.quickActions.newCurriculum}
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          {t.dashboard.common.loading}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={onNewCurriculum}
            className="group flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/30 bg-white/5 p-6 text-white/80 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.85)] transition hover:border-white/60 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 md:min-h-[240px]"
            aria-label={t.dashboard.quickActions.newCurriculum}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white shadow-inner transition group-hover:border-white/70 group-hover:bg-white/20">
              <Plus className="h-7 w-7" />
            </span>
            <span className="mt-4 text-lg font-semibold">
              {t.dashboard.quickActions.newCurriculum}
            </span>
            <span className="mt-2 text-center text-sm text-white/70">
              {t.dashboard.curriculum.empty.description}
            </span>
          </button>
          {curricula.map(item => (
            <Card key={item.id} className="flex flex-col justify-between">
              <CardHeader className="space-y-2 p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {item.title}
                  </CardTitle>
                  {item.isExample ? (
                    <Badge variant="outline" className="text-xs font-normal uppercase tracking-wide">
                      {t.dashboard.common.exampleTag}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {item.class ? (
                    <Badge variant="secondary">{item.class.title}</Badge>
                  ) : null}
                  <span>{item.subject}</span>
                  {item.class?.stage ? <span>· {item.class.stage}</span> : null}
                </div>
                {item.isExample ? (
                  <p className="text-xs text-muted-foreground">{t.dashboard.common.exampleDescription}</p>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-4 pt-1">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{t.dashboard.curriculum.labels.academicYear}</span>
                  <span>{formatYear(item.academic_year)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{t.dashboard.curriculum.labels.itemsCount}</span>
                  <span>{item.items_count}</span>
                </div>
                {item.created_at ? (
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{t.dashboard.curriculum.labels.createdOn}</span>
                    <span>{formatCreatedAt(item.created_at)}</span>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 p-4 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenCurriculum(item.id)}
                  aria-label={t.dashboard.curriculum.actions.open}
                >
                  {t.dashboard.curriculum.actions.open}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={item.isExample}
                  onClick={() => onExportCurriculum(item.id)}
                  aria-label={t.dashboard.curriculum.actions.exportCsv}
                >
                  {t.dashboard.curriculum.actions.exportCsv}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {!loading && curricula.length === 0 ? (
        <div className="rounded-3xl border border-white/20 bg-white/5 p-10 text-center text-white shadow-[0_20px_70px_-25px_rgba(15,23,42,0.85)]">
          <h3 className="text-lg font-semibold">{t.dashboard.curriculum.empty.title}</h3>
          <p className="mt-2 text-sm text-white/70">{t.dashboard.curriculum.empty.description}</p>
        </div>
      ) : null}
    </section>
  );
}
