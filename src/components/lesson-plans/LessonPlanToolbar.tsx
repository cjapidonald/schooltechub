import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Download,
  History,
  Loader2,
  Share2,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import type {
  LessonPlan,
  LessonPlanShareAccess,
  LessonPlanVersion,
} from "@/types/lesson-plans";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Button,
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface LessonPlanToolbarProps {
  lesson: LessonPlan | null;
  slug?: string | null;
}

interface ShareResponse {
  shareAccess: LessonPlanShareAccess;
  viewerRole: LessonPlan["viewerRole"];
  canEdit: boolean;
}

interface VersionListResponse {
  versions: LessonPlanVersion[];
}

interface RestoreResponse {
  lesson: LessonPlan;
  restoredVersionId: string;
}

export function LessonPlanToolbar({ lesson, slug }: LessonPlanToolbarProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [shareValue, setShareValue] = useState<LessonPlanShareAccess>(
    lesson?.shareAccess ?? "private"
  );
  const [exportStatus, setExportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);

  useEffect(() => {
    if (lesson) {
      setShareValue(lesson.shareAccess);
    }
  }, [lesson?.shareAccess]);

  const shareMutation = useMutation<ShareResponse, Error, LessonPlanShareAccess>({
    mutationFn: async (access) => {
      if (!lesson) {
        throw new Error("Lesson not loaded");
      }
      const response = await fetch(`/api/lesson-plans/${lesson.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shareAccess: access }),
      });
      if (!response.ok) {
        throw new Error("Failed to update share settings");
      }
      return response.json() as Promise<ShareResponse>;
    },
    onSuccess: (data) => {
      if (!lesson || !slug) {
        return;
      }
      setShareValue(data.shareAccess);
      queryClient.setQueryData<LessonPlan>(["lesson-plan", slug], {
        ...lesson,
        shareAccess: data.shareAccess,
        viewerRole: data.viewerRole,
        canEdit: data.canEdit,
      });
    },
    onError: () => {
      if (lesson) {
        setShareValue(lesson.shareAccess);
      }
    },
  });

  const versionsQuery = useQuery<LessonPlanVersion[]>({
    queryKey: ["lesson-plan", lesson?.id, "versions"],
    enabled: versionDialogOpen && Boolean(lesson?.id),
    queryFn: async () => {
      if (!lesson) {
        return [];
      }
      const response = await fetch(`/api/lesson-plans/${lesson.id}/versions`);
      if (!response.ok) {
        throw new Error("Failed to load versions");
      }
      const payload = (await response.json()) as VersionListResponse;
      return payload.versions ?? [];
    },
  });

  const rollbackMutation = useMutation<RestoreResponse, Error, string>({
    mutationFn: async (versionId) => {
      if (!lesson) {
        throw new Error("Lesson not loaded");
      }
      const response = await fetch(`/api/lesson-plans/${lesson.id}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ versionId }),
      });
      if (!response.ok) {
        throw new Error("Failed to restore version");
      }
      return response.json() as Promise<RestoreResponse>;
    },
    onSuccess: (data) => {
      if (!slug) {
        return;
      }
      queryClient.setQueryData<LessonPlan>(["lesson-plan", slug], data.lesson);
      queryClient.invalidateQueries({
        queryKey: ["lesson-plan", lesson?.id, "versions"],
      });
      setVersionDialogOpen(false);
      setExportStatus("success");
      setExportMessage(t.lessonPlans.toolbar.versionRestored);
    },
  });

  const shareOptions = useMemo(
    () => [
      { value: "private", label: t.lessonPlans.toolbar.shareOptions.private },
      { value: "link", label: t.lessonPlans.toolbar.shareOptions.link },
      { value: "org", label: t.lessonPlans.toolbar.shareOptions.org },
      { value: "public", label: t.lessonPlans.toolbar.shareOptions.public },
    ],
    [t.lessonPlans.toolbar.shareOptions]
  );

  const handleShareChange = useCallback(
    (value: string) => {
      if (!lesson) {
        return;
      }
      const access = value as LessonPlanShareAccess;
      setShareValue(access);
      shareMutation.mutate(access);
    },
    [lesson, shareMutation]
  );

  const handleExport = useCallback(
    async (
      format: "pdf" | "docx",
      variant: "default" | "handout",
      includeQrCodes: boolean
    ) => {
      if (!lesson) {
        return;
      }
      setExportStatus("loading");
      setExportMessage(t.lessonPlans.toolbar.exporting);

      try {
        const params = new URLSearchParams({
          format,
          variant,
          store: "1",
        });
        if (includeQrCodes) {
          params.set("qr", "1");
        }
        const response = await fetch(
          `/api/lesson-plans/${lesson.id}/export?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error("Export failed");
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const payload = await response.json();
          if (payload?.url) {
            window.open(payload.url, "_blank", "noopener,noreferrer");
          }
        } else {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = blobUrl;
          anchor.download = payloadFilename(lesson.title, format, variant);
          anchor.rel = "noopener noreferrer";
          anchor.click();
          URL.revokeObjectURL(blobUrl);
        }

        setExportStatus("success");
        setExportMessage(t.lessonPlans.toolbar.exportReady);
      } catch (error) {
        console.error(error);
        setExportStatus("error");
        setExportMessage(t.lessonPlans.toolbar.exportError);
      }
    },
    [lesson, t.lessonPlans.toolbar.exportReady, t.lessonPlans.toolbar.exportError, t.lessonPlans.toolbar.exporting]
  );

  const exporting = exportStatus === "loading";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Select
          disabled={!lesson?.canEdit || shareMutation.isPending}
          value={shareValue}
          onValueChange={handleShareChange}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t.lessonPlans.toolbar.shareLabel} />
          </SelectTrigger>
          <SelectContent>
            {shareOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {lesson && !lesson.canEdit ? (
        <Badge variant="secondary">{t.lessonPlans.toolbar.readOnly}</Badge>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" disabled={!lesson || exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {t.lessonPlans.toolbar.exportLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleExport("pdf", "default", false);
            }}
          >
            {t.lessonPlans.toolbar.exportFormats.pdf}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleExport("docx", "default", false);
            }}
          >
            {t.lessonPlans.toolbar.exportFormats.docx}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleExport("pdf", "handout", false);
            }}
          >
            {t.lessonPlans.toolbar.exportFormats.handoutPdf}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleExport("docx", "handout", true);
            }}
          >
            {t.lessonPlans.toolbar.exportFormats.handoutDocx}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" disabled={!lesson}>
            <History className="mr-2 h-4 w-4" />
            {t.lessonPlans.toolbar.versionHistory}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.lessonPlans.toolbar.versionHistory}</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {versionsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : versionsQuery.isError ? (
              <p className="text-sm text-destructive">
                {t.lessonPlans.toolbar.exportError}
              </p>
            ) : versionsQuery.data && versionsQuery.data.length > 0 ? (
              versionsQuery.data.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(version.createdAt), "PPpp")}
                    </p>
                    {version.createdBy ? (
                      <p className="text-xs text-muted-foreground">
                        {version.createdBy}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={rollbackMutation.isPending}
                    onClick={() => rollbackMutation.mutate(version.id)}
                  >
                    {rollbackMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t.lessonPlans.toolbar.versionRestore}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.lessonPlans.toolbar.versionEmpty}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {exportMessage ? (
        <p
          className={`text-sm ${
            exportStatus === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {exportMessage}
        </p>
      ) : null}
    </div>
  );
}

function payloadFilename(
  title: string,
  format: "pdf" | "docx",
  variant: "default" | "handout"
): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const suffix = variant === "handout" ? "-handout" : "";
  return `${base || "lesson-plan"}${suffix}.${format}`;
}

