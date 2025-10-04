import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CurriculumItem } from "../../../types/supabase-tables";
import { format } from "date-fns";

interface CurriculumEditorProps {
  items: Array<CurriculumItem & { isExample?: boolean }>;
  loading?: boolean;
  onCreateLessonPlan: (curriculumItemId: string) => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "PPP");
  } catch {
    return value;
  }
};

export function CurriculumEditor({ items, loading, onCreateLessonPlan }: CurriculumEditorProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>{t.dashboard.curriculumView.columns.lessonTitle}</TableHead>
            <TableHead>{t.dashboard.curriculumView.columns.stage}</TableHead>
            <TableHead>{t.dashboard.curriculumView.columns.date}</TableHead>
            <TableHead>{t.dashboard.curriculumView.columns.status}</TableHead>
            <TableHead className="text-right">{t.dashboard.curriculumView.columns.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                {t.dashboard.common.loading}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                {t.dashboard.curriculumView.empty}
              </TableCell>
            </TableRow>
          ) : (
            items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold">{item.position}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{item.lesson_title}</div>
                    {item.isExample ? (
                      <Badge variant="outline" className="text-xs font-normal uppercase tracking-wide">
                        {t.dashboard.common.exampleTag}
                      </Badge>
                    ) : null}
                  </div>
                  {item.isExample ? (
                    <p className="mt-1 text-xs text-muted-foreground">{t.dashboard.common.exampleDescription}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  {item.stage ? <Badge variant="secondary">{item.stage}</Badge> : "—"}
                </TableCell>
                <TableCell>{formatDate(item.scheduled_on)}</TableCell>
                <TableCell>
                  <Badge>{t.dashboard.curriculumView.status[item.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!item.id || item.isExample}
                    onClick={() => onCreateLessonPlan(item.id)}
                    aria-label={t.dashboard.curriculumView.actions.createLessonPlan}
                  >
                    {t.dashboard.curriculumView.actions.createLessonPlan}
                  </Button>
                  {item.isExample ? (
                    <p className="mt-2 text-xs text-muted-foreground">{t.dashboard.common.exampleActionsDisabled}</p>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
