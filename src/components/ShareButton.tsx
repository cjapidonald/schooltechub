import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Check,
  Link2,
  Facebook,
  MessageCircle,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  url?: string;
  title?: string;
  buttonLabel?: string;
  className?: string;
}

export const ShareButton = ({
  url,
  title = "Share this post",
  buttonLabel,
  className = "",
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = useMemo(() => {
    if (url) return url;
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  }, [url]);

  const encodedUrl = useMemo(() => encodeURIComponent(shareUrl), [shareUrl]);
  const encodedTitle = useMemo(() => encodeURIComponent(title), [title]);

  const canUseNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function" && Boolean(shareUrl);

  const handleNativeShare = async () => {
    if (!canUseNativeShare) return;

    try {
      await navigator.share({
        title,
        url: shareUrl,
      });
    } catch (err) {
      // User cancelled or share failed; we'll fall back to manual options.
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast({
        title: "Clipboard unavailable",
        description: "Please copy the URL from your browser's address bar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL from your browser's address bar.",
        variant: "destructive",
      });
    }
  };

  const openShareWindow = (shareLink: string) => {
    if (!shareLink || typeof window === "undefined") return;

    try {
      window.open(shareLink, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        title: "Unable to open share window",
        description: "Please try copying the link instead.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg" className={`gap-2 ${className}`}>
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              {buttonLabel ?? title}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {canUseNativeShare && (
          <DropdownMenuItem onSelect={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share with device menu
          </DropdownMenuItem>
        )}
        {canUseNativeShare && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            openShareWindow(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`);
          }}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
          }}
        >
          <Facebook className="mr-2 h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            openShareWindow(`https://www.messenger.com/t/?link=${encodedUrl}`);
          }}
        >
          <Send className="mr-2 h-4 w-4" />
          Share via Messenger
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            handleCopyLink();
          }}
        >
          <Link2 className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};