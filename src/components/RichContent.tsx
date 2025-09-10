import React from "react";

interface TextChild {
  text: string;
  bold?: boolean;
}

interface ContentBlock {
  type: "paragraph" | "heading" | "image" | "youtube" | "call_to_action";
  children?: TextChild[];
  level?: number;
  src?: string;
  alt?: string;
  caption?: string;
  videoId?: string;
  url?: string;
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

  // Ensure content is an array
  const contentArray = Array.isArray(content) ? content : [content];

  // Helper function to render text children
  const renderTextChildren = (children: TextChild[] | undefined) => {
    if (!children) return null;
    return children.map((child, i) => (
      <span key={i} className={child.bold ? "font-bold" : ""}>
        {child.text}
      </span>
    ));
  };

  // Handle jsonb array content
  return (
    <div className={`space-y-4 ${className}`}>
      {contentArray.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {renderTextChildren(block.children)}
              </p>
            );
          
          case "heading":
            const Tag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
            const headingClasses = {
              2: "text-2xl font-bold mt-8 mb-4",
              3: "text-xl font-semibold mt-6 mb-3",
              4: "text-lg font-semibold mt-4 mb-2",
            };
            return (
              <Tag key={index} className={headingClasses[block.level as 2 | 3 | 4] || headingClasses[2]}>
                {renderTextChildren(block.children)}
              </Tag>
            );
          
          case "image":
            return (
              <figure key={index} className="my-8">
                <img
                  src={block.src}
                  alt={block.alt || "Content image"}
                  className="w-full rounded-lg shadow-md"
                  loading="lazy"
                />
                {block.caption && (
                  <figcaption className="text-sm text-muted-foreground mt-3 text-center italic">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          
          case "youtube":
            return (
              <div key={index} className="my-8">
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
          
          case "call_to_action":
            return (
              <div key={index} className="my-8 p-6 bg-accent/10 rounded-lg border-l-4 border-accent">
                <p className="mb-4 font-medium">
                  {renderTextChildren(block.children)}
                </p>
                {block.url && (
                  <a 
                    href={block.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold transition-colors"
                  >
                    Check it out →
                  </a>
                )}
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