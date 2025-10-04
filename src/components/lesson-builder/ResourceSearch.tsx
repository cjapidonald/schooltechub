import { useEffect, useMemo, useState, type KeyboardEventHandler } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Resource, ResourceType } from "../../../types/supabase-tables";
import { useLanguage } from "@/contexts/LanguageContext";

const RESOURCE_TYPES: ResourceType[] = ["link", "pdf", "ppt", "docx", "image", "video"];

type CostFilter = "both" | "free" | "paid";

type ResourceSearchProps = {
  resources: Resource[];
  loading: boolean;
  onFilterChange: (filters: {
    query: string;
    types: ResourceType[];
    subject: string;
    stage: string;
    cost: CostFilter;
    tags: string[];
  }) => void;
  onInsert: (resource: Resource) => void;
  highlighted?: boolean;
};

export function ResourceSearch({ resources, loading, onFilterChange, onInsert, highlighted = false }: ResourceSearchProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [subject, setSubject] = useState("");
  const [cost, setCost] = useState<CostFilter>("both");
  const [types, setTypes] = useState<ResourceType[]>(RESOURCE_TYPES);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange({ query, types, subject, stage, cost, tags });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, types, subject, stage, cost, tags, onFilterChange]);

  const toggleType = (value: ResourceType) => {
    setTypes(prev => (prev.includes(value) ? prev.filter(type => type !== value) : [...prev, value]));
  };

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setTags(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  };

  const handleTagKeyDown: KeyboardEventHandler<HTMLInputElement> = event => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  };

  const removeTag = (value: string) => {
    setTags(prev => prev.filter(tag => tag !== value));
  };

  const costOptions = useMemo(
    () => [
      { value: "both" as CostFilter, label: t.lessonBuilder.resources.costFilters.both },
      { value: "free" as CostFilter, label: t.lessonBuilder.resources.costFilters.free },
      { value: "paid" as CostFilter, label: t.lessonBuilder.resources.costFilters.paid },
    ],
    [t.lessonBuilder.resources.costFilters.both, t.lessonBuilder.resources.costFilters.free, t.lessonBuilder.resources.costFilters.paid],
  );

  return (
    <div
      id="lesson-resource-finder"
      className={cn(
        "flex h-full flex-col gap-4 rounded-lg border bg-background/40 p-2",
        highlighted && "ring-2 ring-primary/80 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.lessonBuilder.resources.title}</h3>
        </div>
        <div className="space-y-2">
          <label className="sr-only" htmlFor="resource-search">
            {t.lessonBuilder.resources.searchLabel}
          </label>
          <Input
            id="resource-search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t.lessonBuilder.resources.searchPlaceholder}
          />
          <div className="grid gap-3 rounded-lg border bg-background/60 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span>{t.lessonBuilder.resources.filtersTitle}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {RESOURCE_TYPES.map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={types.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType(type)}
                  aria-pressed={types.includes(type)}
                  aria-label={t.lessonBuilder.resources.typeFilter[type]}
                >
                  {t.lessonBuilder.resources.typeFilter[type]}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 text-sm">
              <div className="grid gap-2">
                <label className="font-medium" htmlFor="resource-tags">
                  {t.lessonBuilder.resources.tagsLabel}
                </label>
                <Input
                  id="resource-tags"
                  value={tagInput}
                  onChange={event => setTagInput(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={t.lessonBuilder.resources.tagsPlaceholder}
                />
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="rounded-full p-0.5 hover:bg-secondary-foreground/10"
                          aria-label={t.lessonBuilder.resources.removeTagLabel.replace("{tag}", tag)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">{t.lessonBuilder.resources.removeTagLabel.replace("{tag}", tag)}</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                <span className="font-medium">{t.lessonBuilder.resources.costLabel}</span>
                <div className="flex flex-wrap gap-2">
                  {costOptions.map(option => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={cost === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCost(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="font-medium" htmlFor="resource-stage">
                  {t.lessonBuilder.resources.stageLabel}
                </label>
                <Input
                  id="resource-stage"
                  value={stage}
                  onChange={event => setStage(event.target.value)}
                  placeholder={t.lessonBuilder.resources.stagePlaceholder}
                />
              </div>
              <div className="grid gap-2">
                <label className="font-medium" htmlFor="resource-subject">
                  {t.lessonBuilder.resources.subjectLabel}
                </label>
                <Input
                  id="resource-subject"
                  value={subject}
                  onChange={event => setSubject(event.target.value)}
                  placeholder={t.lessonBuilder.resources.subjectPlaceholder}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
          {loading ? (
            <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              {t.lessonBuilder.resources.loading}
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              {t.lessonBuilder.resources.empty}
            </div>
          ) : (
            resources.map(resource => {
              const metaRecord =
                typeof resource.meta === "object" && resource.meta !== null
                  ? (resource.meta as Record<string, unknown>)
                  : {};
              const stageValue = typeof metaRecord.stage === "string" ? metaRecord.stage : null;
              const subjectValue = typeof metaRecord.subject === "string" ? metaRecord.subject : null;
              const normalizedTags = Array.isArray(metaRecord.tags)
                ? (metaRecord.tags as unknown[]).map(tag => String(tag))
                : [];

              return (
                <article key={resource.id} className="rounded-lg border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.instructions ?? t.lessonBuilder.resources.noInstructions}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={cn("capitalize", resource.type === "video" ? "text-red-500" : undefined)}>
                          {t.lessonBuilder.resources.typeFilter[resource.type]}
                        </Badge>
                        {stageValue ? <Badge variant="secondary">{String(stageValue)}</Badge> : null}
                        {subjectValue ? <Badge variant="secondary">{String(subjectValue)}</Badge> : null}
                        {normalizedTags.map(tag => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => onInsert(resource)} aria-label={t.lessonBuilder.resources.insert}>
                      {t.lessonBuilder.resources.insert}
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
