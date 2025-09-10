import React from "react";

interface ContentBlock {
  type: "paragraph" | "image" | "youtube";
  text?: string;
  src?: string;
  alt?: string;
  videoId?: string;
}

interface RichContentProps {
  content: ContentBlock[] | string | null;
  className?: string;
}

const RichContent: React.FC<RichContentProps> = ({ content, className = "" }) => {
  // Handle null or undefined content
  if (!content) {
    return null;
  }

  // Handle legacy string content
  if (typeof content === "string") {
    return <p className={`text-muted-foreground ${className}`}>{content}</p>;
  }

  // Handle jsonb array content
  return (
    <div className={`space-y-4 ${className}`}>
      {content.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={index} className="text-muted-foreground">
                {block.text}
              </p>
            );
          
          case "image":
            return (
              <figure key={index} className="my-6">
                <img
                  src={block.src}
                  alt={block.alt || "Content image"}
                  className="w-full rounded-lg shadow-md"
                  loading="lazy"
                />
                {block.alt && (
                  <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          
          case "youtube":
            return (
              <div key={index} className="my-6">
                <div className="aspect-video rounded-lg overflow-hidden shadow-md">
                  <iframe
                    src={`https://www.youtube.com/embed/${block.videoId}`}
                    title="YouTube video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
};

export default RichContent;