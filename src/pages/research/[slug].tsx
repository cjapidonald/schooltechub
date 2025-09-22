import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, FileText, Loader2, Lock, Upload } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter as DialogFooterUI, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { supabase } from "@/integrations/supabase/client";
import {
  apply,
  getDocumentDownloadUrl,
  getMyApplicationForProject,
  getProject,
  isProjectParticipant,
  listMySubmissions,
  listParticipantDocs,
  uploadSubmission,
} from "@/lib/research";
import type {
  ResearchApplication,
  ResearchDocument,
  ResearchProject,
  ResearchSubmission,
} from "@/types/platform";

interface UploadFormState {
  file: File | null;
  title: string;
  description: string;
}

export default function ResearchProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<ResearchProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [isParticipant, setIsParticipant] = useState(false);
  const [application, setApplication] = useState<ResearchApplication | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [documents, setDocuments] = useState<ResearchDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const [statement, setStatement] = useState("");
  const [submittingApplication, setSubmittingApplication] = useState(false);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadFormState>({ file: null, title: "", description: "" });

  useEffect(() => {
    let active = true;

    async function fetchProject() {
      if (!slug) {
        setProjectError("This research project could not be found.");
        setProjectLoading(false);
        return;
      }

      setProjectLoading(true);
      setProjectError(null);

      try {
        const result = await getProject(slug);
        if (!active) {
          return;
        }
        if (!result) {
          setProjectError("This research project could not be found.");
        }
        setProject(result);
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unable to load the project.";
        setProjectError(message);
      } finally {
        if (active) {
          setProjectLoading(false);
        }
      }
    }

    fetchProject();

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error) {
          setUser(null);
        } else {
          setUser(data.session?.user ?? null);
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setUser(null);
        setCheckingAuth(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function resolveStatus(projectId: string) {
      if (!user) {
        setIsParticipant(false);
        setApplication(null);
        return;
      }

      setStatusLoading(true);
      setDocumentError(null);

      try {
        const participant = await isProjectParticipant(projectId);
        if (!active) {
          return;
        }
        setIsParticipant(participant);

        if (participant) {
          setApplication(null);
          setDocumentsLoading(true);
          setSubmissionsLoading(true);

          try {
            const [docs, mySubmissions] = await Promise.all([
              listParticipantDocs(projectId),
              listMySubmissions(projectId),
            ]);
            if (!active) {
              return;
            }
            setDocuments(docs);
            setSubmissions(mySubmissions);
          } catch (error) {
            if (!active) {
              return;
            }
            const message = error instanceof Error ? error.message : "Failed to load project files.";
            setDocumentError(message);
          } finally {
            if (active) {
              setDocumentsLoading(false);
              setSubmissionsLoading(false);
            }
          }
        } else {
          try {
            const existing = await getMyApplicationForProject(projectId);
            if (!active) {
              return;
            }
            setApplication(existing);
            setDocuments([]);
            setSubmissions([]);
          } catch (error) {
            if (!active) {
              return;
            }
            const message = error instanceof Error ? error.message : "Unable to check your application status.";
            setApplication({
              id: "", // placeholder to display error state
              projectId,
              applicantId: user.id,
              status: "rejected",
              statement: message,
              submittedAt: new Date().toISOString(),
              approvedAt: null,
              approvedBy: null,
            });
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unable to verify your access.";
        setApplication({
          id: "", // placeholder to display error
          projectId,
          applicantId: user.id,
          status: "rejected",
          statement: message,
          submittedAt: new Date().toISOString(),
          approvedAt: null,
          approvedBy: null,
        });
        setDocuments([]);
        setSubmissions([]);
      } finally {
        if (active) {
          setStatusLoading(false);
        }
      }
    }

    if (project?.id && user) {
      void resolveStatus(project.id);
    } else if (project?.id && !user) {
      setIsParticipant(false);
      setApplication(null);
      setDocuments([]);
      setSubmissions([]);
      setDocumentError(null);
      setStatusLoading(false);
    }

    return () => {
      active = false;
    };
  }, [project?.id, user]);

  const canonical = useMemo(() => {
    const slugPart = slug ? `/${slug}` : "";
    return `https://schooltechhub.com${getLocalizedPath(`/research${slugPart}`, language)}`;
  }, [language, slug]);

  const applicationPending = application?.status === "pending";

  async function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) {
      return;
    }

    setSubmittingApplication(true);
    try {
      const submitted = await apply(project.id, statement.trim());
      setApplication(submitted);
      setStatement("");
      toast({ title: "Application submitted", description: "We'll email you once a coordinator reviews it." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit your application.";
      toast({ title: "Application failed", description: message, variant: "destructive" });
    } finally {
      setSubmittingApplication(false);
    }
  }

  async function handleDownload(documentId: string) {
    try {
      const url = await getDocumentDownloadUrl(documentId);
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to download this document.";
      toast({ title: "Download failed", description: message, variant: "destructive" });
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !uploadState.file) {
      toast({
        title: "Select a file",
        description: "Choose a file to upload before submitting your work.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const submission = await uploadSubmission(project.id, uploadState.file, {
        title: uploadState.title.trim() || uploadState.file.name,
        description: uploadState.description.trim() || null,
      });
      setSubmissions(current => [submission, ...current]);
      setUploadDialogOpen(false);
      setUploadState({ file: null, title: "", description: "" });
      toast({ title: "Submission uploaded", description: "Your work has been submitted for review." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload your submission.";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  const shouldShowLoginGate = !checkingAuth && !user;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={project?.title ? `${project.title} – Research Project` : "Research Project"}
        description={project?.summary ?? "Access project details, documentation, and submit your research deliverables."}
        canonicalUrl={canonical}
      />
      <section className="relative py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.12),_transparent_55%)]" aria-hidden="true" />
        <div className="container relative z-10 space-y-8">
          {projectLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading project" />
            </div>
          ) : projectError ? (
            <Card className="mx-auto max-w-2xl border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">{project?.title ?? "Research project"}</CardTitle>
                <CardDescription>{projectError}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" onClick={() => navigate(getLocalizedPath("/research", language))}>
                  Back to research overview
                </Button>
              </CardFooter>
            </Card>
          ) : project ? (
            <div className="mx-auto flex max-w-3xl flex-col gap-8">
              <Card className="border-border/60 bg-card/70">
                <CardHeader>
                  <CardTitle className="text-3xl font-semibold text-foreground">{project.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {project.summary ?? "Project summary coming soon."}
                  </CardDescription>
                </CardHeader>
              </Card>

              {shouldShowLoginGate ? (
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Lock className="h-5 w-5" />
                      Sign in to access project materials
                    </CardTitle>
                    <CardDescription>
                      This project summary is public. Sign in to view participant documents, apply to join, and submit your work.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button onClick={() => navigate(getLocalizedPath("/auth", language))}>Sign in or create an account</Button>
                  </CardFooter>
                </Card>
              ) : isParticipant ? (
                <div className="space-y-8">
                  <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5" />
                        Project documents
                      </CardTitle>
                      <CardDescription>
                        Access protocols, consent materials, and shared datasets prepared for project participants.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {documentsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading documents
                        </div>
                      ) : documentError ? (
                        <p className="text-sm text-destructive">{documentError}</p>
                      ) : documents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Project coordinators have not shared participant documents yet. We'll notify you once resources are uploaded.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {documents.map(document => (
                            <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/50 bg-background/60 p-4">
                              <div>
                                <p className="font-medium text-foreground">{document.title ?? "Project document"}</p>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  {document.docType ?? "document"}
                                </p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => void handleDownload(document.id)}>
                                <Download className="mr-2 h-4 w-4" /> Download
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 bg-card/70">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-xl">Submit your work</CardTitle>
                        <CardDescription>
                          Upload lesson artefacts, reflections, or results from your participation in this study.
                        </CardDescription>
                      </div>
                      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Upload className="mr-2 h-4 w-4" /> Submit work
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload your submission</DialogTitle>
                            <DialogDescription>
                              Files are shared securely with the research coordination team for review.
                            </DialogDescription>
                          </DialogHeader>
                          <form className="space-y-4" onSubmit={handleUpload}>
                            <div className="space-y-2">
                              <Label htmlFor="submission-file">File</Label>
                              <Input
                                id="submission-file"
                                type="file"
                                required
                                onChange={event => {
                                  const file = event.currentTarget.files?.[0] ?? null;
                                  setUploadState(state => ({ ...state, file }));
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="submission-title">Title</Label>
                              <Input
                                id="submission-title"
                                placeholder="Optional title for this submission"
                                value={uploadState.title}
                                onChange={event => setUploadState(state => ({ ...state, title: event.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="submission-description">Description</Label>
                              <Textarea
                                id="submission-description"
                                placeholder="Add context about your submission (optional)"
                                rows={4}
                                value={uploadState.description}
                                onChange={event => setUploadState(state => ({ ...state, description: event.target.value }))}
                              />
                            </div>
                            <DialogFooterUI>
                              <Button type="button" variant="ghost" onClick={() => setUploadDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={uploading}>
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {uploading ? "Uploading" : "Submit"}
                              </Button>
                            </DialogFooterUI>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {submissionsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading your submissions
                        </div>
                      ) : submissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          You haven't submitted any work yet. Use the "Submit work" button to share your first update.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {submissions.map(submission => (
                            <li key={submission.id} className="rounded-md border border-border/50 bg-background/60 p-4">
                              <p className="font-medium text-foreground">{submission.title ?? "Research submission"}</p>
                              {submission.description ? (
                                <p className="mt-1 text-sm text-muted-foreground">{submission.description}</p>
                              ) : null}
                              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                                Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "recently"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="border-border/60 bg-card/70">
                  <CardHeader>
                    <CardTitle className="text-xl">Request to participate</CardTitle>
                    <CardDescription>
                      Share your interest in joining this study. Approved participants receive access to all documentation and submission tools.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statusLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking your application status
                      </div>
                    ) : applicationPending ? (
                      <div className="rounded-md border border-border/60 bg-secondary/20 p-4 text-sm text-secondary-foreground">
                        Your application is under review. We'll notify you via email as soon as it's approved.
                      </div>
                    ) : application && application.status === "rejected" && application.statement && application.id === "" ? (
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                        {application.statement}
                      </div>
                    ) : application && application.status === "rejected" ? (
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                        Your previous application was not approved. You can update your interest and reapply below.
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter>
                    <form className="w-full space-y-4" onSubmit={handleApply}>
                      <div className="space-y-2">
                        <Label htmlFor="research-application-statement">Why I want to join</Label>
                        <Textarea
                          id="research-application-statement"
                          required
                          minLength={20}
                          rows={5}
                          placeholder="Share how this research aligns with your classroom goals."
                          value={statement}
                          onChange={event => setStatement(event.target.value)}
                        />
                      </div>
                      <Button className="w-full" type="submit" disabled={submittingApplication || applicationPending}>
                        {submittingApplication ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {applicationPending ? "Application pending" : "Apply to participate"}
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              )}

              <div className="flex justify-center">
                <Button variant="ghost" asChild>
                  <Link to={getLocalizedPath("/research", language)}>Back to research overview</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
