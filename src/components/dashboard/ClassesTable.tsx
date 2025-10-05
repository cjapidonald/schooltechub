import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Class } from "../../../types/supabase-tables";
import { format } from "date-fns";

interface ClassesTableProps {
  classes: Array<Class & { isExample?: boolean }>;
  loading?: boolean;
  onNewClass: () => void;
  onViewClass?: (classId: string) => void;
  onEditClass?: (classId: string) => void;
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

export function ClassesTable({ classes, loading, onNewClass, onViewClass, onEditClass }: ClassesTableProps) {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_55%)] opacity-60" />
      <div className="relative space-y-6">
        <div className="flex flex-col justify-between gap-4 text-white/80 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">{t.dashboard.classes.title}</h2>
            <p className="text-sm text-white/70">{t.dashboard.classes.subtitle}</p>
          </div>
          <Button
            onClick={onNewClass}
            aria-label={t.dashboard.quickActions.newClass}
            className="border-white/50 bg-white/90 text-slate-900 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.8)] transition hover:bg-white"
          >
            {t.dashboard.quickActions.newClass}
          </Button>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-70" />
          <Table className="relative text-white/80">
            <TableHeader className="bg-white/10">
              <TableRow className="border-white/10 text-xs uppercase tracking-wide text-white/70">
                <TableHead className="text-white/70">{t.dashboard.classes.columns.title}</TableHead>
                <TableHead className="text-white/70">{t.dashboard.classes.columns.stage}</TableHead>
                <TableHead className="text-white/70">{t.dashboard.classes.columns.subject}</TableHead>
                <TableHead className="text-white/70">{t.dashboard.classes.columns.dates}</TableHead>
                <TableHead className="text-right text-white/70">{t.dashboard.classes.columns.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/5 text-white/70">
                  <TableCell colSpan={5} className="py-10 text-center">
                    {t.dashboard.common.loading}
                  </TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow className="border-white/5 text-white/70">
                  <TableCell colSpan={5} className="py-10 text-center">
                    {t.dashboard.classes.empty}
                  </TableCell>
                </TableRow>
              ) : (
                classes.map(item => (
                  <TableRow key={item.id} className="border-white/5 bg-white/0 transition hover:bg-white/15">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-white">{item.title}</div>
                        {item.isExample ? (
                          <Badge variant="outline" className="border-white/40 bg-white/10 text-xs font-normal uppercase tracking-wide text-white">
                            {t.dashboard.common.exampleTag}
                          </Badge>
                        ) : null}
                      </div>
                      {item.isExample ? (
                        <p className="mt-1 text-xs text-white/70">{t.dashboard.common.exampleDescription}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {item.stage ? (
                        <Badge className="border border-white/30 bg-white/15 text-white/80 backdrop-blur">
                          {item.stage}
                        </Badge>
                      ) : (
                        <span className="text-white/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white/80">{item.subject || <span className="text-white/50">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-white/70">
                        <span>{t.dashboard.classes.labels.start}: {formatDate(item.start_date)}</span>
                        <span>{t.dashboard.classes.labels.end}: {formatDate(item.end_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="border border-transparent text-white/80 hover:border-white/40 hover:bg-white/20"
                          disabled={item.isExample}
                          onClick={() => onViewClass?.(item.id)}
                          aria-label={t.dashboard.classes.actions.view}
                        >
                          {t.dashboard.classes.actions.view}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="border border-transparent text-white/80 hover:border-white/40 hover:bg-white/20"
                          disabled={item.isExample}
                          onClick={() => onEditClass?.(item.id)}
                          aria-label={t.dashboard.classes.actions.edit}
                        >
                          {t.dashboard.classes.actions.edit}
                        </Button>
                      </div>
                      {item.isExample ? (
                        <p className="mt-2 text-xs text-white/60">{t.dashboard.common.exampleActionsDisabled}</p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
