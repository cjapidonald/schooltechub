import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { inviteUser } from "@/lib/admin/users";
import { AdminApiError } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface InvitationFormValues {
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

export default function AdminUserInvitationsPage() {
  const { toast } = useToast();
  const form = useForm<InvitationFormValues>({
    defaultValues: { email: "" },
  });

  const invitationMutation = useMutation({
    mutationFn: ({ email }: InvitationFormValues) => inviteUser(email),
    onSuccess: result => {
      const description = result.userId
        ? "An invitation has been sent and linked to the existing user account."
        : "Invitation email has been sent.";
      toast({ title: "Invitation sent", description });
      form.reset();
    },
    onError: error => {
      toast({ title: "Unable to send invitation", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const onSubmit = (values: InvitationFormValues) => {
    invitationMutation.mutate(values);
  };

  const emailError = form.formState.errors.email?.message;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite a collaborator</CardTitle>
          <CardDescription>Send onboarding instructions to new contributors and administrators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...form.register("email", {
                  required: "Please provide an email address.",
                  pattern: {
                    value: /.+@.+\..+/,
                    message: "Enter a valid email address.",
                  },
                })}
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={invitationMutation.isPending}>
                {invitationMutation.isPending ? "Sending…" : "Send invitation"}
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset()} disabled={invitationMutation.isPending}>
                Reset
              </Button>
            </div>
          </form>

          <Alert>
            <AlertTitle>What happens next?</AlertTitle>
            <AlertDescription>
              Invited users receive an email with a sign-in link. If an account already exists, the invite simply nudges them to
              return and complete onboarding.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
