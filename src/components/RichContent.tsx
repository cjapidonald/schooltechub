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

interface EditorJSBlock {
  type: string;
  data?: Record<string, unknown>;
}

interface EditorJSContent {
  blocks: EditorJSBlock[];
}

type RichContentInput = ContentBlock[] | ContentBlock | EditorJSContent | string | null;

interface RichContentProps {
  content: RichContentInput;
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

  const isEditorJSContent = (value: unknown): value is EditorJSContent => {
    return (
      typeof value === "object" &&
      value !== null &&
      Array.isArray((value as EditorJSContent).blocks)
    );
  };

  const textToChildren = (rawText?: unknown): TextChild[] | undefined => {
    if (typeof rawText !== "string") return undefined;
    const sanitizedText = rawText
      .replace(/<br\s*\/?>(\n)?/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim();

    if (!sanitizedText) return undefined;

    return [{ text: sanitizedText }];
  };

  const normalizeEditorBlocks = (blocks: EditorJSBlock[]): ContentBlock[] => {
    return blocks
      .map((block) => {
        const data = block.data ?? {};

        switch (block.type) {
          case "paragraph": {
            const children = textToChildren((data as { text?: string }).text);
            if (!children) return null;
            return { type: "paragraph" as const, children };
          }
          case "header":
          case "heading": {
            const headingData = data as { text?: string; level?: number | string };
            const children = textToChildren(headingData.text);
            if (!children) return null;
            const normalizedLevel =
              typeof headingData.level === "number"
                ? headingData.level
                : typeof headingData.level === "string"
                  ? parseInt(headingData.level, 10)
                  : undefined;
            return {
              type: "heading" as const,
              level: Number.isNaN(normalizedLevel) ? undefined : normalizedLevel,
              children,
            };
          }
          case "image": {
            const imageData = data as {
              file?: { url?: string };
              url?: string;
              caption?: string;
              alt?: string;
            };
            const src = imageData.file?.url || imageData.url;
            if (!src) return null;
            return {
              type: "image" as const,
              src,
              alt: imageData.alt || imageData.caption,
              caption: imageData.caption,
            };
          }
          default:
            return null;
        }
      })
      .filter((block): block is ContentBlock => !!block);
  };

  let contentArray: ContentBlock[];

  if (isEditorJSContent(content)) {
    contentArray = normalizeEditorBlocks(content.blocks);
  } else if (Array.isArray(content)) {
    contentArray = content;
  } else {
    contentArray = [content];
  }

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
          
          case "heading": {
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
          }
          
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