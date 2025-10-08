import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  PaintBucket,
  Type,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useDroppable, useDndMonitor } from "@dnd-kit/core";
import { nanoid } from "nanoid";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ResourceCard } from "@/components/lesson-draft/ResourceCard";
import type { Resource } from "@/types/resources";

const backgroundStyles: Record<string, string> = {
  default: "bg-background",
  notebook: "bg-slate-50",
  calm: "bg-emerald-50",
  midnight: "bg-slate-900 text-slate-100",
};

type DraggableResourceData = {
  type: "library-resource";
  resource: Resource;
  resourceId: string;
};

interface ResourceBlock {
  id: string;
  resource: Resource;
}

const RESOURCE_SEARCH_INPUT_ID = "lesson-resource-search-input";

interface LessonDocEditorProps {
  value: string;
  onChange: (value: string) => void;
  background: string;
  onBackgroundChange: (value: string) => void;
}

export const LessonDocEditor = ({ value, onChange, background, onBackgroundChange }: LessonDocEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const beforeDropRef = useRef<HTMLDivElement | null>(null);
  const afterDropRef = useRef<HTMLDivElement | null>(null);
  const [beforeResources, setBeforeResources] = useState<ResourceBlock[]>([]);
  const [afterResources, setAfterResources] = useState<ResourceBlock[]>([]);

  const beforeDropId = "lesson-doc-dropzone-before";
  const afterDropId = "lesson-doc-dropzone-after";

  const beforeDropZone = useDroppable({
    id: beforeDropId,
    data: { type: "lesson-doc-drop", position: "before" },
  });
  const afterDropZone = useDroppable({
    id: afterDropId,
    data: { type: "lesson-doc-drop", position: "after" },
  });

  useEffect(() => {
    const element = editorRef.current;
    if (!element) {
      return;
    }
    if (element.innerHTML !== value) {
      element.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const handleLink = () => {
    const url = window.prompt("Enter link URL");
    if (url) {
      exec("createLink", url);
    }
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const focusSearch = () => {
    const node = document.getElementById(RESOURCE_SEARCH_INPUT_ID);
    if (node instanceof HTMLInputElement) {
      node.focus();
    }
  };

  const appendResource = (position: "before" | "after", resource: Resource) => {
    const block: ResourceBlock = { id: `${resource.id}-${nanoid(4)}`, resource };
    if (position === "before") {
      setBeforeResources(prev => [...prev, block]);
    } else {
      setAfterResources(prev => [...prev, block]);
    }
  };

  const removeResource = (position: "before" | "after", blockId: string) => {
    if (position === "before") {
      setBeforeResources(prev => prev.filter(block => block.id !== blockId));
    } else {
      setAfterResources(prev => prev.filter(block => block.id !== blockId));
    }
  };

  const handleAddText = () => {
    focusEditor();
  };

  const handleAddResourceViaButton = (position: "before" | "after") => {
    focusSearch();
    const target = position === "before" ? beforeDropRef.current : afterDropRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useDndMonitor({
    onDragEnd: event => {
      const data = event.active.data.current as DraggableResourceData | null;
      if (!data || data.type !== "library-resource") {
        return;
      }

      const overId = event.over?.id;
      if (overId === beforeDropId) {
        appendResource("before", data.resource);
      } else if (overId === afterDropId) {
        appendResource("after", data.resource);
      }
    },
  });

  const renderResourceBlocks = (blocks: ResourceBlock[], position: "before" | "after") => (
    <div className="space-y-4">
      {blocks.map(block => (
        <div key={block.id} className="space-y-2 rounded-lg border border-border/60 bg-background/90 p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <ResourceCard resource={block.resource} layout="horizontal" />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={handleAddText}>
                Add text
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => handleAddResourceViaButton(position)}>
                Add resource card
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeResource(position, block.id)}
                aria-label={`Remove ${block.resource.title}`}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const beforeEmpty = beforeResources.length === 0;
  const afterEmpty = afterResources.length === 0;

  const beforeDropMessage = useMemo(
    () =>
      beforeEmpty
        ? "Drop resource cards here to introduce materials before your narrative."
        : "Drag to reorder cards or continue adding resources.",
    [beforeEmpty],
  );

  const afterDropMessage = useMemo(
    () =>
      afterEmpty
        ? "Drop resource cards here to wrap up your lesson with supporting materials."
        : "Drag to reorder cards or continue adding resources.",
    [afterEmpty],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-sm">
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("formatBlock", "H1")}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("formatBlock", "H2")}> 
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("bold")}> 
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("italic")}> 
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("underline")}> 
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("insertUnorderedList")}> 
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("justifyLeft")}> 
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("justifyCenter")}> 
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("justifyRight")}> 
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={handleLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <label className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
          <Type className="h-3 w-3" />
          <input
            type="color"
            aria-label="Text colour"
            className="h-4 w-8 cursor-pointer border-0 bg-transparent p-0"
            onChange={event => exec("foreColor", event.target.value)}
          />
        </label>
        <label className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
          <PaintBucket className="h-3 w-3" />
          <input
            type="color"
            aria-label="Highlight colour"
            className="h-4 w-8 cursor-pointer border-0 bg-transparent p-0"
            onChange={event => exec("backColor", event.target.value)}
          />
        </label>
        <Select value={background} onValueChange={onBackgroundChange}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Background" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="notebook">Notebook</SelectItem>
            <SelectItem value="calm">Calm</SelectItem>
            <SelectItem value="midnight">Midnight</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resource cards before narrative</h3>
        <div
          ref={node => {
            beforeDropZone.setNodeRef(node);
            beforeDropRef.current = node;
          }}
          className={cn(
            "rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-4",
            beforeDropZone.isOver && "border-primary bg-primary/10",
          )}
          tabIndex={0}
          role="button"
          aria-label="Resource drop zone before lesson narrative"
          onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleAddResourceViaButton("before");
            }
          }}
        >
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <PlusCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <p>{beforeDropMessage}</p>
          </div>
          {renderResourceBlocks(beforeResources, "before")}
        </div>
      </section>
      <div
        ref={editorRef}
        className={cn(
          "min-h-[320px] w-full rounded-xl border border-border p-6 shadow-sm focus:outline-none",
          backgroundStyles[background] ?? backgroundStyles.default,
          "prose prose-sm max-w-none dark:prose-invert",
        )}
        contentEditable
        role="textbox"
        aria-label="Lesson plan document editor"
        suppressContentEditableWarning
        onInput={handleInput}
      />
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resource cards after narrative</h3>
        <div
          ref={node => {
            afterDropZone.setNodeRef(node);
            afterDropRef.current = node;
          }}
          className={cn(
            "rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-4",
            afterDropZone.isOver && "border-primary bg-primary/10",
          )}
          tabIndex={0}
          role="button"
          aria-label="Resource drop zone after lesson narrative"
          onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleAddResourceViaButton("after");
            }
          }}
        >
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <PlusCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <p>{afterDropMessage}</p>
          </div>
          {renderResourceBlocks(afterResources, "after")}
        </div>
      </section>
    </div>
  );
};
