import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  ResearchDataError,
  apply,
  getDocumentDownloadUrl,
  getSubmissionDownloadUrl,
  listMyApplications,
  listMyParticipations,
  listMySubmissions,
  listParticipantDocs,
  listProjects,
  uploadSubmission,
} from "@/lib/research";
import type {
  ResearchApplicationStatus,
  ResearchApplicationWithProject,
  ResearchDocument,
  ResearchDocumentStatus,
  ResearchParticipation,
  ResearchProject,
  ResearchSubmission,
  ResearchSubmissionStatus,
} from "@/types/platform";
import {
  Download,
  ExternalLink,
  FileText,
  UploadCloud,
} from "lucide-react";

const QUERY_KEYS = {
  applications: ["research", "applications"] as const,
  participations: ["research", "participations"] as const,
  openProjects: ["research", "projects", "open"] as const,
  participantDocs: (projectId: string) => ["research", "participant-docs", projectId] as const,
  submissions: (projectId: string) => ["research", "submissions", projectId] as const,
};

const APPLICATION_STATUS_VARIANTS: Record<
  ResearchApplicationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const SUBMISSION_STATUS_VARIANTS: Record<
  ResearchSubmissionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  submitted: "secondary",
  accepted: "default",
  needs_changes: "destructive",
};

const PARTICIPANT_DOC_STATUSES: Partial<Record<ResearchDocumentStatus, string>> = {
  participant: "participant",
  public: "public",
};

function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  try {
    return format(date, "PP");
  } catch {
    return value;
  }
}

function resolveProjectLink(project: ResearchProject | null): string | null {
  if (!project) {
    return null;
  }

  if (project.slug) {
    return `/research/${project.slug}`;
  }

  if (project.id) {
    return `/research/${project.id}`;
  }

  return null;
}

type ApplyFormState = {
  projectId: string;
  statement: string;
};

type UploadFormState = {
  title: string;
  description: string;
  file: File | null;
};

export const ResearchDashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyForm, setApplyForm] = useState<ApplyFormState>({ projectId: "", statement: "" });

  const applicationsQuery = useQuery({
    queryKey: QUERY_KEYS.applications,
    queryFn: () => listMyApplications(),
  });

  const participationsQuery = useQuery({
    queryKey: QUERY_KEYS.participations,
    queryFn: () => listMyParticipations(),
  });

  const openProjectsQuery = useQuery({
    queryKey: QUERY_KEYS.openProjects,
    queryFn: () => listProjects({ status: "open" }),
  });

  const applyMutation = useMutation({
    mutationFn: ({ projectId, statement }: ApplyFormState) => apply(projectId, statement),
    onSuccess: () => {
      toast({
        title: t.account.research.applications.toast.successTitle,
        description: t.account.research.applications.toast.successDescription,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participations });
      setApplyDialogOpen(false);
      setApplyForm({ projectId: "", statement: "" });
    },
    onError: (error: unknown) => {
      const description =
        error instanceof ResearchDataError
          ? error.message
          : t.account.research.applications.toast.errorDescription;
      toast({
        title: t.account.research.applications.toast.errorTitle,
        description,
        variant: "destructive",
      });
    },
  });

  const availableProjects = useMemo(() => {
    const openProjects = openProjectsQuery.data ?? [];
    if (!openProjects.length) {
      return [];
    }

    const activeApplicationIds = new Set(
      (applicationsQuery.data ?? [])
        .filter(application => application.status !== "rejected")
        .map(application => application.projectId),
    );

    const participatingProjectIds = new Set(
      (participationsQuery.data ?? []).map(participation => participation.projectId),
    );

    return openProjects.filter(project => {
      if (activeApplicationIds.has(project.id)) {
        return false;
      }

      if (participatingProjectIds.has(project.id)) {
        return false;
      }

      return true;
    });
  }, [applicationsQuery.data, openProjectsQuery.data, participationsQuery.data]);

  const handleApplySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!applyForm.projectId) {
      toast({
        title: t.account.research.applications.toast.errorTitle,
        description: t.account.research.applications.toast.selectProject,
        variant: "destructive",
      });
      return;
    }

    applyMutation.mutate({ projectId: applyForm.projectId, statement: applyForm.statement.trim() });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.account.research.applications.title}</CardTitle>
          <CardDescription>{t.account.research.applications.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applicationsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : applicationsQuery.isError ? (
            <p className="text-sm text-destructive">
              {applicationsQuery.error instanceof ResearchDataError
                ? applicationsQuery.error.message
                : t.account.research.genericError}
            </p>
          ) : (applicationsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.account.research.applications.empty}
            </p>
          ) : (
            <div className="space-y-4">
              {applicationsQuery.data?.map(application => (
                <ApplicationRow key={application.id} application={application} />
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t bg-muted/40 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {t.account.research.applications.footerNote}
          </div>
          <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={openProjectsQuery.isLoading || availableProjects.length === 0}>
                {openProjectsQuery.isLoading
                  ? t.common.loading
                  : t.account.research.applications.applyCta}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t.account.research.applications.dialog.title}</DialogTitle>
                <DialogDescription>
                  {t.account.research.applications.dialog.description}
                </DialogDescription>
              </DialogHeader>
              {availableProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.account.research.applications.dialog.empty}
                </p>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="research-project-select">
                      {t.account.research.applications.dialog.projectLabel}
                    </Label>
                    <Select
                      value={applyForm.projectId}
                      onValueChange={(value) => setApplyForm(prev => ({ ...prev, projectId: value }))}
                      disabled={applyMutation.isPending}
                    >
                      <SelectTrigger id="research-project-select">
                        <SelectValue placeholder={t.account.research.applications.dialog.projectPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="research-application-statement">
                      {t.account.research.applications.dialog.statementLabel}
                    </Label>
                    <Textarea
                      id="research-application-statement"
                      value={applyForm.statement}
                      onChange={(event) =>
                        setApplyForm(prev => ({ ...prev, statement: event.target.value }))
                      }
                      rows={5}
                      placeholder={t.account.research.applications.dialog.statementPlaceholder}
                      disabled={applyMutation.isPending}
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setApplyDialogOpen(false)}
                    >
                      {t.common.cancel}
                    </Button>
                    <Button type="submit" disabled={applyMutation.isPending || !applyForm.projectId}>
                      {applyMutation.isPending
                        ? t.common.loading
                        : t.account.research.applications.dialog.submit}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.account.research.participations.title}</CardTitle>
          <CardDescription>{t.account.research.participations.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {participationsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : participationsQuery.isError ? (
            <p className="text-sm text-destructive">
              {participationsQuery.error instanceof ResearchDataError
                ? participationsQuery.error.message
                : t.account.research.genericError}
            </p>
          ) : (participationsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.account.research.participations.empty}
            </p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {participationsQuery.data?.map(participation => (
                <AccordionItem key={participation.id} value={participation.id} className="rounded-lg border">
                  <AccordionTrigger className="px-4 py-3 text-left">
                    <div className="flex w-full flex-col gap-1 text-left">
                      <span className="font-medium">{participation.project.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.account.research.participations.joinedLabel}{" "}
                        {formatDate(participation.joinedAt) ?? t.account.research.notAvailable}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <ParticipationPanel participation={participation} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ApplicationRow = ({
  application,
}: {
  application: ResearchApplicationWithProject;
}) => {
  const { t } = useLanguage();
  const projectLink = resolveProjectLink(application.project);
  const submittedDate = formatDate(application.submittedAt);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background/60 p-4 transition-colors hover:bg-background sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <p className="font-medium">
            {application.project?.title ?? t.account.research.notAvailable}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {t.account.research.applications.submittedLabel}: {submittedDate ?? t.account.research.notAvailable}
          </span>
          {projectLink ? (
            <Link
              to={projectLink}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {t.account.research.applications.viewProject}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
      <Badge variant={APPLICATION_STATUS_VARIANTS[application.status]}>
        {t.account.research.statuses[application.status] ?? application.status}
      </Badge>
    </div>
  );
};

const ParticipationPanel = ({ participation }: { participation: ResearchParticipation }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadState, setUploadState] = useState<UploadFormState>({
    title: "",
    description: "",
    file: null,
  });
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [downloadingSubmissionId, setDownloadingSubmissionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const documentsQuery = useQuery({
    queryKey: QUERY_KEYS.participantDocs(participation.projectId),
    queryFn: () => listParticipantDocs(participation.projectId),
  });

  const submissionsQuery = useQuery({
    queryKey: QUERY_KEYS.submissions(participation.projectId),
    queryFn: () => listMySubmissions(participation.projectId),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, title, description }: UploadFormState) => {
      if (!file) {
        throw new ResearchDataError("A file is required");
      }

      return uploadSubmission(participation.projectId, file, {
        title: title.trim() ? title.trim() : undefined,
        description: description.trim() ? description.trim() : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: t.account.research.participations.toast.uploadSuccessTitle,
        description: t.account.research.participations.toast.uploadSuccessDescription,
      });
      setUploadState({ title: "", description: "", file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.submissions(participation.projectId) });
    },
    onError: (error: unknown) => {
      const description =
        error instanceof ResearchDataError
          ? error.message
          : t.account.research.participations.toast.uploadErrorDescription;
      toast({
        title: t.account.research.participations.toast.uploadErrorTitle,
        description,
        variant: "destructive",
      });
    },
  });

  const handleUploadSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadState.file) {
      toast({
        title: t.account.research.participations.toast.uploadErrorTitle,
        description: t.account.research.participations.toast.fileRequired,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(uploadState);
  };

  const handleDocumentDownload = async (document: ResearchDocument) => {
    if (!document.storagePath) {
      toast({
        title: t.account.research.participations.toast.downloadErrorTitle,
        description: t.account.research.participations.toast.downloadUnavailable,
        variant: "destructive",
      });
      return;
    }

    setDownloadingDocId(document.id);
    try {
      const signedUrl = await getDocumentDownloadUrl(document);
      if (typeof window !== "undefined") {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      const description =
        error instanceof ResearchDataError
          ? error.message
          : t.account.research.participations.toast.downloadErrorDescription;
      toast({
        title: t.account.research.participations.toast.downloadErrorTitle,
        description,
        variant: "destructive",
      });
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleSubmissionDownload = async (submission: ResearchSubmission) => {
    if (!submission.storagePath) {
      toast({
        title: t.account.research.participations.toast.downloadErrorTitle,
        description: t.account.research.participations.toast.downloadUnavailable,
        variant: "destructive",
      });
      return;
    }

    setDownloadingSubmissionId(submission.id);
    try {
      const signedUrl = await getSubmissionDownloadUrl(submission);
      if (typeof window !== "undefined") {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      const description =
        error instanceof ResearchDataError
          ? error.message
          : t.account.research.participations.toast.downloadErrorDescription;
      toast({
        title: t.account.research.participations.toast.downloadErrorTitle,
        description,
        variant: "destructive",
      });
    } finally {
      setDownloadingSubmissionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
        <header className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h4 className="font-medium">
              {t.account.research.participations.downloadsTitle}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t.account.research.participations.downloadsDescription}
            </p>
          </div>
        </header>
        {documentsQuery.isLoading ? (
          <Skeleton className="h-14 w-full" />
        ) : documentsQuery.isError ? (
          <p className="text-sm text-destructive">
            {documentsQuery.error instanceof ResearchDataError
              ? documentsQuery.error.message
              : t.account.research.genericError}
          </p>
        ) : (documentsQuery.data?.filter(document =>
            document.status && PARTICIPANT_DOC_STATUSES[document.status],
          ).length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.account.research.participations.docsEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {documentsQuery.data
              ?.filter(document => document.status && PARTICIPANT_DOC_STATUSES[document.status])
              .map(document => (
                <li
                  key={document.id}
                  className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{document.title ?? t.account.research.notAvailable}</p>
                    <p className="text-xs text-muted-foreground">
                      {document.docType ?? t.account.research.participations.unknownDocType}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => handleDocumentDownload(document)}
                    disabled={downloadingDocId === document.id}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {downloadingDocId === document.id
                      ? t.common.loading
                      : t.common.download}
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <header className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" />
          <div>
            <h4 className="font-medium">
              {t.account.research.participations.submissionsTitle}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t.account.research.participations.submissionsDescription}
            </p>
          </div>
        </header>

        <form onSubmit={handleUploadSubmit} className="space-y-3 rounded-md border bg-background p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`submission-title-${participation.id}`}>
                {t.account.research.participations.upload.titleLabel}
              </Label>
              <Input
                id={`submission-title-${participation.id}`}
                value={uploadState.title}
                onChange={(event) =>
                  setUploadState(prev => ({ ...prev, title: event.target.value }))
                }
                placeholder={t.account.research.participations.upload.titlePlaceholder}
                disabled={uploadMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`submission-file-${participation.id}`}>
                {t.account.research.participations.upload.fileLabel}
              </Label>
              <Input
                id={`submission-file-${participation.id}`}
                type="file"
                ref={fileInputRef}
                onChange={(event) =>
                  setUploadState(prev => ({
                    ...prev,
                    file: event.target.files?.[0] ?? null,
                  }))
                }
                disabled={uploadMutation.isPending}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`submission-description-${participation.id}`}>
              {t.account.research.participations.upload.descriptionLabel}
            </Label>
            <Textarea
              id={`submission-description-${participation.id}`}
              rows={4}
              value={uploadState.description}
              onChange={(event) =>
                setUploadState(prev => ({ ...prev, description: event.target.value }))
              }
              placeholder={t.account.research.participations.upload.descriptionPlaceholder}
              disabled={uploadMutation.isPending}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending
                ? t.common.loading
                : t.account.research.participations.upload.submit}
            </Button>
          </div>
        </form>

        {submissionsQuery.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : submissionsQuery.isError ? (
          <p className="text-sm text-destructive">
            {submissionsQuery.error instanceof ResearchDataError
              ? submissionsQuery.error.message
              : t.account.research.genericError}
          </p>
        ) : (submissionsQuery.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.account.research.participations.submissionsEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {submissionsQuery.data?.map(submission => {
              const submittedDate = formatDate(submission.submittedAt);
              return (
                <li
                  key={submission.id}
                  className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{submission.title ?? t.account.research.notAvailable}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {t.account.research.participations.submittedLabel}: {submittedDate ?? t.account.research.notAvailable}
                      </span>
                      <Badge variant={SUBMISSION_STATUS_VARIANTS[submission.status]}>
                        {t.account.research.statuses[submission.status] ?? submission.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => handleSubmissionDownload(submission)}
                    disabled={downloadingSubmissionId === submission.id}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {downloadingSubmissionId === submission.id
                      ? t.common.loading
                      : t.common.download}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ResearchDashboard;
