import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export type LessonBuilderExportFormat = "pdf" | "docx";

interface LessonBuilderProps {
  metadata: {
    title: string;
    className: string;
    stage?: string | null;
    date?: string | null;
    links?: {
      lesson?: string;
      class?: string;
      stage?: string;
      date?: string;
    };
  };
  body: string;
  onBodyChange: (value: string) => void;
  onSave: () => void;
  onAddResource: () => void;
  onExport: (format: LessonBuilderExportFormat) => void;
  resourcePanel: ReactNode;
  autosaveState?: "idle" | "saving" | "saved";
  lastSavedAt?: Date | null;
}

const formatLessonDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "PPPP");
  } catch {
    return value;
  }
};

export function LessonBuilder({
  metadata,
  body,
  onBodyChange,
  onSave,
  onAddResource,
  onExport,
  resourcePanel,
  autosaveState = "idle",
  lastSavedAt,
}: LessonBuilderProps) {
  const { t } = useLanguage();

  const autosaveLabel = (() => {
    switch (autosaveState) {
      case "saving":
        return t.lessonBuilder.editor.autosaveSaving;
      case "saved":
        return lastSavedAt ? t.lessonBuilder.editor.autosaveSaved.replace("{time}", format(lastSavedAt, "p")) : t.lessonBuilder.editor.autosaveSavedNow;
      default:
        return t.lessonBuilder.editor.autosaveIdle;
    }
  })();

  const renderChangeLink = (href?: string) => {
    if (!href) return null;
    return (
      <Button variant="link" size="sm" className="h-auto px-0 text-xs" asChild>
        <Link to={href}>{t.lessonBuilder.editor.changeLink}</Link>
      </Button>
    );
  };

  return (
    <PanelGroup direction="horizontal" className="h-full rounded-xl border bg-card">
      <Panel defaultSize={65} minSize={40} className="flex flex-col">
        <div className="flex flex-col gap-5 border-b px-6 py-5">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.lessonBuilder.editor.heading}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold leading-tight">{metadata.title}</h1>
              {renderChangeLink(metadata.links?.lesson)}
            </div>
            <p className="text-xs text-muted-foreground">{t.lessonBuilder.editor.prefilledNotice}</p>
          </div>
          <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide">{t.lessonBuilder.editor.classLabel}</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2 text-base text-foreground">
                <span>{metadata.className}</span>
                {renderChangeLink(metadata.links?.class)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide">{t.lessonBuilder.editor.stageLabel}</dt>
              <dd className={cn("mt-1 flex flex-wrap items-center gap-2", metadata.stage ? "text-base text-foreground" : "text-base text-muted-foreground")}
              >
                <span>{metadata.stage ?? "—"}</span>
                {renderChangeLink(metadata.links?.stage)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide">{t.lessonBuilder.editor.dateLabel}</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2 text-base text-foreground">
                <span>{formatLessonDate(metadata.date)}</span>
                {renderChangeLink(metadata.links?.date)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onAddResource} variant="outline" aria-label={t.lessonBuilder.editor.addResource}>
              {t.lessonBuilder.editor.addResource}
            </Button>
            <Button onClick={() => onExport("pdf")} variant="secondary" aria-label={t.lessonBuilder.editor.exportPdf}>
              {t.lessonBuilder.editor.exportPdf}
            </Button>
            <Button onClick={() => onExport("docx")} variant="secondary" aria-label={t.lessonBuilder.editor.exportDocx}>
              {t.lessonBuilder.editor.exportDocx}
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">{autosaveLabel}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <label htmlFor="lesson-body" className="sr-only">
            {t.lessonBuilder.editor.bodyLabel}
          </label>
          <Textarea
            id="lesson-body"
            value={body}
            onChange={event => onBodyChange(event.target.value)}
            className="h-full min-h-[400px] resize-none"
            placeholder={t.lessonBuilder.editor.bodyPlaceholder}
          />
        </div>
        <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-4">
          <Button onClick={onSave} aria-label={t.lessonBuilder.editor.save}>{t.lessonBuilder.editor.save}</Button>
        </div>
      </Panel>
      <PanelResizeHandle className="w-2 bg-border transition-colors hover:bg-primary" />
      <Panel defaultSize={35} minSize={25} className="flex flex-col">
        <div className="h-full overflow-hidden px-4 py-5">
          {resourcePanel}
        </div>
      </Panel>
    </PanelGroup>
  );
}
