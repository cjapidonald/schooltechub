import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, ClipboardList, ExternalLink, Link2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type CurriculumLessonRow = {
  classId: string;
  lessonId: string;
  classTitle: string;
  classStage: string | null;
  classSubject: string | null;
  title: string;
  sequence: number;
  presentationUrl: string | null;
  lastUpdatedAt: string | null;
};

interface CurriculumTableProps {
  lessons: CurriculumLessonRow[];
  onLaunchLessonBuilder: (lesson: CurriculumLessonRow) => void;
  onUpdatePresentationLink: (lesson: CurriculumLessonRow, url: string | null) => void;
  onAddAssessment: (lesson: CurriculumLessonRow) => void;
  onCreateClass: () => void;
  className?: string;
}

const formatUpdatedAt = (value: string | null) => {
  if (!value) {
    return "Never";
  }

  try {
    return `${formatDistanceToNow(new Date(value), { addSuffix: true })}`;
  } catch (error) {
    return value;
  }
};

export const CurriculumTable = ({
  lessons,
  onLaunchLessonBuilder,
  onUpdatePresentationLink,
  onAddAssessment,
  onCreateClass,
  className,
}: CurriculumTableProps) => {
  const [classFilter, setClassFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [linkEditor, setLinkEditor] = useState<{ lesson: CurriculumLessonRow | null; url: string }>(() => ({
    lesson: null,
    url: "",
  }));

  const classOptions = useMemo(() => {
    const seen = new Map<string, string>();
    lessons.forEach(lesson => {
      if (!seen.has(lesson.classId)) {
        seen.set(lesson.classId, lesson.classTitle);
      }
    });
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [lessons]);

  const subjectOptions = useMemo(() => {
    const subjects = new Set<string>();
    lessons.forEach(lesson => {
      if (lesson.classSubject && lesson.classSubject.trim().length > 0) {
        subjects.add(lesson.classSubject.trim());
      }
    });
    return Array.from(subjects.values()).sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return lessons
      .filter(lesson => {
        if (classFilter !== "all" && lesson.classId !== classFilter) {
          return false;
        }
        if (subjectFilter !== "all" && (lesson.classSubject ?? "") !== subjectFilter) {
          return false;
        }
        if (search.length > 0) {
          const haystack = `${lesson.title} ${lesson.classTitle}`.toLowerCase();
          return haystack.includes(search);
        }
        return true;
      })
      .sort((a, b) => {
        const classDiff = a.classTitle.localeCompare(b.classTitle);
        if (classDiff !== 0) {
          return classDiff;
        }
        return a.sequence - b.sequence;
      });
  }, [classFilter, lessons, searchTerm, subjectFilter]);

  const handleOpenLinkEditor = (lesson: CurriculumLessonRow) => {
    setLinkEditor({ lesson, url: lesson.presentationUrl ?? "" });
  };

  const handleCloseLinkEditor = () => {
    setLinkEditor({ lesson: null, url: "" });
  };

  const handleSaveLink = () => {
    if (!linkEditor.lesson) {
      return;
    }
    const trimmed = linkEditor.url.trim();
    onUpdatePresentationLink(linkEditor.lesson, trimmed.length > 0 ? trimmed : null);
    handleCloseLinkEditor();
  };

  const handleClearLink = () => {
    if (!linkEditor.lesson) {
      return;
    }
    onUpdatePresentationLink(linkEditor.lesson, null);
    handleCloseLinkEditor();
  };

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid gap-1">
            <Label htmlFor="curriculum-class-filter" className="text-xs uppercase tracking-wide text-white/60">
              Class
            </Label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger
                id="curriculum-class-filter"
                className="w-48 rounded-xl border-white/20 bg-white/10 text-left text-sm text-white hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="curriculum-subject-filter" className="text-xs uppercase tracking-wide text-white/60">
              Subject
            </Label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger
                id="curriculum-subject-filter"
                className="w-48 rounded-xl border-white/20 bg-white/10 text-left text-sm text-white hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectOptions.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid gap-1">
            <Label htmlFor="curriculum-search" className="text-xs uppercase tracking-wide text-white/60">
              Search lessons
            </Label>
            <Input
              id="curriculum-search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search by lesson or class"
              className="w-full min-w-[240px] rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/60 focus:ring-white/40"
            />
          </div>
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-sm text-white/70">
          <BookOpen className="h-10 w-10 text-white/60" />
          <div className="space-y-1">
            <p>No lessons match your filters yet.</p>
            <p className="text-xs text-white/50">Add lesson titles when creating a class to see them appear here.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"
            onClick={onCreateClass}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create a class
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 text-xs uppercase tracking-wide text-white/60">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Presentation</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLessons.map(lesson => (
                <TableRow key={`${lesson.classId}-${lesson.lessonId}`} className="border-white/10 text-sm text-white/80">
                  <TableCell className="font-semibold text-white/80">{lesson.sequence}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{lesson.title}</span>
                      <span className="text-xs text-white/50">Lesson ID: {lesson.lessonId.slice(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-white">
                      <span>{lesson.classTitle}</span>
                      {lesson.classStage ? (
                        <span className="text-xs text-white/60">Stage: {lesson.classStage}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-white/80">{lesson.classSubject ?? "—"}</TableCell>
                  <TableCell>
                    {lesson.presentationUrl ? (
                      <div className="flex items-center gap-2 text-sm">
                        <a
                          href={lesson.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 transition hover:border-white/40 hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View link
                        </a>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs text-white/70 hover:text-white"
                          onClick={() => handleOpenLinkEditor(lesson)}
                        >
                          Edit
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-xs text-white/70 hover:text-white"
                        onClick={() => handleOpenLinkEditor(lesson)}
                      >
                        <Link2 className="mr-1 h-3.5 w-3.5" /> Add link
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-white/60">{formatUpdatedAt(lesson.lastUpdatedAt)}</TableCell>
                  <TableCell className="space-y-1 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="w-full justify-end rounded-xl border border-white/20 bg-white/80 text-slate-900 hover:bg-white"
                      onClick={() => onLaunchLessonBuilder(lesson)}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" /> Build plan
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="w-full justify-end rounded-xl border border-white/20 bg-white/5 text-white/80 hover:bg-white/15"
                      onClick={() => onAddAssessment(lesson)}
                    >
                      <BookOpen className="mr-2 h-4 w-4" /> Add assessment
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(linkEditor.lesson)} onOpenChange={open => !open && handleCloseLinkEditor()}>
        <DialogContent className="sm:max-w-md border border-white/30 bg-white/10 text-white shadow-[0_35px_120px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Presentation link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              Paste a shareable link to the presentation or slide deck for this lesson.
            </p>
            <Input
              value={linkEditor.url}
              onChange={event => setLinkEditor(prev => ({ ...prev, url: event.target.value }))}
              placeholder="https://"
              className="rounded-xl border-white/30 bg-white/5 text-white placeholder:text-white/40 focus:border-white/60 focus:ring-white/40"
            />
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-4">
            <Button
              type="button"
              variant="ghost"
              className="text-white/70 hover:text-white disabled:text-white/40"
              onClick={handleClearLink}
              disabled={!linkEditor.lesson?.presentationUrl}
            >
              Remove link
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCloseLinkEditor}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveLink}>
                Save link
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumTable;
