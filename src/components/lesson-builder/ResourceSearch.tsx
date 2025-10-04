import { useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
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
  }) => void;
  onInsert: (resource: Resource) => void;
};

export function ResourceSearch({ resources, loading, onFilterChange, onInsert }: ResourceSearchProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [subject, setSubject] = useState("");
  const [cost, setCost] = useState<CostFilter>("both");
  const [types, setTypes] = useState<ResourceType[]>(RESOURCE_TYPES);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange({ query, types, subject, stage, cost });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, types, subject, stage, cost, onFilterChange]);

  const toggleType = (value: ResourceType) => {
    setTypes(prev => (prev.includes(value) ? prev.filter(type => type !== value) : [...prev, value]));
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
    <div className="flex h-full flex-col gap-4">
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
          <div className="grid gap-2 rounded-lg border p-3">
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
            <div className="grid gap-2 text-sm">
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
              const meta = resource.meta ?? {};
              const stageValue = typeof meta === "object" && meta !== null && "stage" in meta ? meta.stage : null;
              const subjectValue = typeof meta === "object" && meta !== null && "subject" in meta ? meta.subject : null;

              return (
                <article key={resource.id} className="rounded-lg border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold">{resource.title}</h4>
                      {resource.instructions ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">{resource.instructions}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={cn("capitalize", resource.type === "video" ? "text-red-500" : undefined)}>
                          {t.lessonBuilder.resources.typeFilter[resource.type]}
                        </Badge>
                        {stageValue ? <Badge variant="secondary">{String(stageValue)}</Badge> : null}
                        {subjectValue ? <Badge variant="secondary">{String(subjectValue)}</Badge> : null}
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
