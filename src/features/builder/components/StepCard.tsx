import { GripVertical, Link2, MoreVertical, ShieldAlert, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { BuilderStep } from "../types";
import type { LinkHealthStatus } from "../api/linkHealth";
import { createResourceLink } from "../utils/stepFactories";

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
  const unhealthyResources = step.resources.filter(resource => healthLookup[resource.url]?.isHealthy === false);

  const handleFieldChange = <K extends keyof BuilderStep>(field: K, value: BuilderStep[K]) => {
    onChange(step.id, { [field]: value } as Partial<BuilderStep>);
  };

  const handleResourceChange = (resourceId: string, field: "label" | "url", value: string) => {
    const next = step.resources.map(resource =>
      resource.id === resourceId ? { ...resource, [field]: value } : resource,
    );
    onChange(step.id, { resources: next });
  };

  const handleAddResource = () => {
    onChange(step.id, { resources: [...step.resources, createResourceLink("New resource")] });
  };

  const handleRemoveResource = (resourceId: string) => {
    onChange(step.id, { resources: step.resources.filter(resource => resource.id !== resourceId) });
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
            Step {index + 1}: {step.title}
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
                        <p className="font-semibold">{resource.label}</p>
                        <p>{healthLookup[resource.url]?.statusText ?? "Link failed to load."}</p>
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Outline what happens, how long it takes, and the tech setup. Offline fallback stays just for teachers.
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
        <div className="grid gap-4 md:grid-cols-2">
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
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-goal`}>
              Learning goal
            </label>
            <Input
              id={`step-${step.id}-goal`}
              value={step.goal}
              onChange={event => handleFieldChange("goal", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-duration`}>
              Duration (minutes)
            </label>
            <Input
              id={`step-${step.id}-duration`}
              type="number"
              min={1}
              value={step.durationMinutes}
              onChange={event => handleFieldChange("durationMinutes", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-grouping`}>
              Grouping
            </label>
            <Input
              id={`step-${step.id}-grouping`}
              value={step.grouping}
              onChange={event => handleFieldChange("grouping", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-delivery`}>
              Delivery mode
            </label>
            <Input
              id={`step-${step.id}-delivery`}
              value={step.deliveryMode}
              onChange={event => handleFieldChange("deliveryMode", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-tags`}>
              Tags
            </label>
            <Input
              id={`step-${step.id}-tags`}
              value={step.tags.join(", ")}
              onChange={event => handleFieldChange(
                "tags",
                event.target.value.split(",").map(tag => tag.trim()).filter(Boolean),
              )}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`step-${step.id}-notes`}>
            Instructional notes
          </label>
          <Textarea
            id={`step-${step.id}-notes`}
            value={step.notes}
            onChange={event => handleFieldChange("notes", event.target.value)}
            placeholder="Teacher-facing reminders, facilitation moves, differentiation prompts..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor={`step-${step.id}-offline`}>
              Offline fallback (teacher only)
            </label>
            <span className="text-xs text-muted-foreground">Will appear in exports for teachers, hidden from student view.</span>
          </div>
          <Textarea
            id={`step-${step.id}-offline`}
            value={step.offlineFallback}
            onChange={event => handleFieldChange("offlineFallback", event.target.value)}
            placeholder="Describe the no-wifi backup plan, printable materials, or analog alternative."
            rows={3}
            data-testid={`offline-fallback-${index}`}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Resources</label>
            <Button size="sm" variant="outline" onClick={handleAddResource} data-testid={`add-resource-${index}`}>
              Add resource
            </Button>
          </div>
          <div className="space-y-4">
            {step.resources.map(resource => {
              const health = healthLookup[resource.url];
              const warning = health && !health.isHealthy;
              return (
                <div key={resource.id} className="grid gap-2 rounded-lg border border-border/60 p-3">
                  <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto] md:items-start md:gap-3">
                    <Input
                      value={resource.label}
                      onChange={event => handleResourceChange(resource.id, "label", event.target.value)}
                      placeholder="Resource label"
                      className="md:col-span-1"
                    />
                    <div className="md:col-span-1 md:col-start-2">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={resource.url}
                          onChange={event => handleResourceChange(resource.id, "url", event.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      {warning ? (
                        <p className="mt-2 flex items-center gap-2 text-xs text-destructive">
                          <ShieldAlert className="h-3 w-3" />
                          {health?.statusText ?? "Link check failed. Verify before sharing."}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-end">
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
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
