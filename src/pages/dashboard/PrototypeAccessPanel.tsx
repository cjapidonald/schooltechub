import { Sparkles, LogIn, ClipboardList, Users, BarChart3 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const TEACHER_PORTAL_FEATURES = [
  { id: "planner", icon: ClipboardList, label: "Plan technology-rich lessons" },
  { id: "students", icon: Users, label: "Monitor student progress snapshots" },
  { id: "insights", icon: Sparkles, label: "Surface AI-powered coaching prompts" },
  { id: "reports", icon: BarChart3, label: "Assemble reports in seconds" },
] as const;

interface PrototypeAccessPanelProps {
  onEnter: () => void;
  teacherPreviewName: string;
  teacherPreviewClassLabel: string;
}

export function PrototypeAccessPanel({
  onEnter,
  teacherPreviewName,
  teacherPreviewClassLabel,
}: PrototypeAccessPanelProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-[-10rem] h-[18rem] w-[18rem] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-24 md:px-8">
        <Card className="border-white/15 bg-white/10 text-white shadow-[0_25px_80px_-20px_rgba(15,23,42,0.75)] backdrop-blur-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Teacher journey portal
            </div>
            <CardTitle className="text-3xl font-semibold text-white md:text-4xl">
              Log in to your workspace
            </CardTitle>
            <CardDescription className="text-white/70">
              Preview lesson planning, student analytics, and reporting workflows instantly—no credentials required for this prototype.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-left">
              <p className="text-sm text-white/70">Previewing workspace for</p>
              <p className="text-lg font-medium text-white">{teacherPreviewName}</p>
              <p className="text-xs uppercase tracking-wide text-white/50">{teacherPreviewClassLabel}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="teacher-email" className="text-xs uppercase tracking-wide text-white/60">
                  School email
                </Label>
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder="you@schooltechhub.com"
                  className="h-12 rounded-2xl border-white/20 bg-white/10 text-base text-white placeholder:text-white/40 focus-visible:ring-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-code" className="text-xs uppercase tracking-wide text-white/60">
                  Workspace code
                </Label>
                <Input
                  id="teacher-code"
                  type="text"
                  placeholder="Prototype access"
                  className="h-12 rounded-2xl border-white/20 bg-white/10 text-base text-white placeholder:text-white/40 focus-visible:ring-white/40"
                />
              </div>
            </div>
            <div className="space-y-3 text-sm text-white/70">
              <p className="font-medium text-white">What you'll explore</p>
              <ul className="grid gap-2 text-left sm:grid-cols-2">
                {TEACHER_PORTAL_FEATURES.map(({ id, icon: Icon, label }) => (
                  <li key={id} className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              type="button"
              className="h-12 w-full rounded-2xl bg-white/90 text-base font-semibold text-slate-900 shadow-[0_10px_40px_-20px_rgba(226,232,240,0.95)] hover:bg-white"
              size="lg"
              onClick={onEnter}
            >
              <LogIn className="mr-2 h-5 w-5" />
              Log in to my workspace
            </Button>
            <p className="text-center text-xs text-white/60">
              Prototype note: Selecting “Log in” instantly reveals the teacher dashboard experience.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
