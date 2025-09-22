import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { BuilderState } from "../../types";
import type { LinkHealthStatus } from "../../api/linkHealth";
import { downloadText, generateStudentExport, generateTeacherExport } from "../../utils/exporters";

interface ExportMenuProps {
  state: BuilderState;
  linkLookup: Record<string, LinkHealthStatus>;
}

export const ExportMenu = ({ state, linkLookup }: ExportMenuProps) => {
  const handleTeacherExport = () => {
    const content = generateTeacherExport(state, linkLookup);
    downloadText(`${state.title || "lesson"}-teacher.txt`, content);
  };

  const handleStudentExport = () => {
    const content = generateStudentExport(state);
    downloadText(`${state.title || "lesson"}-student.txt`, content);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="inline-flex items-center gap-2" data-testid="export-menu-trigger">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" data-testid="export-menu">
        <DropdownMenuLabel>Export lesson</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleTeacherExport} data-testid="export-teacher">
          Teacher planning file
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleStudentExport} data-testid="export-student">
          Student handout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
