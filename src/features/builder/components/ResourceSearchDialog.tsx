import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

import type { ResourceCard } from "@/types/resources";
import { searchResources } from "@/lib/resources-api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

interface ResourceSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (resource: ResourceCard) => void;
}

const RESOURCE_TYPES = ["Worksheet", "Video", "Game", "Image", "Presentation", "Article", "Interactive", "Other"];
const SUBJECTS = ["Math", "Science", "English", "ICT", "STEM", "Arts"];
const GRADE_LEVELS = ["K-2", "3-5", "6-8", "9-12"];
const FORMATS = ["PDF", "Slides", "Website", "Printable", "Interactive"];

export const ResourceSearchDialog = ({ open, onOpenChange, onSelect }: ResourceSearchDialogProps) => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [format, setFormat] = useState("");
  const [creator, setCreator] = useState("");
  const [results, setResults] = useState<ResourceCard[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setLoading(true);

    searchResources({
      q: debouncedQuery || undefined,
      resourceType: resourceType || undefined,
      subject: subject || undefined,
      gradeLevel: gradeLevel || undefined,
      format: format || undefined,
      limit: 40,
    })
      .then(response => {
        if (!active) return;
        setResults(response.items);
      })
      .catch(error => {
        console.error(error);
        if (!active) return;
        toast({
          title: "Unable to load resources",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, debouncedQuery, resourceType, subject, gradeLevel, format, toast]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResourceType("");
      setSubject("");
      setGradeLevel("");
      setFormat("");
      setCreator("");
      setResults([]);
    }
  }, [open]);

  const filteredResults = useMemo(() => {
    if (!creator.trim()) {
      return results;
    }
    const term = creator.trim().toLowerCase();
    return results.filter(resource => (resource.creatorName ?? "").toLowerCase().includes(term));
  }, [creator, results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Search the resource library</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Find worksheets, games, videos, and more added by educators. Filters help you narrow by classroom needs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="resource-query">
                Topic or keyword
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="resource-query"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search by topic, tool, or activity"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="resource-creator">
                Creator
              </label>
              <Input
                id="resource-creator"
                value={creator}
                onChange={event => setCreator(event.target.value)}
                placeholder="Filter by educator name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Resource type</label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {RESOURCE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {SUBJECTS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Grade band</label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All grades</SelectItem>
                  {GRADE_LEVELS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Any format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any format</SelectItem>
                  {FORMATS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Results</p>
            <div className="rounded-lg border">
              <ScrollArea className="max-h-[420px]">
                <div className="space-y-4 p-4">
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching resources…
                    </div>
                  ) : filteredResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No resources match your filters yet.</p>
                  ) : (
                    filteredResults.map(resource => (
                      <div key={resource.id} className="space-y-3 rounded-md border border-border/60 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold">{resource.title}</p>
                              {resource.resourceType ? <Badge variant="secondary">{resource.resourceType}</Badge> : null}
                              {resource.format ? <Badge variant="outline">{resource.format}</Badge> : null}
                            </div>
                            {resource.description ? (
                              <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>
                            ) : null}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {resource.subject ? <Badge variant="outline">{resource.subject}</Badge> : null}
                              {resource.gradeLevel ? <Badge variant="outline">{resource.gradeLevel}</Badge> : null}
                              {resource.tags.map(tag => (
                                <Badge key={tag} variant="secondary">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            {resource.creatorName ? (
                              <p className="text-xs text-muted-foreground">Shared by {resource.creatorName}</p>
                            ) : null}
                          </div>
                          <Button onClick={() => onSelect(resource)}>Add to step</Button>
                        </div>
                        {resource.instructionalNotes ? (
                          <div className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">Instructional notes preview</p>
                            <p className="line-clamp-4">{resource.instructionalNotes}</p>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
