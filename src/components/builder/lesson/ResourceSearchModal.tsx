import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

import { searchLessonBuilderResources } from "@/lib/builder-api";
import type { LessonBuilderResourceSearchResult } from "@/types/lesson-builder";

interface ResourceSearchCopy {
  title: string;
  placeholder: string;
  mediaLabel: string;
  stageLabel: string;
  subjectLabel: string;
  durationLabel: string;
  domainLabel: string;
  notesToggle: string;
  mineToggle: string;
  clearFilters: string;
  empty: string;
  addLabel: string;
  loading: string;
}

interface ResourceSearchModalProps {
  planId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (resource: LessonBuilderResourceSearchResult) => void;
  copy: ResourceSearchCopy;
}

const MEDIA_TYPES = ["Article", "Video", "Interactive", "Template", "Assessment", "Tool"];
const STAGE_OPTIONS = ["Early Childhood", "Elementary", "Middle School", "High School"];
const SUBJECT_OPTIONS = ["Math", "Science", "ELA", "Social Studies", "Arts", "Technology"];
const DURATION_FILTERS = ["< 15 min", "15-30 min", "30-45 min", "45+ min"];

export const ResourceSearchModal = ({
  planId,
  open,
  onOpenChange,
  onSelect,
  copy,
}: ResourceSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [stage, setStage] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [domain, setDomain] = useState("");
  const [withNotes, setWithNotes] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => {
    if (!open) {
      setDebouncedTerm("");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, open]);

  const hasFilters = useMemo(
    () =>
      mediaTypes.length > 0 ||
      Boolean(stage) ||
      Boolean(subject) ||
      Boolean(duration) ||
      domain.trim().length > 0 ||
      withNotes ||
      mineOnly,
    [mediaTypes, stage, subject, duration, domain, withNotes, mineOnly]
  );

  const queryKey = useMemo(
    () => [
      "builder-resource-search",
      planId,
      debouncedTerm,
      mediaTypes.join("|"),
      stage,
      subject,
      duration,
      domain.trim(),
      withNotes,
      mineOnly,
    ],
    [planId, debouncedTerm, mediaTypes, stage, subject, duration, domain, withNotes, mineOnly]
  );

  const query = useQuery({
    queryKey,
    enabled: open && (debouncedTerm.length > 0 || hasFilters),
    queryFn: () =>
      searchLessonBuilderResources(planId, {
        query: debouncedTerm,
        mediaTypes,
        stage,
        subject,
        duration,
        domain: domain.trim() || null,
        withNotes,
        mineOnly,
      }),
  });

  const results = query.data ?? [];
  const showEmptyState = !query.isFetching && (debouncedTerm.length > 0 || hasFilters) && results.length === 0;

  const toggleMediaType = (value: string) => {
    setMediaTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const clearFilters = () => {
    setMediaTypes([]);
    setStage(null);
    setSubject(null);
    setDuration(null);
    setDomain("");
    setWithNotes(false);
    setMineOnly(false);
  };

  const handleSelect = (resource: LessonBuilderResourceSearchResult) => {
    onSelect(resource);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {copy.placeholder}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setDebouncedTerm(event.currentTarget.value.trim());
                  }
                }}
                placeholder={copy.placeholder}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" onClick={clearFilters} disabled={!hasFilters}>
              {copy.clearFilters}
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{copy.mediaLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {MEDIA_TYPES.map((type) => {
                    const active = mediaTypes.includes(type);
                    return (
                      <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() => toggleMediaType(type)}
                      >
                        {type}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="resource-stage">{copy.stageLabel}</Label>
                  <Select value={stage ?? undefined} onValueChange={(value) => setStage(value)}>
                    <SelectTrigger id="resource-stage">
                      <SelectValue placeholder={copy.stageLabel} />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {STAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource-subject">{copy.subjectLabel}</Label>
                  <Select value={subject ?? undefined} onValueChange={(value) => setSubject(value)}>
                    <SelectTrigger id="resource-subject">
                      <SelectValue placeholder={copy.subjectLabel} />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {SUBJECT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resource-duration">{copy.durationLabel}</Label>
                <Select value={duration ?? undefined} onValueChange={(value) => setDuration(value)}>
                  <SelectTrigger id="resource-duration">
                    <SelectValue placeholder={copy.durationLabel} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {DURATION_FILTERS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-domain">{copy.domainLabel}</Label>
                <Input
                  id="resource-domain"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="example.com"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="resource-notes" checked={withNotes} onCheckedChange={setWithNotes} />
                <Label htmlFor="resource-notes" className="text-sm font-medium">
                  {copy.notesToggle}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="resource-mine" checked={mineOnly} onCheckedChange={setMineOnly} />
                <Label htmlFor="resource-mine" className="text-sm font-medium">
                  {copy.mineToggle}
                </Label>
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-[50vh] pr-4">
            {query.isFetching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.loading}
              </div>
            ) : showEmptyState ? (
              <p className="text-sm text-muted-foreground">{copy.empty}</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {copy.placeholder}
              </p>
            ) : (
              <div className="space-y-4">
                {results.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border/70 p-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        {resource.favicon ? (
                          <img
                            src={resource.favicon}
                            alt=""
                            className="mt-0.5 h-5 w-5 rounded"
                          />
                        ) : null}
                        <div>
                          <p className="font-medium text-foreground">{resource.title}</p>
                          {resource.description ? (
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resource.mediaType ? (
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                            {resource.mediaType}
                          </Badge>
                        ) : null}
                        {resource.duration ? (
                          <Badge variant="outline" className="text-[10px]">
                            {resource.duration}
                          </Badge>
                        ) : null}
                        {resource.stage ? (
                          <Badge variant="outline" className="text-[10px]">
                            {resource.stage}
                          </Badge>
                        ) : null}
                        {resource.subjects?.map((subjectTag) => (
                          <Badge key={subjectTag} variant="outline" className="text-[10px]">
                            {subjectTag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => handleSelect(resource)}>{copy.addLabel}</Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
