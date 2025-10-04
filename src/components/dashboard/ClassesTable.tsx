import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Class } from "../../../types/supabase-tables";
import { format } from "date-fns";

interface ClassesTableProps {
  classes: Class[];
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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t.dashboard.classes.title}</h2>
          <p className="text-sm text-muted-foreground">{t.dashboard.classes.subtitle}</p>
        </div>
        <Button onClick={onNewClass} aria-label={t.dashboard.quickActions.newClass}>
          {t.dashboard.quickActions.newClass}
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.dashboard.classes.columns.title}</TableHead>
              <TableHead>{t.dashboard.classes.columns.stage}</TableHead>
              <TableHead>{t.dashboard.classes.columns.subject}</TableHead>
              <TableHead>{t.dashboard.classes.columns.dates}</TableHead>
              <TableHead className="text-right">{t.dashboard.classes.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {t.dashboard.common.loading}
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {t.dashboard.classes.empty}
                </TableCell>
              </TableRow>
            ) : (
              classes.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                  </TableCell>
                  <TableCell>
                    {item.stage ? <Badge variant="secondary">{item.stage}</Badge> : "—"}
                  </TableCell>
                  <TableCell>{item.subject || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      <span>{t.dashboard.classes.labels.start}: {formatDate(item.start_date)}</span>
                      <span>{t.dashboard.classes.labels.end}: {formatDate(item.end_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onViewClass?.(item.id)} aria-label={t.dashboard.classes.actions.view}>
                        {t.dashboard.classes.actions.view}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEditClass?.(item.id)} aria-label={t.dashboard.classes.actions.edit}>
                        {t.dashboard.classes.actions.edit}
                      </Button>
                    </div>
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
