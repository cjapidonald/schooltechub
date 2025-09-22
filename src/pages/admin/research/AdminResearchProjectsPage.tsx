import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { ResearchProject, ResearchProjectStatus, ResearchProjectVisibility } from "@/types/platform";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { fetchResearchProjects, PROJECT_QUERY_KEY } from "./queries";

const STATUS_OPTIONS: Array<{ value: ResearchProjectStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const VISIBILITY_OPTIONS: Array<{ value: ResearchProjectVisibility; label: string }> = [
  { value: "list_public", label: "Listed (Public)" },
  { value: "private", label: "Private" },
];

interface ProjectFormValues {
  title: string;
  slug: string;
  summary: string;
  status: ResearchProjectStatus;
  visibility: ResearchProjectVisibility;
}

interface FormDialogState {
  open: boolean;
  project: ResearchProject | null;
}

interface DeleteDialogState {
  open: boolean;
  project: ResearchProject | null;
}

function initialFormValues(project: ResearchProject | null): ProjectFormValues {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    summary: project?.summary ?? "",
    status: project?.status ?? "draft",
    visibility: project?.visibility ?? "list_public",
  } satisfies ProjectFormValues;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function saveProject(values: ProjectFormValues, existing?: ResearchProject | null): Promise<ResearchProject> {
  const title = values.title.trim();
  if (!title) {
    throw new Error("A project title is required");
  }

  const rawSlug = values.slug.trim();
  const slugCandidate = rawSlug || slugify(title);
  const payload = {
    title,
    slug: slugCandidate.length > 0 ? slugCandidate : null,
    summary: values.summary.trim() || null,
    status: values.status,
    visibility: values.visibility,
  } satisfies Partial<ResearchProject> & { title: string; status: ResearchProjectStatus; visibility: ResearchProjectVisibility };

  if (existing) {
    const { data, error } = await supabase
      .from("research_projects")
      .update(payload)
      .eq("id", existing.id)
      .select("id,title,slug,summary,status,visibility,created_by,created_at")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update project");
    }

    return {
      id: String(data.id ?? existing.id),
      title: data.title ?? title,
      slug: data.slug ?? payload.slug,
      summary: data.summary ?? payload.summary,
      status: (data.status as ResearchProjectStatus | undefined) ?? payload.status,
      visibility: (data.visibility as ResearchProjectVisibility | undefined) ?? payload.visibility,
      createdBy: data.created_by ?? existing.createdBy ?? null,
      createdAt: data.created_at ?? existing.createdAt,
    } satisfies ResearchProject;
  }

  const { data: userResult } = await supabase.auth.getUser();
  const userId = userResult?.user?.id ?? null;

  const { data, error } = await supabase
    .from("research_projects")
    .insert({
      ...payload,
      created_by: userId,
    })
    .select("id,title,slug,summary,status,visibility,created_by,created_at")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create project");
  }

  return {
    id: String(data.id ?? ""),
    title: data.title ?? title,
    slug: data.slug ?? payload.slug,
    summary: data.summary ?? payload.summary,
    status: (data.status as ResearchProjectStatus | undefined) ?? payload.status,
    visibility: (data.visibility as ResearchProjectVisibility | undefined) ?? payload.visibility,
    createdBy: data.created_by ?? userId,
    createdAt: data.created_at ?? new Date().toISOString(),
  } satisfies ResearchProject;
}

async function deleteProject(project: ResearchProject): Promise<void> {
  const { error } = await supabase.from("research_projects").delete().eq("id", project.id);

  if (error) {
    throw new Error(error.message || "Failed to delete project");
  }
}

export default function AdminResearchProjectsPage(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<FormDialogState>({ open: false, project: null });
  const [deleteState, setDeleteState] = useState<DeleteDialogState>({ open: false, project: null });

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery<ResearchProject[], Error>({
    queryKey: PROJECT_QUERY_KEY,
    queryFn: fetchResearchProjects,
  });

  const form = useForm<ProjectFormValues>({
    defaultValues: initialFormValues(null),
  });

  useEffect(() => {
    if (formState.open) {
      form.reset(initialFormValues(formState.project));
    }
  }, [formState, form]);

  const statusValue = form.watch("status") ?? "draft";
  const visibilityValue = form.watch("visibility") ?? "list_public";

  const mutation = useMutation({
    mutationFn: (values: ProjectFormValues) => saveProject(values, formState.project),
    onSuccess: async project => {
      await queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY });
      setFormState({ open: false, project: null });
      toast({ title: "Project saved", description: `${project.title} is now ${project.status}.` });
    },
    onError: err => {
      toast({ title: "Unable to save project", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => (deleteState.project ? deleteProject(deleteState.project) : Promise.resolve()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY });
      setDeleteState({ open: false, project: null });
      toast({ title: "Project removed", description: "The project has been deleted." });
    },
    onError: err => {
      toast({
        title: "Unable to delete project",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const tableContent = useMemo(() => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
            Loading projects…
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-sm text-destructive">
            Failed to load projects.
          </TableCell>
        </TableRow>
      );
    }

    if (projects.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
            No research projects have been created yet.
          </TableCell>
        </TableRow>
      );
    }

    return projects.map(project => (
      <TableRow key={project.id}>
        <TableCell>
          <div className="font-medium">{project.title}</div>
          <div className="text-xs text-muted-foreground">Created {new Date(project.createdAt).toLocaleString()}</div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{project.slug ?? <span className="italic">Not set</span>}</TableCell>
        <TableCell>
          <Badge variant={project.status === "open" ? "default" : project.status === "closed" ? "secondary" : "outline"}>
            {project.status === "draft" ? "Draft" : project.status === "open" ? "Open" : "Closed"}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={project.visibility === "list_public" ? "outline" : "secondary"}>
            {project.visibility === "list_public" ? "Listed" : "Private"}
          </Badge>
        </TableCell>
        <TableCell className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormState({ open: true, project })}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteState({ open: true, project })}
          >
            Delete
          </Button>
        </TableCell>
      </TableRow>
    ));
  }, [projects, isLoading, error]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Research projects</CardTitle>
            <CardDescription>Define active studies, configure visibility, and track their lifecycle.</CardDescription>
          </div>
          <Dialog
            open={formState.open}
            onOpenChange={open => setFormState(current => ({ open, project: open ? current.project : null }))}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setFormState({ open: true, project: null })}>New project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{formState.project ? "Edit project" : "Create project"}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={event => {
                  event.preventDefault();
                  void form.handleSubmit(values => mutation.mutate(values))(event);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="project-title">Title</Label>
                  <Input id="project-title" placeholder="AI in the classroom" {...form.register("title")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-slug">Slug</Label>
                  <Input id="project-slug" placeholder="ai-in-the-classroom" {...form.register("slug")} />
                  <p className="text-xs text-muted-foreground">Leave blank to generate from the title.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-summary">Summary</Label>
                  <Textarea id="project-summary" rows={3} placeholder="Short description" {...form.register("summary")} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusValue} onValueChange={value => form.setValue("status", value as ResearchProjectStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <Select
                      value={visibilityValue}
                      onValueChange={value => form.setValue("visibility", value as ResearchProjectVisibility)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving…" : "Save project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{tableContent}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteState.open}
        onOpenChange={open => setDeleteState(current => ({ open, project: open ? current.project : null }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project{deleteState.project ? ` "${deleteState.project.title}"` : ""} and any
              associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!deleteState.project) return;
                  deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
