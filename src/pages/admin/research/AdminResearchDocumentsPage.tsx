import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  ResearchDocument,
  ResearchDocumentStatus,
  ResearchDocumentType,
  ResearchProject,
} from "@/types/platform";
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
import { useToast } from "@/components/ui/use-toast";
import { fetchResearchProjects, PROJECT_QUERY_KEY } from "./queries";

const DOCUMENTS_QUERY_KEY = ["admin", "research", "documents"] as const;

const DOC_TYPES: Array<{ value: ResearchDocumentType; label: string }> = [
  { value: "protocol", label: "Protocol" },
  { value: "consent", label: "Consent" },
  { value: "dataset", label: "Dataset" },
  { value: "report", label: "Report" },
  { value: "misc", label: "Other" },
];

const DOC_STATUSES: Array<{ value: ResearchDocumentStatus; label: string }> = [
  { value: "internal", label: "Internal" },
  { value: "participant", label: "Participant" },
  { value: "public", label: "Public" },
];

interface DocumentRecord {
  id?: string;
  project_id?: string;
  projectId?: string;
  title?: string | null;
  doc_type?: ResearchDocumentType | null;
  file_path?: string | null;
  storagePath?: string | null;
  status?: ResearchDocumentStatus | null;
  created_at?: string;
}

interface DocumentFormValues {
  projectId: string;
  title: string;
  docType: ResearchDocumentType | "";
  status: ResearchDocumentStatus;
}

interface FormDialogState {
  open: boolean;
  document: ResearchDocument | null;
}

interface DeleteDialogState {
  open: boolean;
  document: ResearchDocument | null;
}

function toDocument(record: DocumentRecord): ResearchDocument {
  return {
    id: String(record.id ?? ""),
    projectId: record.project_id ?? record.projectId ?? "",
    title: record.title ?? null,
    docType: (record.doc_type as ResearchDocumentType | undefined) ?? null,
    storagePath: record.file_path ?? record.storagePath ?? null,
    status: (record.status as ResearchDocumentStatus | undefined) ?? "participant",
    createdAt: record.created_at ?? new Date().toISOString(),
  } satisfies ResearchDocument;
}

async function fetchDocuments(): Promise<ResearchDocument[]> {
  const { data, error } = await supabase
    .from("research_documents")
    .select("id,project_id,title,doc_type,file_path,status,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load documents");
  }

  return (data ?? []).map((record: any) => toDocument(record));
}

async function uploadDocument(values: DocumentFormValues, file: File | null): Promise<ResearchDocument> {
  if (!file) {
    throw new Error("A file is required for upload");
  }

  const formData = new FormData();
  formData.append("projectId", values.projectId);
  formData.append("file", file);
  if (values.title.trim()) {
    formData.append("title", values.title.trim());
  }
  if (values.docType) {
    formData.append("docType", values.docType);
  }
  formData.append("status", values.status);

  const response = await fetch("/api/admin/research/documents/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload document");
  }

  const payload = (await response.json()) as { document?: DocumentRecord };
  if (!payload.document) {
    throw new Error("Upload response missing document data");
  }

  return toDocument(payload.document);
}

async function saveDocument(values: DocumentFormValues, existing: ResearchDocument | null): Promise<ResearchDocument> {
  if (!existing) {
    throw new Error("Document not found");
  }

  const { data, error } = await supabase
    .from("research_documents")
    .update({
      project_id: values.projectId,
      title: values.title.trim() || null,
      doc_type: values.docType || null,
      status: values.status,
    })
    .eq("id", existing.id)
    .select("id,project_id,title,doc_type,storage_path,status,created_at")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update document");
  }

  return toDocument(data);
}

async function deleteDocument(document: ResearchDocument): Promise<void> {
  const { error } = await supabase.from("research_documents").delete().eq("id", document.id);

  if (error) {
    throw new Error(error.message || "Failed to delete document");
  }
}

function defaultValues(projects: ResearchProject[], document: ResearchDocument | null): DocumentFormValues {
  const fallbackProjectId = projects[0]?.id ?? "";
  return {
    projectId: document?.projectId ?? fallbackProjectId,
    title: document?.title ?? "",
    docType: document?.docType ?? "",
    status: document?.status ?? "participant",
  } satisfies DocumentFormValues;
}

export default function AdminResearchDocumentsPage(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [formState, setFormState] = useState<FormDialogState>({ open: false, document: null });
  const [deleteState, setDeleteState] = useState<DeleteDialogState>({ open: false, document: null });

  const {
    data: projects = [],
    isLoading: loadingProjects,
  } = useQuery<ResearchProject[], Error>({
    queryKey: PROJECT_QUERY_KEY,
    queryFn: fetchResearchProjects,
  });

  const {
    data: documents = [],
    isLoading: loadingDocuments,
    error: documentsError,
  } = useQuery<ResearchDocument[], Error>({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: fetchDocuments,
  });

  const form = useForm<DocumentFormValues>({
    defaultValues: defaultValues(projects, null),
  });

  useEffect(() => {
    if (formState.open) {
      form.reset(defaultValues(projects, formState.document));
      setFile(null);
    }
  }, [formState, form, projects]);

  useEffect(() => {
    if (!formState.open) {
      setFile(null);
    }
  }, [formState.open]);

  const uploadMutation = useMutation({
    mutationFn: (values: DocumentFormValues) => uploadDocument(values, file),
    onSuccess: async document => {
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      setFormState({ open: false, document: null });
      toast({ title: "Document uploaded", description: document.title ?? "Document available to participants." });
    },
    onError: err => {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: DocumentFormValues) => saveDocument(values, formState.document),
    onSuccess: async document => {
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      setFormState({ open: false, document: null });
      toast({ title: "Document updated", description: document.title ?? "Document metadata saved." });
    },
    onError: err => {
      toast({
        title: "Unable to save document",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => (deleteState.document ? deleteDocument(deleteState.document) : Promise.resolve()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      setDeleteState({ open: false, document: null });
      toast({ title: "Document removed", description: "The document has been deleted." });
    },
    onError: err => {
      toast({
        title: "Unable to delete document",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const projectLookup = useMemo(() => {
    const map = new Map<string, ResearchProject>();
    for (const project of projects) {
      map.set(project.id, project);
    }
    return map;
  }, [projects]);

  const tableContent = useMemo(() => {
    if (loadingDocuments) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
            Loading documents…
          </TableCell>
        </TableRow>
      );
    }

    if (documentsError) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center text-sm text-destructive">
            Failed to load documents.
          </TableCell>
        </TableRow>
      );
    }

    if (documents.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </TableCell>
        </TableRow>
      );
    }

    return documents.map(document => {
      const project = projectLookup.get(document.projectId);
      return (
        <TableRow key={document.id}>
          <TableCell>
            <div className="font-medium">{document.title ?? "Untitled document"}</div>
            <div className="text-xs text-muted-foreground">{document.storagePath ?? "Untracked path"}</div>
          </TableCell>
          <TableCell>{project ? project.title : "Unknown project"}</TableCell>
          <TableCell className="capitalize">{document.docType ?? "–"}</TableCell>
          <TableCell>
            <Badge variant={document.status === "internal" ? "secondary" : document.status === "public" ? "default" : "outline"}>
              {document.status}
            </Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{new Date(document.createdAt).toLocaleString()}</TableCell>
          <TableCell className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setFormState({ open: true, document })}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteState({ open: true, document })}>
              Delete
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  }, [documents, documentsError, loadingDocuments, projectLookup]);

  const projectOptions = projects.map(project => (
    <SelectItem key={project.id} value={project.id}>
      {project.title}
    </SelectItem>
  ));

  const docTypeValue = form.watch("docType") ?? "";
  const statusValue = form.watch("status") ?? "participant";
  const projectValue = form.watch("projectId") ?? "";

  const submitting = formState.document ? updateMutation.isPending : uploadMutation.isPending;

  const dialogTitle = formState.document ? "Edit document" : "Upload document";
  const handleSubmit = (values: DocumentFormValues) => {
    if (formState.document) {
      updateMutation.mutate(values);
    } else {
      uploadMutation.mutate(values);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Research documents</CardTitle>
            <CardDescription>Store consent forms, protocols, and participant resources securely.</CardDescription>
          </div>
          <Dialog
            open={formState.open}
            onOpenChange={open => setFormState(current => ({ open, document: open ? current.document : null }))}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setFormState({ open: true, document: null })} disabled={loadingProjects || projects.length === 0}>
                Upload document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
              </DialogHeader>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Create a project before uploading documents so they can be organised correctly.
                </p>
              ) : (
                <form
                  onSubmit={event => {
                    event.preventDefault();
                    void form.handleSubmit(handleSubmit)(event);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={projectValue} onValueChange={value => form.setValue("projectId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>{projectOptions}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-title">Title</Label>
                    <Input id="document-title" placeholder="Document title" {...form.register("title")} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Document type</Label>
                      <Select value={docTypeValue} onValueChange={value => form.setValue("docType", value as ResearchDocumentType | "")}> 
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unspecified</SelectItem>
                          {DOC_TYPES.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={statusValue} onValueChange={value => form.setValue("status", value as ResearchDocumentStatus)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOC_STATUSES.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {!formState.document && (
                    <div className="space-y-2">
                      <Label htmlFor="document-file">File</Label>
                      <Input
                        id="document-file"
                        type="file"
                        onChange={event => setFile(event.target.files?.[0] ?? null)}
                        required={!formState.document}
                      />
                      <p className="text-xs text-muted-foreground">Files are stored privately in the research bucket.</p>
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={submitting || (!formState.document && !file)}>
                      {submitting ? "Saving…" : formState.document ? "Save changes" : "Upload"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
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
        onOpenChange={open => setDeleteState(current => ({ open, document: open ? current.document : null }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the document record from the project. Storage files must be deleted manually if no longer required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!deleteState.document) return;
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
