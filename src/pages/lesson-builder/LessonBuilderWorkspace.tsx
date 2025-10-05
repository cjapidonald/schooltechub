import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { SEO } from "@/components/SEO";
import { LessonBuilder } from "@/components/lesson-builder/LessonBuilder";
import { ResourceSearch } from "@/components/lesson-builder/ResourceSearch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import {
  LessonPlanWithRelations,
  attachResourceToLessonPlan,
  fetchLessonPlan,
  searchResources,
  updateLessonPlanBody,
} from "@/features/dashboard/api";
import type { Resource } from "../../../../types/supabase-tables";
import { supabase } from "@/integrations/supabase/client";

const AUTOSAVE_DELAY = 5000;

type ResourceFilters = {
  query: string;
  types: Resource["type"][];
  stage: string;
  subject: string;
  cost: "both" | "free" | "paid";
  tags: string[];
};

const defaultFilters: ResourceFilters = {
  query: "",
  types: ["link", "pdf", "ppt", "docx", "image", "video"],
  stage: "",
  subject: "",
  cost: "both",
  tags: [],
};

const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const createMarkdownTable = (title: string, instructions: string, resourceLink: string) =>
  `| Title | Instructions | Resource |\n|---|---|---|\n| ${escapeCell(title)} | ${escapeCell(instructions)} | ${resourceLink} |`;

const createVideoEmbedUrl = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.toString();
      }
      if (url.pathname.startsWith("/shorts/")) {
        const [, , id] = url.pathname.split("/");
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }
    }

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "");
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

    if (host.includes("vimeo.com")) {
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        const id = segments[segments.length - 1];
        return `https://player.vimeo.com/video/${id}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to parse video URL", error);
    return null;
  }
};

async function resolveResourceLink(resource: Resource): Promise<string> {
  if (resource.type === "video" && resource.url) {
    const embedUrl = createVideoEmbedUrl(resource.url);
    if (embedUrl) {
      return `<iframe src="${embedUrl}" title="${escapeHtmlAttribute(resource.title)}" allowfullscreen loading="lazy" style="width:100%;aspect-ratio:16/9;border:0;"></iframe>`;
    }
    return `[${escapeCell(resource.title)}](${resource.url})`;
  }

  if (resource.type === "image" && resource.url) {
    return `![${escapeCell(resource.title)}](${resource.url})`;
  }

  if (resource.type === "link" && resource.url) {
    return `[${escapeCell(resource.title)}](${resource.url})`;
  }

  if (resource.file_path) {
    const { data, error } = await supabase.storage
      .from("resources")
      .createSignedUrl(resource.file_path, 3600);

    if (error) {
      console.error("Failed to create signed URL", error);
      return resource.url ? `[${escapeCell(resource.title)}](${resource.url})` : resource.title;
    }

    const label = resource.type ? resource.type.toUpperCase() : "FILE";
    return `[${label} – ${escapeCell(resource.title)}](${data.signedUrl})`;
  }

  if (resource.url) {
    return `[${escapeCell(resource.title)}](${resource.url})`;
  }

  return resource.title;
}

export default function LessonBuilderWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { user } = useOptionalUser();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [body, setBody] = useState("");
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [resourceFilters, setResourceFilters] = useState<ResourceFilters>(defaultFilters);
  const [hasLoadedInitialBody, setHasLoadedInitialBody] = useState(false);
  const [highlightResources, setHighlightResources] = useState(false);
  const highlightTimerRef = useRef<number | null>(null);

  const handleFiltersChange = useCallback((filters: ResourceFilters) => {
    setResourceFilters(filters);
  }, []);

  const planQuery = useQuery<LessonPlanWithRelations | null>({
    queryKey: ["lesson-plan", id],
    queryFn: () => fetchLessonPlan(id!),
    enabled: Boolean(id && user?.id),
  });

  const resourcesQuery = useQuery<Resource[]>({
    queryKey: ["lesson-plan-resources", id, resourceFilters],
    queryFn: () => searchResources(resourceFilters),
    enabled: Boolean(id && user?.id),
  });

  useEffect(() => {
    if (planQuery.data && !hasLoadedInitialBody) {
      setBody(planQuery.data.body_md ?? "");
      setHasLoadedInitialBody(true);
    }
  }, [planQuery.data, hasLoadedInitialBody]);

  useEffect(() => {
    if (!id || !user?.id) {
      return;
    }
    if (!hasLoadedInitialBody) {
      return;
    }

    const handle = setTimeout(() => {
      if (!planQuery.data) {
        return;
      }
      setAutosaveState("saving");
      updateLessonPlanBody(id, body)
        .then(() => {
          setAutosaveState("saved");
          setLastSavedAt(new Date());
        })
        .catch(error => {
          console.error("Failed to autosave lesson plan", error);
          setAutosaveState("idle");
          toast({ description: t.lessonBuilder.editor.autosaveError, variant: "destructive" });
        });
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(handle);
  }, [id, body, hasLoadedInitialBody, user?.id, planQuery.data, toast, t.lessonBuilder.editor.autosaveError]);

  const handleManualSave = useCallback(async () => {
    if (!id) return;
    try {
      setAutosaveState("saving");
      await updateLessonPlanBody(id, body);
      setAutosaveState("saved");
      setLastSavedAt(new Date());
      toast({ description: t.lessonBuilder.editor.saved });
    } catch (error) {
      console.error("Failed to save lesson plan", error);
      setAutosaveState("idle");
      toast({ description: t.lessonBuilder.editor.autosaveError, variant: "destructive" });
    }
  }, [id, body, toast, t.lessonBuilder.editor.autosaveError, t.lessonBuilder.editor.saved]);

  const insertResourceMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      const markdownLink = await resolveResourceLink(resource);
      const table = createMarkdownTable(
        resource.title,
        resource.instructions ?? t.lessonBuilder.resources.noInstructions,
        markdownLink,
      );
      const nextBody = body.trim().length > 0 ? `${body}\n\n${table}` : table;
      await attachResourceToLessonPlan({ lessonPlanId: id!, resourceId: resource.id });
      await updateLessonPlanBody(id!, nextBody);
      return nextBody;
    },
    onSuccess: nextBody => {
      setBody(nextBody);
      setAutosaveState("saved");
      setLastSavedAt(new Date());
      toast({ description: t.lessonBuilder.resources.added });
    },
    onError: error => {
      console.error("Failed to attach resource", error);
      toast({ description: t.lessonBuilder.resources.error, variant: "destructive" });
    },
  });

  const handleExport = useCallback(
    async (format: "pdf" | "docx") => {
      if (!id) return;
      try {
        const response = await fetch(`/api/lesson-plans/${id}/export?format=${format}`);
        if (!response.ok) {
          throw new Error(`Export failed: ${response.status}`);
        }
        const payload = await response.json();
        if (payload?.signedUrl) {
          window.open(payload.signedUrl, "_blank", "noopener");
        }
        toast({ description: t.lessonBuilder.exports.success });
      } catch (error) {
        console.error("Failed to export lesson plan", error);
        toast({ description: t.lessonBuilder.exports.error, variant: "destructive" });
      }
    },
    [id, toast, t.lessonBuilder.exports.error, t.lessonBuilder.exports.success],
  );

  const handleAddResourceClick = useCallback(() => {
    const searchInput = document.getElementById("resource-search");
    if (searchInput instanceof HTMLInputElement) {
      searchInput.focus();
      searchInput.select();
    }

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }

    setHighlightResources(true);
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightResources(false);
      highlightTimerRef.current = null;
    }, 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const metadata = useMemo(() => {
    if (!planQuery.data) {
      return {
        title: t.lessonBuilder.editor.loadingTitle,
        className: t.lessonBuilder.editor.unknownClass,
        stage: null,
        date: null,
        links: {},
      } as const;
    }

    const className = planQuery.data.class?.title ?? t.lessonBuilder.editor.unknownClass;
    const stage = planQuery.data.stage ?? planQuery.data.curriculum_item?.stage ?? null;
    const date = planQuery.data.planned_date ?? planQuery.data.curriculum_item?.scheduled_on ?? null;

    return {
      title: planQuery.data.title,
      className,
      stage,
      date,
      links: {
        lesson: `/lesson-builder`,
        class: planQuery.data.class?.id ? `/teacher?tab=classes` : undefined,
        stage: `/lesson-builder`,
        date: `/lesson-builder`,
      },
    } as const;
  }, [planQuery.data, t.lessonBuilder.editor.unknownClass, t.lessonBuilder.editor.loadingTitle]);

  if (!user) {
    return (
      <div className="container py-10">
        <SEO title="Lesson Builder" description="Lesson Builder" />
        <div className="rounded-lg border bg-muted/20 p-10 text-center text-muted-foreground">
          {t.dashboard.common.signInPrompt}
        </div>
      </div>
    );
  }

  if (planQuery.isError) {
    return (
      <div className="container py-10">
        <SEO title="Lesson Builder" description="Lesson Builder" />
        <div className="rounded-lg border bg-destructive/10 p-10 text-center text-destructive">
          {t.lessonBuilder.editor.loadError}
        </div>
      </div>
    );
  }

  if (!planQuery.data) {
    return (
      <div className="container py-10">
        <SEO title="Lesson Builder" description="Lesson Builder" />
        <div className="rounded-lg border bg-muted/20 p-10 text-center text-muted-foreground">
          {t.lessonBuilder.editor.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="container h-[calc(100vh-8rem)] py-6">
      <SEO title={t.lessonBuilder.editor.pageTitle.replace("{title}", planQuery.data.title)} description={t.lessonBuilder.editor.pageDescription} />
      <LessonBuilder
        metadata={metadata}
        body={body}
        onBodyChange={setBody}
        onSave={handleManualSave}
        onAddResource={handleAddResourceClick}
        onExport={handleExport}
        resourcePanel={
          <ResourceSearch
            resources={resourcesQuery.data ?? []}
            loading={resourcesQuery.isLoading}
            onFilterChange={handleFiltersChange}
            onInsert={resource => insertResourceMutation.mutate(resource)}
            highlighted={highlightResources}
          />
        }
        autosaveState={autosaveState}
        lastSavedAt={lastSavedAt}
      />
    </div>
  );
}
