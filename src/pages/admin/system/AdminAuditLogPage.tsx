import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_LOG_ROWS = 200;

type AuditLogRow = Tables<"audit_logs">;
type ProfileRow = Tables<"profiles">;

type AuditLogFilters = {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  startDate: string;
  endDate: string;
};

const INITIAL_FILTERS: AuditLogFilters = {
  actorId: "",
  action: "",
  targetType: "",
  targetId: "",
  startDate: "",
  endDate: "",
};

function normaliseDateInput(value: string): string {
  return value.trim();
}

function endOfDayIso(dateValue: string): string {
  const date = new Date(dateValue);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

async function fetchAuditLogs(filters: AuditLogFilters): Promise<AuditLogRow[]> {
  let query = supabase
    .from("audit_logs")
    .select("id, actor_id, action, target_type, target_id, details, ip, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(MAX_LOG_ROWS);

  if (filters.actorId) {
    query = query.eq("actor_id", filters.actorId);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.targetType) {
    query = query.eq("target_type", filters.targetType);
  }

  if (filters.targetId) {
    query = query.ilike("target_id", `%${filters.targetId}%`);
  }

  if (filters.startDate) {
    query = query.gte("created_at", new Date(filters.startDate).toISOString());
  }

  if (filters.endDate) {
    query = query.lte("created_at", endOfDayIso(filters.endDate));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function fetchProfiles(actorIds: string[]): Promise<ProfileRow[]> {
  if (actorIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", actorIds);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function formatDetails(details: AuditLogRow["details"]): string {
  if (details === null || typeof details === "undefined") {
    return "";
  }

  if (typeof details === "string" || typeof details === "number" || typeof details === "boolean") {
    return String(details);
  }

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return "";
  }
}

function resolveActorLabel(profile: ProfileRow | undefined, fallback: string | null): string {
  if (!profile) {
    return fallback ?? "Unknown";
  }

  if (profile.full_name && profile.email) {
    return `${profile.full_name} (${profile.email})`;
  }

  if (profile.full_name) {
    return profile.full_name;
  }

  return profile.email ?? fallback ?? "Unknown";
}

export default function AdminAuditLogPage(): JSX.Element {
  const [filters, setFilters] = useState<AuditLogFilters>(INITIAL_FILTERS);

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => fetchAuditLogs(filters),
  });

  const actorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const log of logs) {
      if (log.actor_id) {
        ids.add(log.actor_id);
      }
    }
    return Array.from(ids);
  }, [logs]);

  const { data: actorProfiles = [] } = useQuery({
    queryKey: ["audit-log-actors", actorIds],
    queryFn: () => fetchProfiles(actorIds),
    enabled: actorIds.length > 0,
  });

  const actorMap = useMemo(() => {
    const map = new Map<string, ProfileRow>();
    for (const profile of actorProfiles) {
      map.set(profile.id, profile);
    }
    return map;
  }, [actorProfiles]);

  const actorOptions = useMemo(() => {
    const entries = new Map<string, string>();
    for (const log of logs) {
      if (!log.actor_id) {
        continue;
      }
      const profile = actorMap.get(log.actor_id);
      entries.set(log.actor_id, resolveActorLabel(profile, log.actor_id));
    }
    return Array.from(entries.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [actorMap, logs]);

  const actionOptions = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.action)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const targetTypeOptions = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.target_type)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const handleFilterChange = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            Review privileged actions recorded across the admin surface and filter by actor, action, target, or date.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Actor</label>
            <Select
              value={filters.actorId || "all"}
              onValueChange={value => handleFilterChange("actorId", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All actors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actors</SelectItem>
                {actorOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <Select
              value={filters.action || "all"}
              onValueChange={value => handleFilterChange("action", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actionOptions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target type</label>
            <Select
              value={filters.targetType || "all"}
              onValueChange={value => handleFilterChange("targetType", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All target types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All target types</SelectItem>
                {targetTypeOptions.map(targetType => (
                  <SelectItem key={targetType} value={targetType}>
                    {targetType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target ID</label>
            <Input
              value={filters.targetId}
              placeholder="Search target identifier"
              onChange={event => handleFilterChange("targetId", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">From date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={event => handleFilterChange("startDate", normaliseDateInput(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={event => handleFilterChange("endDate", normaliseDateInput(event.target.value))}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Button variant="outline" onClick={handleReset}>
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Showing the latest {Math.min(logs.length, MAX_LOG_ROWS)} records. Narrow the filters to explore older entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Timestamp</TableHead>
                  <TableHead className="min-w-[160px]">Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="min-w-[160px]">Network</TableHead>
                  <TableHead className="min-w-[220px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Loading audit history…
                    </TableCell>
                  </TableRow>
                )}

                {error && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-destructive">
                      Failed to load audit logs: {error.message}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error && logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No audit entries found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error &&
                  logs.map(log => {
                    const profile = log.actor_id ? actorMap.get(log.actor_id) : undefined;
                    const detailsText = formatDetails(log.details);

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="align-top">
                          {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell className="align-top">
                          {log.actor_id ? (
                            <div className="space-y-1">
                              <Badge variant="secondary" className="font-normal">
                                {resolveActorLabel(profile, log.actor_id)}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{log.actor_id}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="font-medium break-words">{log.action}</span>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <Badge variant="outline" className="font-normal uppercase">
                              {log.target_type}
                            </Badge>
                            <p className="break-all text-sm">{log.target_id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          <div className="space-y-1">
                            <p>{log.ip ?? "—"}</p>
                            <p className="break-all text-xs">{log.user_agent ?? "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {detailsText ? (
                            <pre className="max-h-48 overflow-auto rounded border bg-muted px-2 py-1 text-xs leading-tight">
                              {detailsText}
                            </pre>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
