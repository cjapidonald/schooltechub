import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Play } from "lucide-react";
import type { LessonBuilderPlan, LessonBuilderVersionEntry } from "@/types/lesson-builder";

interface ToolbarCopy {
  draftStatus: string;
  publishedStatus: string;
  previewLabel: string;
  savingLabel: string;
  historyLabel: string;
  lastSavedPrefix: string;
  noHistory: string;
}

interface ToolbarProps {
  plan: LessonBuilderPlan | null;
  history: LessonBuilderVersionEntry[];
  isSaving: boolean;
  onPreview: () => void;
  copy: ToolbarCopy;
}

function formatLastSaved(date: string | null, prefix: string): string {
  if (!date) {
    return prefix;
  }
  try {
    return `${prefix} ${format(new Date(date), "PPpp")}`;
  } catch {
    return prefix;
  }
}

export const Toolbar = ({ plan, history, isSaving, onPreview, copy }: ToolbarProps) => {
  const statusLabel = plan?.status === "published" ? copy.publishedStatus : copy.draftStatus;
  const lastSavedLabel = formatLastSaved(plan?.lastSavedAt ?? plan?.updatedAt ?? null, copy.lastSavedPrefix);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Badge variant={plan?.status === "published" ? "default" : "outline"}>{statusLabel}</Badge>
        <span className="text-sm text-muted-foreground">{lastSavedLabel}</span>
        {isSaving ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {copy.savingLabel}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              {copy.historyLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {history.length === 0 ? (
              <DropdownMenuItem disabled>{copy.noHistory}</DropdownMenuItem>
            ) : (
              history.map((entry) => (
                <DropdownMenuItem key={entry.id} className="flex-col items-start gap-1">
                  <span className="text-sm font-medium">{entry.label}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(entry.createdAt), "PPpp")}</span>
                  {entry.summary ? (
                    <span className="text-xs text-muted-foreground">{entry.summary}</span>
                  ) : null}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" onClick={onPreview}>
          <Play className="mr-2 h-4 w-4" />
          {copy.previewLabel}
        </Button>
      </div>
    </div>
  );
};
