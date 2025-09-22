import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboardSkeleton } from "../components/AdminSkeletons";
import type { AdminOutletContext } from "../AdminLayout";
import { cn } from "@/lib/utils";

interface FailedEmailEntry {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  type: string;
  createdAt: string;
}

interface DashboardSummary {
  generatedAt: string;
  pendingModeration: {
    resources: number;
    blogposts: number;
    researchApplications: number;
  };
  research: {
    activeProjects: number;
  };
  users: {
    newLast7Days: number;
    newLast30Days: number;
  };
  notifications: {
    recentFailedEmails: FailedEmailEntry[];
  };
}

export default function AdminDashboardPage(): JSX.Element {
  const { meta } = useOutletContext<AdminOutletContext>();

  const query = useQuery<DashboardSummary, Error>({
    queryKey: ["admin", "dashboard", "summary"],
    queryFn: fetchDashboardSummary,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const numberFormatter = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }), []);

  if (query.isLoading) {
    return <AdminDashboardSkeleton title={meta.title} description={meta.description} />;
  }

  if (query.isError || !query.data) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Unable to load dashboard</CardTitle>
          <CardDescription>{query.error?.message ?? "Please try again in a moment."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { data } = query;
  const totalPending =
    data.pendingModeration.resources + data.pendingModeration.blogposts + data.pendingModeration.researchApplications;
  const refreshedLabel = formatRelativeTime(data.generatedAt);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
          {meta.description && <p className="text-muted-foreground">{meta.description}</p>}
          {refreshedLabel && (
            <p className="text-sm text-muted-foreground">Updated {refreshedLabel}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {numberFormatter.format(totalPending)} items awaiting moderator action across the platform.
          </p>
        </div>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCcw className={cn("mr-2 h-4 w-4", query.isFetching && "animate-spin")} />
          {query.isFetching ? "Refreshing" : "Refresh"}
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending resources"
          helper="Awaiting resource review"
          value={numberFormatter.format(data.pendingModeration.resources)}
        />
        <StatCard
          label="Pending blogposts"
          helper="Queued for editorial approval"
          value={numberFormatter.format(data.pendingModeration.blogposts)}
        />
        <StatCard
          label="Pending research apps"
          helper="Need triage and assignment"
          value={numberFormatter.format(data.pendingModeration.researchApplications)}
        />
        <StatCard
          label="Active research projects"
          helper="Projects currently in field"
          value={numberFormatter.format(data.research.activeProjects)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>New users</CardTitle>
            <CardDescription>Fresh educator accounts created recently.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <GrowthStat
              label="Last 7 days"
              value={numberFormatter.format(data.users.newLast7Days)}
              helper="Educators joined this week"
            />
            <GrowthStat
              label="Last 30 days"
              value={numberFormatter.format(data.users.newLast30Days)}
              helper="Educators joined in the last 30 days"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email delivery health</CardTitle>
            <CardDescription>Recent notification emails that still need attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.notifications.recentFailedEmails.length === 0 ? (
              <p className="text-sm text-muted-foreground">All recent notification emails have been sent successfully.</p>
            ) : (
              <div className="space-y-4">
                {data.notifications.recentFailedEmails.map(entry => (
                  <div key={entry.id} className="space-y-1 rounded-md border bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {entry.userName?.trim() || entry.userEmail || "Unknown recipient"}
                      </p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {formatNotificationType(entry.type)}
                      </Badge>
                    </div>
                    {entry.userEmail && (
                      <p className="text-xs text-muted-foreground">{entry.userEmail}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Failed {formatRelativeTime(entry.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error || !sessionResult.data.session?.access_token) {
    throw new Error("You must be signed in as an administrator to view the dashboard.");
  }

  const token = sessionResult.data.session.access_token;
  const response = await fetch("/api/admin/dashboard/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to load dashboard metrics.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // Ignore JSON parse errors for non-JSON responses.
    }

    throw new Error(message);
  }

  return (await response.json()) as DashboardSummary;
}

function formatRelativeTime(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  try {
    return formatDistanceToNow(new Date(input), { addSuffix: true });
  } catch {
    return null;
  }
}

function formatNotificationType(type: string): string {
  return type
    .split("_")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
        {helper && <CardDescription>{helper}</CardDescription>}
      </CardHeader>
    </Card>
  );
}

function GrowthStat({ label, value, helper }: { label: string; value: string; helper?: string }) {
  const badgeLabel = label.includes("7") ? "7d" : label.includes("30") ? "30d" : "period";

  return (
    <div className="rounded-md border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Badge variant="outline" className="text-xs uppercase">{badgeLabel}</Badge>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}
