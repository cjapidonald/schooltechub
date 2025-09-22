import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LessonBuilderActivity } from "@/types/lesson-builder";

interface ActivitySearchCopy {
  title: string;
  placeholder: string;
  helper: string;
  addLabel: string;
  empty: string;
}

interface ActivitySearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: LessonBuilderActivity[];
  onAdd: (activity: LessonBuilderActivity) => void;
  isLoading: boolean;
  copy: ActivitySearchCopy;
}

export const ActivitySearchPanel = ({
  query,
  onQueryChange,
  results,
  onAdd,
  isLoading,
  copy,
}: ActivitySearchPanelProps) => {
  const hasResults = results.length > 0;
  const helperText = useMemo(() => copy.helper.replace("{min}", "3"), [copy.helper]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={copy.placeholder}
          />
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </div>
        <ScrollArea className="h-[240px]">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : hasResults ? (
            <div className="space-y-4">
              {results.map((activity) => (
                <div key={activity.id} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{activity.title}</p>
                      {activity.summary ? (
                        <p className="text-sm text-muted-foreground">{activity.summary}</p>
                      ) : null}
                    </div>
                    <Button size="sm" onClick={() => onAdd(activity)}>
                      {copy.addLabel}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activity.subjects.map((subject) => (
                      <Badge key={subject} variant="secondary">
                        {subject}
                      </Badge>
                    ))}
                    {activity.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
