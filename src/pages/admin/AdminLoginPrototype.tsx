import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { grantPrototypeAdminSession, hasPrototypeAdminSession } from "@/hooks/useAdminGuard";

export function AdminLoginPrototype() {
  const navigate = useNavigate();

  useEffect(() => {
    if (hasPrototypeAdminSession()) {
      navigate("/admin", { replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      const focusable = document.querySelector<HTMLInputElement>("input[name='email']");
      focusable?.focus();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  const handlePrototypeLogin = () => {
    grantPrototypeAdminSession();
    navigate("/admin", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/5 bg-white/5 backdrop-blur" />
      </div>

      <Card className="relative w-full max-w-md border-white/10 bg-white/10 text-white backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">SchoolTech Hub Admin</CardTitle>
          <CardDescription className="text-sm text-white/60">
            Prototype access panel for the refreshed console experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wide text-white/70">
              Work Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="team@schooltechub.com"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-code" className="text-xs uppercase tracking-wide text-white/70">
              Access Code
            </Label>
            <Input
              id="access-code"
              name="access-code"
              type="text"
              placeholder="Prototype-2024"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
            />
          </div>
          <Button
            type="button"
            onClick={handlePrototypeLogin}
            className="w-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:from-cyan-300 hover:to-blue-400"
          >
            Enter Prototype Console
          </Button>
          <p className="text-center text-xs text-white/50">
            This click-through unlocks the admin prototype experience — authentication is bypassed for preview
            purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminLoginPrototype;
