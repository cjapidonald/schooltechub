import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const RESOURCE_TYPES = [
  { value: "worksheet", label: "Worksheet" },
  { value: "video", label: "Video" },
  { value: "picture", label: "Picture" },
  { value: "ppt", label: "Presentation" },
  { value: "online", label: "Online activity" },
  { value: "offline", label: "Offline activity" },
] as const;

const RESOURCE_STATUSES: ResourceStatus[] = ["pending", "approved", "rejected"];

const STATUS_LABELS: Record<ResourceStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

type ResourceStatus = "pending" | "approved" | "rejected";

interface AdminResourceRecord {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  storage_path: string | null;
  type: string;
  subject: string | null;
  stage: string | null;
  tags: string[] | null;
  thumbnail_url: string | null;
  status: ResourceStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

interface AdminResource extends AdminResourceRecord {
  tagList: string[];
}

interface ResourceFormValues {
  title: string;
  description: string;
  type: string;
  subject: string;
  stage: string;
  tags: string;
  url: string;
  status: ResourceStatus;
  is_active: boolean;
}

function normaliseTags(input: string): string[] {
  return input
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean)
    .map(tag => tag.replace(/\s+/g, " "));
}

async function fetchResources(): Promise<AdminResource[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("id,title,description,url,storage_path,type,subject,stage,tags,thumbnail_url,status,is_active,created_at,updated_at,created_by,approved_by,approved_at")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(record => ({
    ...record,
    status: record.status as ResourceStatus,
    tagList: record.tags ?? [],
  }));
}

function buildStoragePath(userId: string | null, file: File): string {
  const extensionMatch = file.name?.match(/\.([^.]+)$/);
  const extension = extensionMatch ? extensionMatch[1] : "bin";
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const ownerSegment = userId ?? "system";
  return `admin/${ownerSegment}/${uuid}.${extension}`;
}

async function saveResource(
  values: ResourceFormValues,
  options: { file: File | null; clearStoredFile: boolean; existing?: AdminResource },
): Promise<AdminResource> {
  const { data: userResult } = await supabase.auth.getUser();
  const userId = userResult?.user?.id ?? null;

  let storagePath = options.existing?.storage_path ?? null;

  if (options.clearStoredFile) {
    storagePath = null;
  }

  if (options.file) {
    const path = buildStoragePath(userId, options.file);
    const { error: uploadError } = await supabase.storage
      .from("resources")
      .upload(path, options.file, {
        upsert: false,
        cacheControl: "3600",
        contentType: options.file.type || "application/octet-stream",
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Failed to upload file to storage");
    }

    storagePath = path;
  }

  const urlValue = values.url.trim();
  if (!urlValue && !storagePath) {
    throw new Error("Provide either an external URL or upload a file.");
  }

  const payload = {
    title: values.title.trim(),
    description: values.description.trim() || null,
    type: values.type,
    subject: values.subject.trim() || null,
    stage: values.stage.trim() || null,
    tags: normaliseTags(values.tags),
    url: urlValue || null,
    storage_path: storagePath,
    status: values.status,
    is_active: values.is_active,
  } satisfies Partial<AdminResourceRecord> & { title: string; type: string; status: ResourceStatus; is_active: boolean };

  const approvedPatch =
    values.status === "approved"
      ? {
          approved_by: userId,
          approved_at: options.existing?.approved_at ?? new Date().toISOString(),
        }
      : {
          approved_by: null,
          approved_at: null,
        };

  if (!options.existing) {
    const { data, error } = await supabase
      .from("resources")
      .insert({
        ...payload,
        ...approvedPatch,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create resource");
    }

    return {
      ...data,
      status: data.status as ResourceStatus,
      tagList: data.tags ?? []
    };
  }

  const { data, error } = await supabase
    .from("resources")
    .update({
      ...payload,
      ...approvedPatch,
    })
    .eq("id", options.existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update resource");
  }

  return {
    ...data,
    status: data.status as ResourceStatus,
    tagList: data.tags ?? []
  };
}

export function AdminResourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: fetchResources,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AdminResource | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clearStoredFile, setClearStoredFile] = useState(false);
  const [actionResourceId, setActionResourceId] = useState<string | null>(null);

  const typeOptions = useMemo(() => {
    const base = [...RESOURCE_TYPES] as Array<{value: string, label: string}>;
    if (editingResource && editingResource.type && !base.some(option => option.value === editingResource.type)) {
      base.push({ value: editingResource.type as any, label: editingResource.type as any });
    }
    return base;
  }, [editingResource]);

  const mutation = useMutation({
    mutationFn: ({ values, file, clearFile, existing }: { values: ResourceFormValues; file: File | null; clearFile: boolean; existing?: AdminResource }) =>
      saveResource(values, { file, clearStoredFile: clearFile, existing }),
    onSuccess: result => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
      const existing = mutation.variables?.existing;
      toast({ title: existing ? "Resource updated" : "Resource created" });
      setDialogOpen(false);
      setEditingResource(null);
      setSelectedFile(null);
      setClearStoredFile(false);
    },
    onError: mutationError => {
      const description =
        mutationError instanceof Error ? mutationError.message : "Something went wrong while saving the resource.";
      toast({ title: "Unable to save resource", description, variant: "destructive" });
    },
  });

  const defaultValues = useMemo<ResourceFormValues>(() => {
    if (!editingResource) {
      return {
        title: "",
        description: "",
        type: RESOURCE_TYPES[0]?.value ?? "worksheet",
        subject: "",
        stage: "",
        tags: "",
        url: "",
        status: "pending",
        is_active: true,
      };
    }

    return {
      title: editingResource.title,
      description: editingResource.description ?? "",
      type: editingResource.type,
      subject: editingResource.subject ?? "",
      stage: editingResource.stage ?? "",
      tags: (editingResource.tagList ?? []).join(", "),
      url: editingResource.url ?? "",
      status: editingResource.status,
      is_active: editingResource.is_active,
    };
  }, [editingResource]);

  const form = useForm<ResourceFormValues>({ defaultValues });

  useEffect(() => {
    form.reset(defaultValues);
    setSelectedFile(null);
    setClearStoredFile(false);
  }, [defaultValues, form]);

  const openCreate = () => {
    setEditingResource(null);
    setDialogOpen(true);
  };

  const openEdit = (resource: AdminResource) => {
    setEditingResource(resource);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingResource(null);
      setSelectedFile(null);
      setClearStoredFile(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
    if (nextFile) {
      setClearStoredFile(false);
    }
  };

  const handleRemoveStoredFile = () => {
    setSelectedFile(null);
    setClearStoredFile(true);
  };

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ values, file: selectedFile, clearFile: clearStoredFile, existing: editingResource ?? undefined });
  });

  const performUpdate = async (id: string, update: Record<string, unknown>, successMessage: string) => {
    setActionResourceId(id);
    try {
      const { error: updateError } = await supabase.from("resources").update(update).eq("id", id);
      if (updateError) {
        throw new Error(updateError.message);
      }
      toast({ title: successMessage });
      void queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
    } catch (updateError) {
      const description = updateError instanceof Error ? updateError.message : "Unexpected error";
      toast({ title: "Update failed", description, variant: "destructive" });
    } finally {
      setActionResourceId(null);
    }
  };

  const handleApprove = async (resource: AdminResource) => {
    setActionResourceId(resource.id);
    try {
      const { data: userResult, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw new Error(authError.message);
      }
      const userId = userResult?.user?.id ?? null;
      const { error: updateError } = await supabase
        .from("resources")
        .update({
          status: "approved",
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: userId,
        })
        .eq("id", resource.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({ title: "Resource approved" });
      void queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
    } catch (updateError) {
      const description = updateError instanceof Error ? updateError.message : "Unexpected error";
      toast({ title: "Update failed", description, variant: "destructive" });
    } finally {
      setActionResourceId(null);
    }
  };

  const handleMarkPending = (resource: AdminResource) =>
    performUpdate(resource.id, { status: "pending", is_active: false, approved_at: null, approved_by: null }, "Resource marked as pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Resources</h1>
          <p className="text-sm text-muted-foreground">
            Curate catalog items, upload private files, and approve submissions from educators.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <Button onClick={openCreate}>New resource</Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingResource ? "Edit resource" : "Create a new resource"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resource-title">Title</Label>
                <Input id="resource-title" {...form.register("title", { required: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-description">Description</Label>
                <Textarea id="resource-description" rows={4} {...form.register("description")} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={value => {
                      form.setValue("type", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={value => {
                      form.setValue("status", value as ResourceStatus);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Moderation status" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="resource-subject">Subject</Label>
                  <Input id="resource-subject" {...form.register("subject")} placeholder="e.g. Math" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource-stage">Stage</Label>
                  <Input id="resource-stage" {...form.register("stage")} placeholder="e.g. Lower Secondary" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-tags">Tags</Label>
                <Input
                  id="resource-tags"
                  {...form.register("tags")}
                  placeholder="Comma separated e.g. ai, worksheet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-url">External URL</Label>
                <Input id="resource-url" type="url" {...form.register("url")}
                  placeholder="https://example.com/resource" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-file">Upload file</Label>
                <Input id="resource-file" type="file" onChange={handleFileChange} />
                {editingResource?.storage_path && !selectedFile && !clearStoredFile ? (
                  <div className="text-xs text-muted-foreground flex items-center justify-between gap-2">
                    <span>Stored file: {editingResource.storage_path}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveStoredFile}>
                      Remove
                    </Button>
                  </div>
                ) : null}
                {selectedFile ? (
                  <div className="text-xs text-muted-foreground">Selected file: {selectedFile.name}</div>
                ) : null}
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="resource-active" className="text-sm font-medium">
                    Visible in catalog
                  </Label>
                  <p className="text-xs text-muted-foreground">Inactive resources remain hidden from the public gallery.</p>
                </div>
                <Switch
                  id="resource-active"
                  checked={form.watch("is_active")}
                  onCheckedChange={checked => form.setValue("is_active", checked)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving…" : editingResource ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Resource library</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading resources…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Failed to load resources."}</p>
          ) : resources && resources.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map(resource => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="font-medium">{resource.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {resource.url ? "External" : resource.storage_path ? "Stored file" : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      {RESOURCE_TYPES.find(option => option.value === resource.type)?.label ?? resource.type}
                    </TableCell>
                    <TableCell>
                      <Badge variant={resource.status === "approved" ? "default" : resource.status === "rejected" ? "destructive" : "secondary"}>
                        {STATUS_LABELS[resource.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resource.updated_at ? format(new Date(resource.updated_at), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(resource)}>
                        Edit
                      </Button>
                      {resource.status === "approved" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionResourceId === resource.id}
                          onClick={() => handleMarkPending(resource)}
                        >
                          {actionResourceId === resource.id ? "…" : "Unapprove"}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionResourceId === resource.id}
                          onClick={() => handleApprove(resource)}
                        >
                          {actionResourceId === resource.id ? "…" : "Approve"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No resources available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminResourcesPage;
