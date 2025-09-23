import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClass,
  listMyClassesWithPlanCount,
  unlinkPlanFromClass,
  type ClassWithPlanCount,
} from "@/lib/classes";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, Eye, Loader2, Plus } from "lucide-react";
import { ClassLessonPlanViewer } from "@/components/classes/ClassLessonPlanViewer";

const initialFormState = {
  title: "",
  subject: "",
  stage: "",
};

export const ClassManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [unlinkingPlanId, setUnlinkingPlanId] = useState<string | null>(null);
  const [filteredPlanCount, setFilteredPlanCount] = useState<number | null>(null);

  const classesQuery = useQuery<ClassWithPlanCount[]>({
    queryKey: ["my-classes"],
    queryFn: () => listMyClassesWithPlanCount(),
  });

  const activeClass = useMemo(() => {
    if (!selectedClassId || !classesQuery.data) {
      return null;
    }
    return classesQuery.data.find(cls => cls.id === selectedClassId) ?? null;
  }, [classesQuery.data, selectedClassId]);

  const createClassMutation = useMutation({
    mutationFn: async (input: typeof initialFormState) => {
      const title = input.title.trim();
      const subject = input.subject.trim();
      const stage = input.stage.trim();

      return createClass({
        title,
        subject: subject.length > 0 ? subject : null,
        stage: stage.length > 0 ? stage : null,
      });
    },
    onSuccess: (createdClass) => {
      toast({
        title: "Class created",
        description: `“${createdClass.title}” is ready to use.`,
      });
      setIsDialogOpen(false);
      setFormState(initialFormState);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["my-classes"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to create class",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const unlinkPlanMutation = useMutation({
    mutationFn: async (lessonPlanId: string) => {
      if (!selectedClassId) {
        throw new Error("No class selected");
      }
      await unlinkPlanFromClass(lessonPlanId, selectedClassId);
    },
    onMutate: (lessonPlanId: string) => {
      setUnlinkingPlanId(lessonPlanId);
    },
    onSuccess: () => {
      toast({
        title: "Lesson plan unlinked",
        description: "The lesson plan was removed from the class.",
      });
      queryClient.invalidateQueries({ queryKey: ["class-lesson-plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-classes"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to unlink lesson plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUnlinkingPlanId(null);
    },
  });

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormState(initialFormState);
      setFormError(null);
    }
  };

  const handleCreateClass = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = formState.title.trim();
    if (!trimmedTitle) {
      setFormError("Class name is required.");
      return;
    }
    setFormError(null);
    createClassMutation.mutate(formState);
  };

  const openDetail = (classId: string) => {
    setSelectedClassId(classId);
    setDetailOpen(true);
  };

  const handleDetailChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedClassId(null);
      setFilteredPlanCount(null);
    }
  };

  const currentPlanCount = filteredPlanCount ?? activeClass?.planCount ?? 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              My Classes
            </CardTitle>
            <CardDescription>
              Create classes and manage the lesson plans linked to them.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new class</DialogTitle>
                <DialogDescription>
                  Give your class a name and optionally include the subject and stage.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class-title">Class name</Label>
                  <Input
                    id="class-title"
                    value={formState.title}
                    onChange={event => {
                      setFormState(prev => ({ ...prev, title: event.target.value }));
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    placeholder="e.g. Year 5 STEM Club"
                    disabled={createClassMutation.isPending}
                    required
                  />
                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="class-subject">Subject (optional)</Label>
                    <Input
                      id="class-subject"
                      value={formState.subject}
                      onChange={event =>
                        setFormState(prev => ({ ...prev, subject: event.target.value }))
                      }
                      placeholder="Math, Science, ..."
                      disabled={createClassMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-stage">Stage (optional)</Label>
                    <Input
                      id="class-stage"
                      value={formState.stage}
                      onChange={event =>
                        setFormState(prev => ({ ...prev, stage: event.target.value }))
                      }
                      placeholder="Grade 5, Lower Primary, ..."
                      disabled={createClassMutation.isPending}
                    />
                  </div>
                </div>
                <DialogFooter className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogChange(false)}
                    disabled={createClassMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createClassMutation.isPending}>
                    {createClassMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create class"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {classesQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : classesQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load your classes</AlertTitle>
              <AlertDescription>
                {classesQuery.error instanceof Error
                  ? classesQuery.error.message
                  : "An unexpected error occurred."}
                <div className="mt-4">
                  <Button variant="outline" onClick={() => classesQuery.refetch()}>
                    Try again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : classesQuery.data && classesQuery.data.length > 0 ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Lesson plans</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classesQuery.data.map(classItem => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">{classItem.title}</TableCell>
                      <TableCell>{classItem.subject ?? "—"}</TableCell>
                      <TableCell>{classItem.stage ?? "—"}</TableCell>
                      <TableCell>{classItem.planCount}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(classItem.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">You haven't created any classes yet.</p>
              <p className="mt-2">Use the New Class button above to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={handleDetailChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{activeClass?.title ?? "Class details"}</SheetTitle>
            <SheetDescription>
              Review the lesson plans linked to this class and unlink any that are no longer needed.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {activeClass ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {activeClass.subject && <Badge variant="secondary">{activeClass.subject}</Badge>}
                  {activeClass.stage && <Badge variant="outline">{activeClass.stage}</Badge>}
                  <Badge variant="outline">Lesson plans: {currentPlanCount}</Badge>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium">Linked lesson plans</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove any plans that are no longer relevant. You can link new plans from the lesson plan builder.
                  </p>
                </div>
              </div>
            ) : (
              <Skeleton className="h-20 w-full" />
            )}

            {selectedClassId ? (
              <ClassLessonPlanViewer
                classId={selectedClassId}
                onUnlink={lessonPlanId => unlinkPlanMutation.mutate(lessonPlanId)}
                isUnlinking={unlinkPlanMutation.isPending}
                unlinkingPlanId={unlinkingPlanId}
                onPlanCountChange={count => setFilteredPlanCount(count)}
              />
            ) : (
              <Skeleton className="h-[60vh] w-full" />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ClassManager;
