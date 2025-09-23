import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { fetchWithAdminAuth } from "@/lib/admin-api";

interface AdminNotification {
  id: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  emailSent: boolean;
  payload: Record<string, unknown>;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
}

interface NotificationsResponse {
  notifications: AdminNotification[];
  availableTypes: string[];
}

const TYPE_LABELS: Record<string, string> = {
  resource_approved: "Resource approved",
  blogpost_approved: "Blog post approved",
  research_application_approved: "Research application approved",
  comment_reply: "Comment reply",
};

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

async function fetchNotifications(filters: { type?: string; user?: string }): Promise<NotificationsResponse> {
  const baseUrl = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL("/api/admin/system/notifications", baseUrl);

  if (filters.type) {
    url.searchParams.set("type", filters.type);
  }

  if (filters.user) {
    url.searchParams.set("user", filters.user);
  }

  const response = await fetchWithAdminAuth(url.toString());

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to load notifications");
  }

  return (await response.json()) as NotificationsResponse;
}

async function resendNotification(id: string): Promise<void> {
  const response = await fetchWithAdminAuth("/api/admin/system/notifications/resend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.success) {
    const reason = payload.reason ?? "Failed to resend email";
    throw new Error(typeof reason === "string" ? reason : "Failed to resend email");
  }
}

export default function AdminNotificationsPage(): JSX.Element {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications", { type: typeFilter, user: userFilter }],
    queryFn: () => fetchNotifications({ type: typeFilter || undefined, user: userFilter || undefined }),
  });

  const resendMutation = useMutation({
    mutationFn: resendNotification,
    onSuccess: async () => {
      toast({
        title: "Email sent",
        description: "The notification email has been queued for delivery.",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: error => {
      const message = error instanceof Error ? error.message : "Failed to resend email";
      toast({ title: "Unable to resend", description: message, variant: "destructive" });
    },
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const availableTypes = useMemo(() => notificationsQuery.data?.availableTypes ?? [], [
    notificationsQuery.data?.availableTypes,
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine the notification feed by user or notification type.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="notification-user-filter">User</Label>
              <Input
                id="notification-user-filter"
                placeholder="Search by email or user id"
                value={userFilter}
                onChange={event => setUserFilter(event.target.value)}
              />
            </div>
            <div className="w-full space-y-2 md:w-64">
              <Label htmlFor="notification-type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="notification-type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {availableTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {getTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 md:pb-1">
              <Button
                variant="outline"
                onClick={() => {
                  setUserFilter("");
                  setTypeFilter("");
                }}
                disabled={notificationsQuery.isLoading}
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
                }}
                disabled={notificationsQuery.isFetching}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest notifications</CardTitle>
          <CardDescription>Review recent notifications and re-send approval emails if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Loading notifications…
                    </TableCell>
                  </TableRow>
                ) : notificationsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-destructive">
                      {(notificationsQuery.error instanceof Error
                        ? notificationsQuery.error.message
                        : "Unable to load notifications") ?? "Unable to load notifications"}
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No notifications found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map(notification => (
                    <TableRow key={notification.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(notification.createdAt), "PPpp")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{notification.user.email ?? "Unknown email"}</span>
                          <span className="text-xs text-muted-foreground">
                            {notification.user.name ?? notification.user.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(notification.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        {notification.emailSent ? (
                          <Badge variant="secondary">Email sent</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not sent</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendMutation.mutate(notification.id)}
                          disabled={resendMutation.isLoading}
                        >
                          Resend email
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
