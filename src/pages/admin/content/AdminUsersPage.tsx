import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { adminJson, adminPost } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

interface AdminUserRecord {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string | null;
  deletedAt: string | null;
  mfaVerifiedAt: string | null;
  isAdmin: boolean;
  adminRevokedAt: string | null;
}

interface AdminUserListResponse {
  users: AdminUserRecord[];
}

export default function AdminUsersPage(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => adminJson<AdminUserListResponse>("/api/admin/users/list"),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => adminPost<{ success: boolean }>("/api/admin/users/delete", { userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User soft-deleted", description: "The account has been disabled and hidden." });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to delete user",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const undeleteMutation = useMutation({
    mutationFn: async (userId: string) => adminPost<{ success: boolean }>("/api/admin/users/undelete", { userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User restored", description: "The account ban has been removed." });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to restore user",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User directory controls</CardTitle>
          <CardDescription>
            View active and deleted accounts, verify administrator MFA status, and reverse accidental deletions.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Administrators must have multi-factor authentication enabled before console access.</CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {usersQuery.error instanceof Error ? usersQuery.error.message : "Failed to load users."}
            </div>
          ) : usersQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No users were found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MFA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const isDeleted = Boolean(user.deletedAt);
                  const isMfaVerified = Boolean(user.mfaVerifiedAt);
                  const createdAt = safeFormat(user.createdAt);
                  const deletedAt = safeFormat(user.deletedAt);
                  const mfaVerifiedAt = safeFormat(user.mfaVerifiedAt);

                  return (
                    <TableRow key={user.id} className={isDeleted ? "opacity-60" : undefined}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{user.fullName ?? "Unnamed user"}</span>
                          {createdAt && (
                            <span className="text-xs text-muted-foreground">Joined {createdAt}</span>
                          )}
                        </div>
                        {user.isAdmin && (
                          <Badge className="mt-2 w-fit" variant="outline">
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col">
                          <span>{user.email ?? "—"}</span>
                          {isDeleted && deletedAt && (
                            <span className="text-xs text-muted-foreground">Deleted {deletedAt}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant={isDeleted ? "destructive" : "default"}>
                          {isDeleted ? "Deleted" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-1">
                          <Badge variant={isMfaVerified ? "default" : "secondary"}>
                            {isMfaVerified ? "Verified" : "Required"}
                          </Badge>
                          {isMfaVerified && mfaVerifiedAt && (
                            <span className="text-xs text-muted-foreground">since {mfaVerifiedAt}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={undeleteMutation.isPending || deleteMutation.isPending || !isDeleted}
                          onClick={() => undeleteMutation.mutate(user.id)}
                        >
                          Undelete
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleteMutation.isPending || undeleteMutation.isPending || isDeleted}
                          onClick={() => deleteMutation.mutate(user.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function safeFormat(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return format(new Date(value), "PPP p");
  } catch {
    return value;
  }
}
