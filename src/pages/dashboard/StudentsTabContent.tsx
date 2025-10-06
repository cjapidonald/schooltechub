import { StudentsSection } from "@/components/dashboard/StudentsSection";
import type { Class } from "../../types/supabase-tables";

interface StudentsTabContentProps {
  panelClassName: string;
  classes: Array<Class & { isExample?: boolean }>;
  onOpenStudent: (studentId: string) => void;
}

export function StudentsTabContent({
  panelClassName,
  classes,
  onOpenStudent,
}: StudentsTabContentProps) {
  return (
    <StudentsSection
      className={panelClassName}
      classes={classes}
      onOpenStudent={onOpenStudent}
    />
  );
}
