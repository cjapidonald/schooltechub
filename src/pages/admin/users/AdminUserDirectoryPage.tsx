import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

import {
  disableUser,
  DirectoryResponse,
  DirectoryUser,
  enableUser,
  fetchDirectory,
  grantAdminRole,
  revokeAdminRole,
  sendPasswordReset,
  deleteUser,
} from "@/lib/admin/users";
import { AdminApiError } from "@/lib/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

const PER_PAGE = 25;

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  try {
    return format(date, "PPpp");
  } catch {
    return "—";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export default function AdminUserDirectoryPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, error, isError, isFetching, isLoading } = useQuery<DirectoryResponse, AdminApiError>({
    queryKey: ["admin-users", page, PER_PAGE],
    queryFn: () => fetchDirectory(page, PER_PAGE),
    keepPreviousData: true,
  });

  const directory = useMemo(() => {
    if (!data) {
      return null;
    }

    const users = Array.isArray(data.users) ? data.users : [];
    const currentPage = typeof data.page === "number" && data.page > 0 ? data.page : 1;
    const perPage = typeof data.perPage === "number" && data.perPage > 0 ? data.perPage : PER_PAGE;
    const total = typeof data.total === "number" && data.total >= 0 ? data.total : users.length;
    const lastPage =
      typeof data.lastPage === "number" && data.lastPage > 0
        ? data.lastPage
        : Math.max(1, Math.ceil(total / Math.max(perPage, 1)));
    const nextPage =
      typeof data.nextPage === "number" && data.nextPage > currentPage && data.nextPage <= lastPage
        ? data.nextPage
        : null;

    return { users, page: currentPage, perPage, total, lastPage, nextPage };
  }, [data]);

  useEffect(() => {
    if (!directory) {
      return;
    }

    if (page > 1 && directory.users.length === 0) {
      setPage(Math.max(1, Math.min(page - 1, directory.lastPage)));
    }
  }, [directory, page]);

  const disableMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => disableUser(userId),
    onSuccess: () => {
      toast({ title: "Account disabled", description: "The user can no longer sign in." });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: mutationError => {
      toast({
        title: "Unable to disable account",
        description: getErrorMessage(mutationError),
        variant: "destructive",
      });
    },
  });

  const enableMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => enableUser(userId),
    onSuccess: () => {
      toast({ title: "Account enabled", description: "The user can sign in again." });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: mutationError => {
      toast({
        title: "Unable to enable account",
        description: getErrorMessage(mutationError),
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => sendPasswordReset(userId),
    onSuccess: () => {
      toast({
        title: "Reset email sent",
        description: "The user has received password reset instructions.",
      });
    },
    onError: mutationError => {
      toast({
        title: "Unable to send reset email",
        description: getErrorMessage(mutationError),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => deleteUser(userId),
    onSuccess: () => {
      toast({ title: "User deleted", description: "The account has been removed." });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: mutationError => {
      toast({
        title: "Unable to delete user",
        description: getErrorMessage(mutationError),
        variant: "destructive",
      });
    },
  });

  const grantMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => grantAdminRole({ userId }),
    onSuccess: () => {
      toast({ title: "Admin role granted", description: "The user now has administrative access." });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: mutationError => {
      toast({
        title: "Unable to grant admin role",
        description: getErrorMessage(mutationError),
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => revokeAdminRole({ userId }),
    onSuccess: () => {
      toast({ title: "Admin role revoked", description: "The user no longer has admin access." });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: mutationError => {
      toast({
        title: "Unable to revoke admin role",
        description: getErrorMessage(mutationError),
        variant: "destructive",
      });
    },
  });

  const isPerformingAction =
    disableMutation.isPending ||
    enableMutation.isPending ||
    resetMutation.isPending ||
    deleteMutation.isPending ||
    grantMutation.isPending ||
    revokeMutation.isPending;

  const pagination = useMemo(() => {
    if (!directory) {
      return { start: 0, end: 0, total: 0, hasNext: false };
    }

    const hasUsers = directory.users.length > 0;
    const start = (directory.page - 1) * directory.perPage + (hasUsers ? 1 : 0);
    const end = hasUsers ? start + directory.users.length - 1 : start;
    const hasNext = directory.nextPage !== null && directory.nextPage > directory.page;

    return { start, end: Math.max(start, end), total: directory.total, hasNext };
  }, [directory]);

  function handleToggleStatus(user: DirectoryUser) {
    if (user.status === "enabled") {
      disableMutation.mutate({ userId: user.id });
    } else {
      enableMutation.mutate({ userId: user.id });
    }
  }

  function handleDelete(user: DirectoryUser) {
    const confirmed = window.confirm(
      `Delete ${user.email ?? "this user"}? This action cannot be undone and will remove all access.`,
    );
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate({ userId: user.id });
  }

  function handleRoleToggle(user: DirectoryUser) {
    if (user.isAdmin) {
      revokeMutation.mutate({ userId: user.id });
    } else {
      grantMutation.mutate({ userId: user.id });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User directory</CardTitle>
          <CardDescription>Review accounts, enforce access controls, and manage permissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError && (
            <Alert variant="destructive">
              <AlertTitle>Unable to load users</AlertTitle>
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                  <TableHead className="hidden lg:table-cell">Last active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : directory && directory.users.length > 0 ? (
                  directory.users.map(user => (
                    <TableRow key={user.id} className={user.status === "disabled" ? "opacity-75" : undefined}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{user.email ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">{user.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(user.lastSignInAt)}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "enabled" ? "secondary" : "destructive"}>
                          {user.status === "enabled" ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isAdmin ? "default" : "outline"}>{user.isAdmin ? "Admin" : "User"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isPerformingAction}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                              {user.status === "enabled" ? "Disable account" : "Enable account"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => resetMutation.mutate({ userId: user.id })}>
                              Send reset password email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleToggle(user)}>
                              {user.isAdmin ? "Revoke admin role" : "Grant admin role"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive focus:text-destructive">
                              Delete user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No users were found for this page.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {pagination.total > 0
                ? `Showing ${pagination.start}–${pagination.end} of ${pagination.total} users`
                : "No users to display"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={page === 1 || isFetching || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (directory) {
                    const next = directory.nextPage ??
                      (directory.lastPage > directory.page ? directory.page + 1 : directory.page);
                    if (next !== directory.page) {
                      setPage(next);
                    }
                  }
                }}
                disabled={!directory || !pagination.hasNext || isFetching || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
