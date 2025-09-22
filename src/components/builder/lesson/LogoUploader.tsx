import { useRef, useState, type ChangeEvent } from "react";
import { Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LogoUploaderProps {
  value: string | null;
  profileId: string | null;
  onChange: (url: string | null) => void;
  label: string;
  changeLabel: string;
  uploadingLabel: string;
  disabled?: boolean;
  className?: string;
  alt?: string;
  inputTestId?: string;
}

interface UploadResponse {
  url: string | null;
  path: string;
}

export const LogoUploader = ({
  value,
  profileId,
  onChange,
  label,
  changeLabel,
  uploadingLabel,
  disabled = false,
  className,
  alt = "School logo",
  inputTestId,
}: LogoUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectClick = () => {
    if (disabled || isUploading) {
      return;
    }
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!profileId) {
      setError("Missing profile");
      event.target.value = "";
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profileId);

      const response = await fetch("/api/profile/logo/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Upload failed");
      }

      const payload = (await response.json()) as UploadResponse;
      onChange(payload.url ?? null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading || !profileId}
        data-testid={inputTestId}
      />
      <button
        type="button"
        onClick={handleSelectClick}
        className={cn(
          "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted",
          value ? "p-0" : "p-2"
        )}
        aria-label={value ? changeLabel : label}
        disabled={disabled || isUploading || !profileId}
      >
        {value ? (
          <>
            <img src={value} alt={alt} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity hover:opacity-100">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <span className="text-xs font-medium text-white">{changeLabel}</span>
              )}
            </div>
          </>
        ) : (
          <>
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            )}
          </>
        )}
      </button>
      <div className="flex flex-1 items-center justify-between gap-3">
        <div className="text-left text-sm">
          <p className="font-medium text-foreground">{value ? changeLabel : label}</p>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isUploading ? uploadingLabel : value ? label : changeLabel}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleSelectClick}
          disabled={disabled || isUploading || !profileId}
        >
          {isUploading ? uploadingLabel : value ? changeLabel : label}
        </Button>
      </div>
    </div>
  );
};
