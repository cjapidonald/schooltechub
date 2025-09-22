import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types/resources";

interface ResourceCardProps {
  resource: Resource;
  layout?: "horizontal" | "vertical";
  onAdd?: () => void;
  addButtonLabel?: string;
}

const formatMetadata = (resource: Resource) => {
  const metadata: string[] = [];
  if (resource.type?.trim()) {
    metadata.push(resource.type.trim());
  }
  if (resource.subject?.trim()) {
    metadata.push(resource.subject.trim());
  }
  if (resource.stage?.trim()) {
    metadata.push(resource.stage.trim());
  }
  return metadata;
};

export const ResourceCard = ({
  resource,
  layout = "horizontal",
  onAdd,
  addButtonLabel,
}: ResourceCardProps) => {
  const metadata = formatMetadata(resource);
  const tags = resource.tags?.filter(tag => tag.trim().length > 0).slice(0, 4) ?? [];
  const isVertical = layout === "vertical";
  const showAddButton = typeof onAdd === "function";

  const media = (
    <div
      className={cn(
        "overflow-hidden rounded-md bg-muted",
        isVertical ? "aspect-video w-full" : "h-16 w-24 flex-shrink-0",
      )}
    >
      {resource.thumbnail_url ? (
        <img
          src={resource.thumbnail_url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
          No preview
        </div>
      )}
    </div>
  );

  const content = (
    <div className={cn("min-w-0 flex-1 space-y-2", isVertical && "min-w-full")}>
      <p className="line-clamp-2 text-sm font-semibold text-foreground">{resource.title}</p>
      {resource.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{resource.description}</p>
      ) : null}
      {metadata.length || tags.length ? (
        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          {metadata.map(item => (
            <Badge key={`meta-${item}`} variant="outline">
              {item}
            </Badge>
          ))}
          {tags.map(tag => (
            <Badge key={`tag-${tag}`} variant="secondary" className="rounded-full">
              #{tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <article
      className={cn(
        "rounded-lg border border-border/70 bg-background/80 p-3 shadow-sm",
        isVertical ? "flex flex-col gap-3" : "flex gap-3",
        showAddButton && "relative",
      )}
    >
      {showAddButton ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 h-7 w-7"
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            onAdd?.();
          }}
          aria-label={addButtonLabel ?? "Add resource"}
        >
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
      {isVertical ? (
        <>
          {media}
          {content}
        </>
      ) : (
        <>
          {media}
          {content}
        </>
      )}
    </article>
  );
};

export default ResourceCard;
