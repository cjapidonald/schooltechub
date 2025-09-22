import { useMemo, useState } from "react";
import { ExternalLink, GripVertical, MoreVertical, Search, ShieldAlert, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { BuilderStep } from "../types";
import type { LinkHealthStatus } from "../api/linkHealth";
import { createResourceLink } from "../utils/stepFactories";
import { ResourceSearchDialog } from "./ResourceSearchDialog";
import type { ResourceCard } from "@/types/resources";

interface StepCardProps {
  index: number;
  step: BuilderStep;
  onChange: (stepId: string, patch: Partial<BuilderStep>) => void;
  onRemove: (stepId: string) => void;
  onDuplicate: (stepId: string) => void;
  onDragStart: (stepId: string) => void;
  onDrop: (fromStepId: string, toStepId: string) => void;
  healthLookup: Record<string, LinkHealthStatus>;
}

const GROUPING_OPTIONS = ["Whole Class", "Small Group", "Pairs", "Individual"];
const DELIVERY_OPTIONS = ["In-person", "Online", "Hybrid"];

export const StepCard = ({
  index,
  step,
  onChange,
  onRemove,
  onDuplicate,
  onDragStart,
  onDrop,
  healthLookup,
}: StepCardProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const unhealthyResources = useMemo(
    () => step.resources.filter(resource => healthLookup[resource.url]?.isHealthy === false),
    [step.resources, healthLookup],
  );

  const handleFieldChange = <K extends keyof BuilderStep>(field: K, value: BuilderStep[K]) => {
    onChange(step.id, { [field]: value } as Partial<BuilderStep>);
  };

  const handleSelectResource = (resource: ResourceCard) => {
    const mapped = createResourceLink({
      resourceId: resource.id,
      title: resource.title,
      url: resource.url,
      description: resource.description ?? null,
      tags: resource.tags,
      resourceType: resource.resourceType ?? null,
      subject: resource.subject ?? null,
      gradeLevel: resource.gradeLevel ?? null,
      format: resource.format ?? null,
      instructionalNotes: resource.instructionalNotes ?? null,
      creatorId: resource.creatorId ?? null,
      creatorName: resource.creatorName ?? null,
    });

    const existing = step.resources.filter(item => item.resourceId !== resource.id);
    const normalizedTitle = step.title.trim().toLowerCase();
    const shouldRenameStep = existing.length === 0 && (!step.title || normalizedTitle === "new step");

    onChange(step.id, {
      resources: [...existing, mapped],
      ...(shouldRenameStep ? { title: resource.title } : {}),
    });
    setIsSearchOpen(false);
  };

  const handleRemoveResource = (resourceId: string) => {
    onChange(step.id, {
      resources: step.resources.filter(resource => resource.id !== resourceId),
    });
  };

  return (
    <Card
      className="group relative border-border/70 bg-background/70 shadow-sm"
      draggable
      data-testid={`step-card-${index}`}
      onDragStart={event => {
        event.dataTransfer.setData("text/plain", step.id);
        onDragStart(step.id);
      }}
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        const fromId = event.dataTransfer.getData("text/plain");
        if (fromId && fromId !== step.id) {
          onDrop(fromId, step.id);
        }
      }}
    >
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" aria-hidden />
            {step.title.trim() || "New step"}
            {unhealthyResources.length ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="inline-flex items-center gap-1 text-xs">
                      <ShieldAlert className="h-3 w-3" /> {unhealthyResources.length} broken link
                      {unhealthyResources.length > 1 ? "s" : ""}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {unhealthyResources.map(resource => (
                      <div key={resource.id} className="space-y-1">
                        <p className="font-semibold">{resource.title}</p>
                        <p>{healthLookup[resource.url]?.statusText ?? "Link failed to load."}</p>
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Capture learning goals, structure, and the resources that power this moment in your lesson.
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Step actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicate(step.id)}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRemove(step.id)} className="text-destructive">
              Remove step
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`step-${step.id}-learning-goals`}>
            Learning goals
          </label>
          <Textarea
            id={`step-${step.id}-learning-goals`}
            value={step.learningGoals}
            onChange={event => handleFieldChange("learningGoals", event.target.value)}
            placeholder="What should students know or be able to do after this step?"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-title`}>
              Title
            </label>
            <Input
              id={`step-${step.id}-title`}
              value={step.title}
              onChange={event => handleFieldChange("title", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-duration`}>
              Duration
            </label>
            <Input
              id={`step-${step.id}-duration`}
              value={step.duration}
              placeholder="e.g. 20 minutes"
              onChange={event => handleFieldChange("duration", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-grouping`}>
              Grouping
            </label>
            <Select value={step.grouping} onValueChange={value => handleFieldChange("grouping", value)}>
              <SelectTrigger id={`step-${step.id}-grouping`}>
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                {GROUPING_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-delivery`}>
              Delivery mode
            </label>
            <Select value={step.deliveryMode} onValueChange={value => handleFieldChange("deliveryMode", value)}>
              <SelectTrigger id={`step-${step.id}-delivery`}>
                <SelectValue placeholder="Choose delivery" />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Resources</p>
            <p className="text-xs text-muted-foreground">
              Search classroom-ready materials with embedded instructional notes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="group flex w-full items-center gap-2 rounded-md border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            data-builder-resource-search
          >
            <Search className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
            <span className="flex-1 text-left">Search by title or tag to add a resource</span>
          </button>
          <div className="space-y-4">
            {step.resources.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Add a resource to pull in suggested instructional moves and classroom-ready links.
              </div>
            ) : (
              step.resources.map(resource => {
                const health = healthLookup[resource.url];
                const warning = health && !health.isHealthy;
                return (
                  <div key={resource.id} className="space-y-3 rounded-lg border border-border/60 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold">{resource.title}</p>
                          {resource.resourceType ? <Badge variant="secondary">{resource.resourceType}</Badge> : null}
                          {resource.format ? <Badge variant="outline">{resource.format}</Badge> : null}
                        </div>
                        {resource.description ? (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {resource.subject ? (
                            <Badge variant="outline">{resource.subject}</Badge>
                          ) : null}
                          {resource.gradeLevel ? (
                            <Badge variant="outline">{resource.gradeLevel}</Badge>
                          ) : null}
                          {resource.tags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Open resource
                          </a>
                          {resource.creatorName ? <span>Shared by {resource.creatorName}</span> : null}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        {warning ? (
                          <Badge variant="destructive" className="inline-flex items-center gap-1 text-xs">
                            <ShieldAlert className="h-3 w-3" /> Check link
                          </Badge>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveResource(resource.id)}
                          aria-label="Remove resource"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {resource.instructionalNotes ? (
                      <div className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Instructional notes</p>
                        <p>{resource.instructionalNotes}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`step-${step.id}-notes`}>
            Offline fallback (teacher only)
          </label>
          <Textarea
            id={`step-${step.id}-notes`}
            value={step.notes}
            onChange={event => handleFieldChange("notes", event.target.value)}
            placeholder="Describe the analog or no-tech alternative for this step."
            rows={3}
          />
        </div>
      </CardContent>

      <ResourceSearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelect={handleSelectResource}
      />
    </Card>
  );
};
