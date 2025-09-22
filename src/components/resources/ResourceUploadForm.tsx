import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface PendingResource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  storage_path: string | null;
  type: string;
  subject: string | null;
  stage: string | null;
  tags: string[];
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  status: string;
  is_active: boolean;
}

const RESOURCE_TYPE_OPTIONS = [
  { label: "Worksheet", value: "worksheet" },
  { label: "Video", value: "video" },
  { label: "Picture", value: "picture" },
  { label: "Presentation", value: "ppt" },
  { label: "Online activity", value: "online" },
  { label: "Offline activity", value: "offline" },
] as const;

const STAGE_SUGGESTIONS = [
  "Early Childhood",
  "Primary",
  "Lower Secondary",
  "Upper Secondary",
  "Higher Education",
];

const SUBJECT_SUGGESTIONS = [
  "Math",
  "Science",
  "English",
  "Social Studies",
  "STEM",
  "ICT",
  "Arts",
  "Languages",
];

export function ResourceUploadForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [stage, setStage] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingResource, setPendingResource] = useState<PendingResource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setTags(previous => {
      if (previous.some(tag => tag.toLowerCase() === trimmed.toLowerCase())) {
        return previous;
      }
      return [...previous, trimmed];
    });
  };

  const commitTagInput = () => {
    addTag(tagInput);
    setTagInput("");
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitTagInput();
    }
  };

  const handleRemoveTag = (value: string) => {
    setTags(previous => previous.filter(tag => tag.toLowerCase() !== value.toLowerCase()));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setResourceType("");
    setSubject("");
    setStage("");
    setUrl("");
    setThumbnail("");
    setTags([]);
    setTagInput("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error("Unable to verify authentication");
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("You must be signed in to upload a resource.");
      }

      if (!resourceType) {
        throw new Error("Please choose a resource type.");
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("type", resourceType);

      if (description.trim()) formData.append("description", description.trim());
      if (subject.trim()) formData.append("subject", subject.trim());
      if (stage.trim()) formData.append("stage", stage.trim());
      if (url.trim()) formData.append("url", url.trim());
      if (thumbnail.trim()) formData.append("thumbnail", thumbnail.trim());

      tags.forEach(tag => {
        formData.append("tags[]", tag);
      });

      if (file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/resources/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = (payload && typeof payload.error === "string" && payload.error) || "Failed to upload resource.";
        throw new Error(message);
      }

      if (payload?.resource) {
        setPendingResource(payload.resource as PendingResource);
      } else {
        setPendingResource(null);
      }

      resetForm();
    } catch (submitError) {
      setPendingResource(null);
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("Something went wrong while submitting your resource.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(title.trim() && resourceType && (file || url.trim()));

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Share a classroom resource</CardTitle>
            <CardDescription>
              Upload lesson materials or link to helpful content. Submissions remain hidden until an administrator approves them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Upload failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-title">Title</Label>
                <Input
                  id="resource-title"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="e.g. Fractions practice worksheet"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-type">Resource type</Label>
                <Select value={resourceType || undefined} onValueChange={setResourceType}>
                  <SelectTrigger id="resource-type">
                    <SelectValue placeholder="Choose a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-description">Description</Label>
              <Textarea
                id="resource-description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                rows={4}
                placeholder="Provide context for how educators can use this resource."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-subject">Subject</Label>
                <Input
                  id="resource-subject"
                  list="resource-subject-suggestions"
                  value={subject}
                  onChange={event => setSubject(event.target.value)}
                  placeholder="e.g. Math"
                />
                <datalist id="resource-subject-suggestions">
                  {SUBJECT_SUGGESTIONS.map(option => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-stage">Stage / grade</Label>
                <Input
                  id="resource-stage"
                  list="resource-stage-suggestions"
                  value={stage}
                  onChange={event => setStage(event.target.value)}
                  placeholder="e.g. Lower Secondary"
                />
                <datalist id="resource-stage-suggestions">
                  {STAGE_SUGGESTIONS.map(option => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-tags">Tags</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="resource-tags"
                  value={tagInput}
                  onChange={event => setTagInput(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Press enter to add each tag"
                  className="max-w-xs"
                />
                <Button type="button" variant="secondary" size="sm" onClick={commitTagInput} disabled={!tagInput.trim()}>
                  Add tag
                </Button>
              </div>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full p-0.5 text-muted-foreground hover:bg-background/60"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-url">Resource URL</Label>
                <Input
                  id="resource-url"
                  value={url}
                  onChange={event => setUrl(event.target.value)}
                  placeholder="https://"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-thumbnail">Thumbnail URL</Label>
                <Input
                  id="resource-thumbnail"
                  value={thumbnail}
                  onChange={event => setThumbnail(event.target.value)}
                  placeholder="Optional preview image"
                  type="url"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-file">Upload file</Label>
              <Input id="resource-file" ref={fileInputRef} type="file" onChange={handleFileChange} />
              <p className="text-sm text-muted-foreground">
                Provide either a file upload or an external link. Files are stored securely until approved.
              </p>
              {file ? <p className="text-sm text-muted-foreground">Selected file: {file.name}</p> : null}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Your submission will appear in your account as <span className="font-medium">pending</span> until an administrator reviews it.
            </p>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Uploading...
                </>
              ) : (
                "Submit for review"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {pendingResource ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>{pendingResource.title}</span>
              <Badge variant="outline" className="uppercase tracking-wide">
                {pendingResource.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              This resource has been queued for review. Once approved it will appear publicly in the library.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Submitted:</span>{" "}
              {new Date(pendingResource.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-foreground">Type:</span>{" "}
              <span className="capitalize">{pendingResource.type}</span>
            </div>
            {pendingResource.subject ? (
              <div>
                <span className="font-medium text-foreground">Subject:</span> {pendingResource.subject}
              </div>
            ) : null}
            {pendingResource.stage ? (
              <div>
                <span className="font-medium text-foreground">Stage:</span> {pendingResource.stage}
              </div>
            ) : null}
            {pendingResource.url ? (
              <div>
                <span className="font-medium text-foreground">External link:</span>{" "}
                <a href={pendingResource.url} className="text-primary underline" target="_blank" rel="noreferrer">
                  {pendingResource.url}
                </a>
              </div>
            ) : null}
            {pendingResource.storage_path ? (
              <div>
                <span className="font-medium text-foreground">Stored file:</span> {pendingResource.storage_path}
              </div>
            ) : null}
            {pendingResource.tags.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">Tags:</span>
                {pendingResource.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default ResourceUploadForm;
