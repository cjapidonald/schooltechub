import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { Class } from "../../../types/supabase-tables";
import { format } from "date-fns";

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
      <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
        <Table className="text-white/80">
          <TableHeader className="bg-white/5 text-white/70 [&_tr]:border-white/10 [&_th]:text-white/70 [&_th]:font-semibold">
            <TableRow className="border-white/10">
              <TableHead>{t.dashboard.classes.columns.title}</TableHead>
              <TableHead>{t.dashboard.classes.columns.stage}</TableHead>
              <TableHead>{t.dashboard.classes.columns.subject}</TableHead>
              <TableHead>{t.dashboard.classes.columns.dates}</TableHead>
              <TableHead className="text-right">{t.dashboard.classes.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-white/10">
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-white/70">
                  {t.dashboard.common.loading}
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-white/70">
                  {t.dashboard.classes.empty}
                </TableCell>
              </TableRow>
            ) : (
              classes.map(item => (
                <TableRow key={item.id} className="border-white/10 transition hover:bg-white/15">
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-white">{item.title}</div>
                      {item.isExample ? (
                        <Badge variant="outline" className="border-white/40 bg-white/10 text-xs font-normal uppercase tracking-wide text-white/80">
                          {t.dashboard.common.exampleTag}
                        </Badge>
                      ) : null}
                    </div>
                    {item.isExample ? (
                      <p className="mt-1 text-xs text-white/60">{t.dashboard.common.exampleDescription}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="align-top">
                    {item.stage ? (
                      <Badge variant="secondary" className="border-white/30 bg-white/15 text-white">
                        {item.stage}
                      </Badge>
                    ) : (
                      <span className="text-white/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-white">
                    {item.subject || "—"}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-col text-sm text-white/70">
                      <span>
                        {t.dashboard.classes.labels.start}: {formatDate(item.start_date)}
                      </span>
                      <span>
                        {t.dashboard.classes.labels.end}: {formatDate(item.end_date)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                      <p className="mt-2 text-xs text-white/60">{t.dashboard.common.exampleActionsDisabled}</p>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
