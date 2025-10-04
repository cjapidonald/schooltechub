import { useEffect, useRef } from "react";
import { Bold, Heading1, Heading2, Italic, Link as LinkIcon, List, PaintBucket, Type, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const backgroundStyles: Record<string, string> = {
  default: "bg-background",
  notebook: "bg-slate-50",
  calm: "bg-emerald-50",
  midnight: "bg-slate-900 text-slate-100",
};

interface LessonDocEditorProps {
  value: string;
  onChange: (value: string) => void;
  background: string;
  onBackgroundChange: (value: string) => void;
}

export const LessonDocEditor = ({ value, onChange, background, onBackgroundChange }: LessonDocEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

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
    </div>
  );
};
