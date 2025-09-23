import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  ResearchProject,
  ResearchSubmission,
  ResearchSubmissionStatus,
} from "@/types/platform";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchResearchProjects, PROJECT_QUERY_KEY } from "./queries";
import { fetchProfilesByIds } from "./profileHelpers";

const SUBMISSIONS_QUERY_KEY = ["admin", "research", "submissions"] as const;

type StatusFilterOption = "all" | ResearchSubmissionStatus;

interface ReviewFormValues {
  status: Exclude<ResearchSubmissionStatus, "submitted">;
  note: string;
}

interface SubmissionFilters {
  projectId?: string;
  status?: ResearchSubmissionStatus;
}

interface SubmissionRecord {
  id?: string;
  project_id?: string;
  projectId?: string;
  participant_id?: string;
  participantId?: string;
  title?: string | null;
  description?: string | null;
  storage_path?: string | null;
  storagePath?: string | null;
  status?: ResearchSubmissionStatus | null;
  review_note?: string | null;
  reviewNote?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
}

function toSubmission(record: SubmissionRecord): ResearchSubmission {
  return {
    id: String(record.id ?? ""),
    projectId: record.project_id ?? record.projectId ?? "",
    participantId: record.participant_id ?? record.participantId ?? "",
    title: record.title ?? null,
    description: record.description ?? null,
    storagePath: record.storage_path ?? record.storagePath ?? null,
    status: (record.status as ResearchSubmissionStatus | undefined) ?? "submitted",
    reviewedBy: record.reviewed_by ?? null,
    reviewedAt: record.reviewed_at ?? null,
    reviewNote: record.review_note ?? record.reviewNote ?? null,
    submittedAt: record.submitted_at ?? record.created_at ?? null,
  } satisfies ResearchSubmission;
}

async function fetchSubmissions(filters: SubmissionFilters): Promise<ResearchSubmission[]> {
  let query = supabase
    .from("research_submissions")
    .select("id,project_id,participant_id,title,description,storage_path,status,review_note,reviewed_by,reviewed_at,submitted_at,created_at")
    .order("submitted_at", { ascending: false, nullsLast: true });

  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to load submissions");
  }

  return (data ?? []).map(toSubmission);
}

async function reviewSubmission(
  submissionId: string,
  values: ReviewFormValues,
): Promise<ResearchSubmission> {
  const response = await fetch("/api/admin/research/submissions/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: submissionId,
      status: values.status,
      note: values.note.trim() || null,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update submission");
  }

  const payload = (await response.json()) as { submission?: SubmissionRecord };
  if (!payload.submission) {
    throw new Error("Response missing submission data");
  }

  return toSubmission(payload.submission);
}

function statusVariant(status: ResearchSubmissionStatus): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "accepted":
      return "default";
    case "needs_changes":
      return "destructive";
    case "submitted":
    default:
      return "secondary";
  }
}

export default function AdminResearchSubmissionsPage(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("submitted");
  const [activeSubmission, setActiveSubmission] = useState<ResearchSubmission | null>(null);

  const {
    data: projects = [],
  } = useQuery<ResearchProject[], Error>({
    queryKey: PROJECT_QUERY_KEY,
    queryFn: fetchResearchProjects,
  });

  const filters: SubmissionFilters = useMemo(() => {
    const payload: SubmissionFilters = {};
    if (projectFilter !== "all") {
      payload.projectId = projectFilter;
    }
    if (statusFilter !== "all") {
      payload.status = statusFilter;
    }
    return payload;
  }, [projectFilter, statusFilter]);

  const {
    data: submissions = [],
    isLoading: loadingSubmissions,
    error: submissionsError,
  } = useQuery<ResearchSubmission[], Error>({
    queryKey: [...SUBMISSIONS_QUERY_KEY, filters.projectId ?? "all", filters.status ?? "all"],
    queryFn: () => fetchSubmissions(filters),
  });

  const profileQuery = useQuery({
    queryKey: [...SUBMISSIONS_QUERY_KEY, "profiles", submissions.map(item => item.participantId).join("-")],
    queryFn: () => fetchProfilesByIds(submissions.map(item => item.participantId)),
    enabled: submissions.length > 0,
  });

  const form = useForm<ReviewFormValues>({
    defaultValues: {
      status: "accepted",
      note: "",
    },
  });

  useEffect(() => {
    if (activeSubmission) {
      form.reset({
        status: activeSubmission.status === "submitted" ? "accepted" : activeSubmission.status,
        note: activeSubmission.reviewNote ?? "",
      });
    }
  }, [activeSubmission, form]);

  const reviewStatus = form.watch("status");

  const reviewMutation = useMutation({
    mutationFn: (values: ReviewFormValues) => {
      if (!activeSubmission) {
        return Promise.reject(new Error("No submission selected"));
      }
      return reviewSubmission(activeSubmission.id, values);
    },
    onSuccess: async submission => {
      await queryClient.invalidateQueries({ queryKey: [...SUBMISSIONS_QUERY_KEY, filters.projectId ?? "all", filters.status ?? "all"] });
      setActiveSubmission(null);
      toast({
        title: "Submission updated",
        description: submission.status === "accepted" ? "Marked as accepted." : "Requested changes from participant.",
      });
    },
    onError: err => {
      toast({
        title: "Unable to review submission",
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

  const rows = useMemo(() => {
    if (loadingSubmissions) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
            Loading submissions…
          </TableCell>
        </TableRow>
      );
    }

    if (submissionsError) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center text-sm text-destructive">
            Failed to load submissions.
          </TableCell>
        </TableRow>
      );
    }

    if (submissions.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
            No submissions match the selected filters.
          </TableCell>
        </TableRow>
      );
    }

    const profiles = profileQuery.data ?? new Map();

    return submissions.map(submission => {
      const participantProfile = profiles.get(submission.participantId);
      const project = projectLookup.get(submission.projectId);
      return (
        <TableRow key={submission.id}>
          <TableCell>
            <div className="font-medium">{submission.title ?? "Untitled submission"}</div>
            <div className="text-xs text-muted-foreground">{project?.title ?? submission.projectId}</div>
          </TableCell>
          <TableCell>
            <div className="font-medium">{participantProfile?.fullName ?? submission.participantId}</div>
            <div className="text-xs text-muted-foreground">{participantProfile?.email ?? "No email"}</div>
          </TableCell>
          <TableCell>
            <Badge variant={statusVariant(submission.status)} className="uppercase">
              {submission.status.replace("_", " ")}
            </Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString() : "Awaiting review"}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "Unknown"}
          </TableCell>
          <TableCell className="flex flex-col items-end gap-2">
            {submission.reviewNote && (
              <p className="max-w-xs text-right text-xs text-muted-foreground">Note: {submission.reviewNote}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSubmission(submission)}
              >
                Review
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  }, [loadingSubmissions, submissionsError, submissions, profileQuery.data, projectLookup]);

  const projectFilterOptions = [
    <SelectItem key="all" value="all">
      All projects
    </SelectItem>,
    ...projects.map(project => (
      <SelectItem key={project.id} value={project.id}>
        {project.title}
      </SelectItem>
    )),
  ];

  const statusFilterOptions = [
    <SelectItem key="all" value="all">
      All statuses
    </SelectItem>,
    <SelectItem key="submitted" value="submitted">
      Submitted
    </SelectItem>,
    <SelectItem key="accepted" value="accepted">
      Accepted
    </SelectItem>,
    <SelectItem key="needs_changes" value="needs_changes">
      Needs changes
    </SelectItem>,
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Research submissions</CardTitle>
            <CardDescription>Review participant uploads, approve results, or request follow-up.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
            <div className="sm:w-44">
              <Select value={projectFilter} onValueChange={value => setProjectFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>{projectFilterOptions}</SelectContent>
              </Select>
            </div>
            <div className="sm:w-44">
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as StatusFilterOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>{statusFilterOptions}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submission</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{rows}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeSubmission)} onOpenChange={open => !open && setActiveSubmission(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review submission</DialogTitle>
          </DialogHeader>
          {activeSubmission ? (
            <form
              onSubmit={event => {
                event.preventDefault();
                void form.handleSubmit(values => reviewMutation.mutate(values))(event);
              }}
              className="space-y-4"
            >
              <div>
                <p className="text-sm font-medium">{activeSubmission.title ?? "Untitled submission"}</p>
                {activeSubmission.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{activeSubmission.description}</p>
                )}
                {activeSubmission.storagePath && (
                  <p className="mt-2 text-xs text-muted-foreground">Storage path: {activeSubmission.storagePath}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={reviewStatus} onValueChange={value => form.setValue("status", value as ReviewFormValues["status"])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="needs_changes">Needs changes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="submission-note">
                  Note to participant (optional)
                </label>
                <Textarea
                  id="submission-note"
                  rows={4}
                  placeholder="Share feedback or next steps"
                  {...form.register("note")}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={reviewMutation.isPending}>
                  {reviewMutation.isPending ? "Saving…" : "Save review"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
