import { ReactNode } from "react";
import { AdminTableSkeleton } from "./AdminTableSkeleton";

interface AdminSectionProps {
  title: string;
  description: string;
  tableColumns?: string[];
  children?: ReactNode;
}

export const AdminSection = ({ title, description, tableColumns, children }: AdminSectionProps) => {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>
      {children ?? <AdminTableSkeleton columns={tableColumns} />}
    </section>
  );
};

export default AdminSection;
