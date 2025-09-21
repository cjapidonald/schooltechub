import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Class = Database["public"]["Tables"]["classes"]["Row"];
type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];
type EnrollmentWithClass = Enrollment & {
  classes: Class;
};

export const useEnrollments = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's enrollments with class details
  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          classes (*)
        `)
        .eq("user_id", userId)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      return data as EnrollmentWithClass[];
    },
  });

  // Fetch available classes
  const classesQuery = useQuery({
    queryKey: ["available-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Class[];
    },
  });

  // Enroll in a class
  const enrollMutation = useMutation({
    mutationFn: async (classId: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          user_id: userId,
          class_id: classId,
          status: "enrolled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", userId] });
      queryClient.invalidateQueries({ queryKey: ["available-classes"] });
      toast({
        title: "Successfully enrolled",
        description: "You have been enrolled in the class.",
      });
    },
    onError: (error) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update enrollment status
  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({
      enrollmentId,
      status,
      progress,
      notes,
    }: {
      enrollmentId: string;
      status?: Database["public"]["Enums"]["enrollment_status"];
      progress?: number;
      notes?: string;
    }) => {
      const updates: Partial<Enrollment> = {
        updated_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      };
      
      if (status) updates.status = status;
      if (progress !== undefined) updates.progress = progress;
      if (notes !== undefined) updates.notes = notes;

      const { data, error } = await supabase
        .from("enrollments")
        .update(updates)
        .eq("id", enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", userId] });
      toast({
        title: "Enrollment updated",
        description: "Your enrollment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Drop/cancel enrollment
  const dropEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from("enrollments")
        .update({ 
          status: "dropped" as Database["public"]["Enums"]["enrollment_status"],
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", userId] });
      toast({
        title: "Class dropped",
        description: "You have successfully dropped the class.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to drop class",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    enrollments: enrollmentsQuery.data ?? [],
    enrollmentsLoading: enrollmentsQuery.isLoading,
    enrollmentsError: enrollmentsQuery.error,
    availableClasses: classesQuery.data ?? [],
    classesLoading: classesQuery.isLoading,
    enrollInClass: enrollMutation.mutate,
    enrolling: enrollMutation.isPending,
    updateEnrollment: updateEnrollmentMutation.mutate,
    updatingEnrollment: updateEnrollmentMutation.isPending,
    dropEnrollment: dropEnrollmentMutation.mutate,
    droppingEnrollment: dropEnrollmentMutation.isPending,
  };
};