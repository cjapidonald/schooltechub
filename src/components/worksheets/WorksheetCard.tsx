import { FileText, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { WorksheetCard as WorksheetCardType } from "@/types/worksheets";

interface WorksheetCardProps {
  worksheet: WorksheetCardType;
  onSelect: (worksheet: WorksheetCardType) => void;
  openLabel: string;
  answerKeyLabel: string;
  formatLabel: string;
}

const MAX_TAGS = 3;

export function WorksheetCard({
  worksheet,
  onSelect,
  openLabel,
  answerKeyLabel,
  formatLabel,
}: WorksheetCardProps) {
  const subjectBadges = worksheet.subjects.slice(0, MAX_TAGS);
  const skillBadges = worksheet.skills.slice(0, MAX_TAGS);

  return (
    <Card className="group relative h-full overflow-hidden border border-border/60">
      <button
        type="button"
        onClick={() => onSelect(worksheet)}
        aria-label={`${openLabel}: ${worksheet.title}`}
        className="flex h-full w-full flex-col gap-4 p-6 text-left transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start justify-between gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{worksheet.stage}</Badge>
            {worksheet.difficulty ? (
              <Badge variant="outline" className="border-dashed">
                {worksheet.difficulty}
              </Badge>
            ) : null}
            <Badge variant="secondary" className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" aria-hidden="true" />
              {formatLabel}
            </Badge>
          </div>
          {worksheet.hasAnswerKey ? (
            <Badge variant="outline" className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {answerKeyLabel}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold leading-tight group-hover:text-primary">
            {worksheet.title}
          </h3>
          {worksheet.overview ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{worksheet.overview}</p>
          ) : null}
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          {subjectBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {subjectBadges.map((subject) => (
                <Badge key={subject} variant="outline">
                  {subject}
                </Badge>
              ))}
            </div>
          ) : null}

          {skillBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillBadges.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-primary/5 text-primary">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between text-sm font-medium text-primary">
          <span>{openLabel}</span>
        </div>
      </button>
    </Card>
  );
}
