import { cn } from "@/lib/utils";
import { ClassesTable } from "@/components/dashboard/ClassesTable";
import type { Class } from "../../types/supabase-tables";

interface ClassesTabContentProps {
  panelClassName: string;
  classes: Array<Class & { isExample?: boolean }>;
  loading: boolean;
  onNewClass: () => void;
  onViewClass: (classId: string) => void;
  onEditClass: (classId: string) => void;
}

export function ClassesTabContent({
  panelClassName,
  classes,
  loading,
  onNewClass,
  onViewClass,
  onEditClass,
}: ClassesTabContentProps) {
  return (
    <ClassesTable
      className={cn(panelClassName, "space-y-6")}
      classes={classes}
      loading={loading}
      onNewClass={onNewClass}
      onViewClass={onViewClass}
      onEditClass={onEditClass}
    />
  );
}
