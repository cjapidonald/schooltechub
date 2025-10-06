import { useEffect, useMemo, useState } from "react";
import { Chrome, LogIn, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AuthRole = "teacher" | "student";

interface RoleAuthDialogProps {
  open: boolean;
  role: AuthRole;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (role: AuthRole) => void;
}

const roleCopy: Record<AuthRole, { title: string; description: string; googleLabel: string }> = {
  teacher: {
    title: "Teacher workspace access",
    description: "Sign in to view your planning boards, assessments, and class analytics.",
    googleLabel: "Continue with Google",
  },
  student: {
    title: "Student dashboard login",
    description: "Enter your details to open assignments, streaks, and teacher guidance.",
    googleLabel: "Sign in with Google",
  },
};

export const RoleAuthDialog = ({ open, role, onOpenChange, onSuccess }: RoleAuthDialogProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setIsSubmitting(false);
    }
  }, [open]);

  const nextPath = useMemo(() => (role === "teacher" ? "/teacher" : "/student"), [role]);

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both your email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Unable to sign in",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Welcome back",
      description: "You're signed in successfully.",
    });

    onSuccess?.(role);
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    const redirectTo = `${window.location.origin}/auth?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      toast({
        title: "Unable to sign in",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  const copy = roleCopy[role];

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleOverlayClick = () => {
    handleClose();
  };

  return (
    <div
      id="role-auth-dialog"
      className="fixed inset-0 z-[60] flex items-start justify-center bg-background/70 px-4 backdrop-blur"
      style={{ paddingTop: "74px" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-auth-title"
      onClick={handleOverlayClick}
      onKeyDown={event => {
        if (event.key === "Escape") {
          event.stopPropagation();
          handleClose();
        }
      }}
      tabIndex={-1}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white/10 text-white shadow-[0_18px_60px_-30px_rgba(15,23,42,1)] backdrop-blur-2xl"
        onClick={event => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/70 transition hover:text-white"
          aria-label="Close login dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-28 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
        </div>

        <div className="relative space-y-6 p-8">
          <header className="space-y-2 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              {role === "teacher" ? "Teacher" : "Student"} access
            </div>
            <h2 id="role-auth-title" className="text-xl font-semibold">
              {copy.title}
            </h2>
            <p className="text-sm text-white/70">{copy.description}</p>
          </header>

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-auth-email" className="text-[11px] uppercase tracking-wide text-white/60">
                Email
              </Label>
              <Input
                id="role-auth-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={cn(
                  "h-11 rounded-2xl border-white/30 bg-white/10 text-sm text-white placeholder:text-white/40 backdrop-blur",
                  "focus-visible:ring-white/50"
                )}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-auth-password" className="text-[11px] uppercase tracking-wide text-white/60">
                Password
              </Label>
              <Input
                id="role-auth-password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
                className={cn(
                  "h-11 rounded-2xl border-white/30 bg-white/10 text-sm text-white placeholder:text-white/40 backdrop-blur",
                  "focus-visible:ring-white/50"
                )}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-11 w-full rounded-2xl bg-white/90 text-sm font-semibold text-slate-900 shadow-[0_12px_40px_-25px_rgba(226,232,240,0.95)] transition hover:bg-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] text-white/50">
              <span className="bg-white/5 px-3 py-1 rounded-full backdrop-blur">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            className="h-11 w-full rounded-2xl border-white/40 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Chrome className="mr-2 h-4 w-4" />
            {copy.googleLabel}
          </Button>
        </div>
      </div>

      <button
        type="button"
        className="absolute inset-0 -z-[1]"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
    </div>
  );
};

export default RoleAuthDialog;
