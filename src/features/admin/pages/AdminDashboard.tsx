import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_ROUTE_META } from "../constants/routes";
import { AdminTableSkeleton } from "../components/AdminTableSkeleton";

const DASHBOARD_METRIC_LABELS = [
  "Pending approvals",
  "Active research projects",
  "New submissions",
  "Open support items",
];

export const AdminDashboard = () => {
  const meta = ADMIN_ROUTE_META["/admin"];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
        <p className="text-muted-foreground">{meta.description}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_METRIC_LABELS.map((label) => (
          <Card key={label} className="overflow-hidden">
            <CardHeader className="space-y-1 pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl font-semibold">
                <Skeleton className="h-8 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Focus areas</CardTitle>
            <CardDescription>Where moderators should spend time next.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-56" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent approvals</CardTitle>
            <CardDescription>Latest items confirmed by administrators.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminTableSkeleton columns={["Item", "Type", "Moderator", "Decision", "Actions"]} rows={4} showToolbar={false} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminDashboard;
