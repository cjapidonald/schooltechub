import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, TrendingUp, Notebook, Trophy, CalendarDays, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TeacherAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const featureItems: Array<{ icon: ReactNode; label: string }> = [
  {
    icon: <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />,
    label: "Guided skill growth updates",
  },
  {
    icon: <Notebook className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />,
    label: "Real-time homework tracking",
  },
  {
    icon: <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />,
    label: "Focus highlights from teachers",
  },
  {
    icon: <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />,
    label: "Upcoming sessions overview",
  },
];

export const TeacherAuthDialog = ({ open, onOpenChange, onConfirm }: TeacherAuthDialogProps) => {
  if (!open) {
    return null;
  }

  return (
    <section
      id="teacher-auth-dialog"
      role="dialog"
      aria-modal="false"
      aria-labelledby="teacher-auth-heading"
      className="mx-auto mt-10 w-full max-w-md px-4 pb-12"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-white/10 text-white shadow-[0_18px_60px_-30px_rgba(15,23,42,1)] backdrop-blur-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition hover:text-white"
          aria-label="Close teacher preview"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-16 -top-24 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="absolute -bottom-20 -right-24 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
        </div>
        <div className="relative space-y-5 p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Teacher preview access
            </div>
            <h2 id="teacher-auth-heading" className="text-xl font-semibold">
              Log in to your journey
            </h2>
            <p className="text-balance text-xs text-white/75">
              Access assignments, celebrate streaks, and follow teacher guidance the moment you sign in.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-[18px] border border-white/30 bg-white/10 p-3.5 backdrop-blur">
            <Avatar className="h-9 w-9 border border-white/30">
              <AvatarFallback className="bg-white/10 text-sm font-medium text-white">AJ</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">Previewing as</p>
              <p className="text-sm font-medium text-white">Amelia Johnson</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="teacher-email" className="text-[11px] uppercase tracking-wide text-white/60">
                School email
              </Label>
              <Input
                id="teacher-email"
                type="email"
                placeholder="you@studenthub.com"
                className={cn(
                  "h-10 rounded-2xl border-white/30 bg-white/10 text-sm text-white placeholder:text-white/40 backdrop-blur",
                  "focus-visible:ring-white/50"
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher-code" className="text-[11px] uppercase tracking-wide text-white/60">
                Access code
              </Label>
              <Input
                id="teacher-code"
                type="text"
                placeholder="6-digit code"
                className={cn(
                  "h-10 rounded-2xl border-white/30 bg-white/10 text-sm text-white placeholder:text-white/40 backdrop-blur",
                  "focus-visible:ring-white/50"
                )}
              />
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-white/75">
            <p className="text-sm font-semibold text-white">What you'll unlock</p>
            <ul className="grid gap-2 text-left sm:grid-cols-2">
              {featureItems.map((item) => (
                <li key={item.label} className="flex items-start gap-2">
                  {item.icon}
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2.5">
            <Button
              type="button"
              size="lg"
              onClick={onConfirm}
              className="h-10 w-full rounded-2xl bg-white/90 text-sm font-semibold text-slate-900 shadow-[0_12px_40px_-25px_rgba(226,232,240,0.95)] transition hover:bg-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log in to my journey
            </Button>
            <p className="text-center text-[10px] text-white/60">
              Need help? Ask your teacher to resend the code or reset your password.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeacherAuthDialog;
