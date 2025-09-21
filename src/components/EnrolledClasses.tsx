import { useState } from "react";
import { format } from "date-fns";
import { useEnrollments } from "@/hooks/useEnrollments";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  Video,
  ChevronRight,
  Trophy,
  Star,
  X,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

interface EnrolledClassesProps {
  userId: string | undefined;
  language: string;
}

type EnrollmentStatus = Database["public"]["Enums"]["enrollment_status"];
type ClassStatus = Database["public"]["Enums"]["class_status"];

const statusColors: Record<EnrollmentStatus, string> = {
  enrolled: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  dropped: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
};

const classStatusColors: Record<ClassStatus, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  upcoming: "bg-yellow-100 text-yellow-800",
  archived: "bg-gray-100 text-gray-800",
};

export const EnrolledClasses = ({ userId, language }: EnrolledClassesProps) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showAllClasses, setShowAllClasses] = useState(false);
  
  const {
    enrollments,
    enrollmentsLoading,
    availableClasses,
    classesLoading,
    enrollInClass,
    enrolling,
    updateEnrollment,
    dropEnrollment,
    droppingEnrollment,
  } = useEnrollments(userId);

  // Separate enrolled and available classes
  const enrolledClassIds = new Set(enrollments.map(e => e.class_id));
  const notEnrolledClasses = availableClasses.filter(c => !enrolledClassIds.has(c.id));

  // Filter enrollments by status
  const activeEnrollments = enrollments.filter(e => e.status === "enrolled");
  const completedEnrollments = enrollments.filter(e => e.status === "completed");

  const handleEnroll = (classId: string) => {
    enrollInClass(classId);
  };

  const handleDrop = (enrollmentId: string) => {
    dropEnrollment(enrollmentId);
    setSelectedClass(null);
  };

  const handleUpdateNotes = (enrollmentId: string) => {
    updateEnrollment({ enrollmentId, notes });
    setNotes("");
  };

  if (enrollmentsLoading || classesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enrolled Classes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            My Enrolled Classes
          </CardTitle>
          <CardDescription>
            Manage your current course enrollments and track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Active ({activeEnrollments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedEnrollments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>You're not currently enrolled in any classes</p>
                  <p className="text-sm mt-2">Browse available classes below to get started</p>
                </div>
              ) : (
                activeEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {enrollment.classes.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {enrollment.classes.description}
                          </CardDescription>
                        </div>
                        <Badge className={classStatusColors[enrollment.classes.status]}>
                          {enrollment.classes.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {enrollment.classes.instructor_name && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {enrollment.classes.instructor_name}
                          </div>
                        )}
                        {enrollment.classes.duration_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {enrollment.classes.duration_hours} hours
                          </div>
                        )}
                        {enrollment.classes.meeting_schedule && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {enrollment.classes.meeting_schedule}
                          </div>
                        )}
                      </div>
                      
                      {enrollment.progress > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{enrollment.progress}%</span>
                          </div>
                          <Progress value={enrollment.progress} className="h-2" />
                        </div>
                      )}

                      {enrollment.classes.start_date && enrollment.classes.end_date && (
                        <div className="text-sm text-muted-foreground">
                          <span>Duration: </span>
                          {format(new Date(enrollment.classes.start_date), "MMM d, yyyy")} - 
                          {format(new Date(enrollment.classes.end_date), "MMM d, yyyy")}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="gap-2 pt-3">
                      {enrollment.classes.meeting_link && (
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(enrollment.classes.meeting_link!, "_blank")}
                        >
                          <Video className="h-4 w-4" />
                          Join Class
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClass(enrollment.id);
                              setNotes(enrollment.notes || "");
                            }}
                          >
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{enrollment.classes.title}</DialogTitle>
                            <DialogDescription>
                              Manage your enrollment and add notes
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="notes">Personal Notes</Label>
                              <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your notes about this class..."
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              onClick={() => handleDrop(enrollment.id)}
                              disabled={droppingEnrollment}
                            >
                              Drop Class
                            </Button>
                            <Button
                              onClick={() => handleUpdateNotes(enrollment.id)}
                            >
                              Save Notes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No completed classes yet</p>
                  <p className="text-sm mt-2">Keep learning to build your achievements!</p>
                </div>
              ) : (
                completedEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {enrollment.classes.title}
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Completed on {format(new Date(enrollment.updated_at), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <Star className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    {enrollment.notes && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{enrollment.notes}</p>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Available Classes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Available Classes
          </CardTitle>
          <CardDescription>
            Browse and enroll in new classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notEnrolledClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No new classes available at the moment</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(showAllClasses ? notEnrolledClasses : notEnrolledClasses.slice(0, 4)).map((cls) => (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{cls.title}</CardTitle>
                      <Badge className={classStatusColors[cls.status]}>
                        {cls.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {cls.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-3">
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {cls.category && (
                        <Badge variant="outline">{cls.category}</Badge>
                      )}
                      {cls.level && (
                        <Badge variant="outline">{cls.level}</Badge>
                      )}
                      {cls.duration_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.duration_hours}h
                        </span>
                      )}
                    </div>
                    {cls.instructor_name && (
                      <p className="text-sm text-muted-foreground">
                        Instructor: {cls.instructor_name}
                      </p>
                    )}
                    {cls.current_enrollment !== null && cls.max_capacity && (
                      <div className="text-xs text-muted-foreground">
                        {cls.current_enrollment}/{cls.max_capacity} enrolled
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-3">
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleEnroll(cls.id)}
                      disabled={enrolling || (cls.max_capacity ? cls.current_enrollment >= cls.max_capacity : false)}
                    >
                      {cls.max_capacity && cls.current_enrollment >= cls.max_capacity
                        ? "Class Full"
                        : "Enroll Now"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {notEnrolledClasses.length > 4 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllClasses(!showAllClasses)}
                className="gap-2"
              >
                {showAllClasses ? (
                  <>
                    Show Less
                    <X className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    View All Classes ({notEnrolledClasses.length})
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};