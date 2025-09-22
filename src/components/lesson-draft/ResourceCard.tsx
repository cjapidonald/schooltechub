import { Badge } from "@/components/ui/badge";
import type { Resource } from "@/types/resources";

interface ResourceCardProps {
  resource: Resource;
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

export const ResourceCard = ({ resource }: ResourceCardProps) => {
  const metadata = formatMetadata(resource);
  const tags = resource.tags?.filter(tag => tag.trim().length > 0).slice(0, 4) ?? [];

  return (
    <article className="flex gap-3 rounded-lg border border-border/70 bg-background/80 p-3 shadow-sm">
      <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
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
      <div className="min-w-0 flex-1 space-y-2">
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
    </article>
  );
};

export default ResourceCard;
