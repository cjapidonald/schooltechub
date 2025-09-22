import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createUpload, ResourceDataError } from "@/lib/resources";

const RESOURCE_TYPE_OPTIONS = [
  { label: "Worksheet", value: "worksheet" },
  { label: "Video", value: "video" },
  { label: "Picture", value: "picture" },
  { label: "Presentation", value: "ppt" },
  { label: "Online activity", value: "online" },
  { label: "Offline activity", value: "offline" },
] as const;

const SUBJECT_OPTIONS = [
  "Math",
  "Science",
  "English",
  "Social Studies",
  "STEM",
  "ICT",
  "Arts",
  "Languages",
];

const STAGE_OPTIONS = [
  "Early Childhood",
  "Primary",
  "Lower Secondary",
  "Upper Secondary",
  "Higher Education",
];

type UploadResourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function UploadResourceDialog({ open, onOpenChange, onSuccess }: UploadResourceDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [stage, setStage] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("");
    setSubject("");
    setStage("");
    setUrl("");
    setThumbnail("");
    setTags([]);
    setTagInput("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeDialog = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setTags(previous => {
      const lower = trimmed.toLowerCase();
      if (previous.some(tag => tag.toLowerCase() === lower)) {
        return previous;
      }
      return [...previous, trimmed];
    });
  };

  const handleCommitTag = () => {
    addTag(tagInput);
    setTagInput("");
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleCommitTag();
      return;
    }

    if (event.key === "Backspace" && tagInput.length === 0 && tags.length > 0) {
      event.preventDefault();
      setTags(previous => previous.slice(0, -1));
    }
  };

  const handleRemoveTag = (value: string) => {
    setTags(previous => previous.filter(tag => tag.toLowerCase() !== value.toLowerCase()));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (!title.trim()) {
        throw new Error("Please provide a title for this resource.");
      }

      if (!type) {
        throw new Error("Choose a resource type.");
      }

      const trimmedUrl = url.trim();
      if (!file && !trimmedUrl) {
        throw new Error("Upload a file or add an external URL.");
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("type", type);

      if (description.trim()) {
        formData.append("description", description.trim());
      }
      if (subject.trim()) {
        formData.append("subject", subject.trim());
      }
      if (stage.trim()) {
        formData.append("stage", stage.trim());
      }
      if (trimmedUrl) {
        formData.append("url", trimmedUrl);
      }
      if (thumbnail.trim()) {
        formData.append("thumbnail", thumbnail.trim());
      }

      tags.forEach(tag => {
        formData.append("tags[]", tag);
      });

      if (file) {
        formData.append("file", file);
      }

      await createUpload(formData);

      resetForm();
      onSuccess();
    } catch (submitError) {
      if (submitError instanceof ResourceDataError) {
        setError(submitError.message);
      } else if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("Something went wrong while submitting your resource.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && Boolean(type) && (Boolean(file) || url.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload a resource</DialogTitle>
          <DialogDescription>
            Share worksheets, videos, and other classroom materials with the SchoolTechHub community. Submissions stay hidden
            until approved by our team.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Upload failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="upload-resource-title">Title *</Label>
              <Input
                id="upload-resource-title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="e.g. Fractions practice worksheet"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-resource-type">Type *</Label>
              <Select value={type || undefined} onValueChange={setType}>
                <SelectTrigger id="upload-resource-type">
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
            <Label htmlFor="upload-resource-description">Description</Label>
            <Textarea
              id="upload-resource-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              rows={3}
              placeholder="Provide context for how educators can use this resource."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="upload-resource-subject">Subject</Label>
              <Input
                id="upload-resource-subject"
                list="upload-resource-subject-options"
                value={subject}
                onChange={event => setSubject(event.target.value)}
                placeholder="e.g. Math"
              />
              <datalist id="upload-resource-subject-options">
                {SUBJECT_OPTIONS.map(option => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-resource-stage">Stage</Label>
              <Input
                id="upload-resource-stage"
                list="upload-resource-stage-options"
                value={stage}
                onChange={event => setStage(event.target.value)}
                placeholder="e.g. Lower Secondary"
              />
              <datalist id="upload-resource-stage-options">
                {STAGE_OPTIONS.map(option => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-resource-tags">Tags</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="upload-resource-tags"
                value={tagInput}
                onChange={event => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Press enter to add"
                className="max-w-xs"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleCommitTag} disabled={!tagInput.trim()}>
                Add tag
              </Button>
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="rounded-full p-0.5 text-muted-foreground transition hover:bg-background/60"
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
              <Label htmlFor="upload-resource-url">External URL</Label>
              <Input
                id="upload-resource-url"
                value={url}
                onChange={event => setUrl(event.target.value)}
                placeholder="https://"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-resource-thumbnail">Thumbnail URL</Label>
              <Input
                id="upload-resource-thumbnail"
                value={thumbnail}
                onChange={event => setThumbnail(event.target.value)}
                placeholder="Optional preview image"
                type="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-resource-file">Upload file</Label>
            <Input id="upload-resource-file" ref={fileInputRef} type="file" onChange={handleFileChange} />
            <p className="text-sm text-muted-foreground">
              Provide either a file upload or an external link. Files remain private until approved.
            </p>
            {file ? <p className="text-sm text-muted-foreground">Selected file: {file.name}</p> : null}
          </div>

          <DialogFooter className="sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Your submission will appear as <span className="font-medium">pending</span> while awaiting approval.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => closeDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Submitting
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default UploadResourceDialog;
