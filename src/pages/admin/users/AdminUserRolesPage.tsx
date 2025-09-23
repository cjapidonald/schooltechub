import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchAdminRoles, grantAdminRole, revokeAdminRole } from "@/lib/admin/users";
import { AdminApiError } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

interface RoleFormValues {
  email: string;
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

export default function AdminUserRolesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: fetchAdminRoles,
  });

  const form = useForm<RoleFormValues>({
    defaultValues: { email: "" },
  });

  const grantMutation = useMutation({
    mutationFn: ({ email }: RoleFormValues) => grantAdminRole({ email }),
    onSuccess: () => {
      toast({ title: "Admin access granted", description: "The user can now access the admin console." });
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: mutationError => {
      toast({
        title: "Unable to grant admin access",
        description: getErrorMessage(mutationError),
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => revokeAdminRole({ userId }),
    onSuccess: () => {
      toast({ title: "Admin access revoked", description: "The user no longer has elevated permissions." });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: mutationError => {
      toast({
        title: "Unable to revoke admin access",
        description: getErrorMessage(mutationError),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: RoleFormValues) => {
    grantMutation.mutate(values);
  };

  const emailError = form.formState.errors.email?.message;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card className="lg:col-span-1 lg:row-span-2">
        <CardHeader>
          <CardTitle>Admin roster</CardTitle>
          <CardDescription>Review who currently holds administrative permissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError && (
            <Alert variant="destructive">
              <AlertTitle>Unable to load admin roles</AlertTitle>
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Granted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data && data.admins.length > 0 ? (
                  data.admins.map(admin => (
                    <TableRow key={admin.userId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{admin.email ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">{admin.userId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {admin.grantedAt ? new Date(admin.grantedAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeMutation.mutate(admin.userId)}
                          disabled={revokeMutation.isPending}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No administrators have been registered yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add an administrator</CardTitle>
          <CardDescription>Grant elevated privileges by referencing an existing user&apos;s email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="name@example.com"
                {...form.register("email", {
                  required: "Please enter an email address.",
                  pattern: {
                    value: /.+@.+\..+/,
                    message: "Enter a valid email address.",
                  },
                })}
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={grantMutation.isPending}>
                {grantMutation.isPending ? "Granting…" : "Grant access"}
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset()} disabled={grantMutation.isPending}>
                Reset
              </Button>
            </div>
          </form>

          <Alert>
            <AlertTitle>Need to invite someone?</AlertTitle>
            <AlertDescription>
              If the person hasn&apos;t signed up yet, send them an invitation first. Once they have an account, you can grant admin
              privileges here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
