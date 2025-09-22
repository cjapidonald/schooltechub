import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  LessonBuilderPart,
  LessonBuilderVersionEntry,
} from "@/types/lesson-builder";

interface PartsSidebarCopy {
  title: string;
  empty: string;
}

interface HistoryCopy {
  title: string;
  empty: string;
}

interface PartsSidebarProps {
  parts: LessonBuilderPart[];
  selectedPart: string | null;
  onSelect: (id: string) => void;
  copy: PartsSidebarCopy;
  history: LessonBuilderVersionEntry[];
  historyCopy: HistoryCopy;
}

export const PartsSidebar = ({
  parts,
  selectedPart,
  onSelect,
  copy,
  history,
  historyCopy,
}: PartsSidebarProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">{copy.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {parts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            <div className="space-y-2">
              {parts.map((part) => (
                <Button
                  key={part.id}
                  variant={part.id === selectedPart ? "secondary" : "ghost"}
                  className="w-full justify-start text-left"
                  onClick={() => onSelect(part.id)}
                >
                  <div className="flex w-full flex-col">
                    <span className="font-medium text-foreground">{part.label}</span>
                    {part.description ? (
                      <span className="text-xs text-muted-foreground">{part.description}</span>
                    ) : null}
                  </div>
                  {part.completed ? (
                    <Badge className="ml-2" variant="outline">
                      ✓
                    </Badge>
                  ) : null}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">{historyCopy.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">{historyCopy.empty}</p>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-4 px-6 py-4">
                {history.map((entry) => (
                  <div key={entry.id} className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                    {entry.summary ? (
                      <p className="text-xs text-muted-foreground">{entry.summary}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
