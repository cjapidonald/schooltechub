import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  url?: string;
  title?: string;
  className?: string;
}

export const ShareButton = ({ url, title = "Share this post", className = "" }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = url || window.location.href;
  
  const handleShare = async () => {
    // Try to use native share API first (mobile friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to copy
      }
    }
    
    // Fallback to copying to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL from your browser's address bar.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="lg"
      className={`gap-2 ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {title}
        </>
      )}
    </Button>
  );
};