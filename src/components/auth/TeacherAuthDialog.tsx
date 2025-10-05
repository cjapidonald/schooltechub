import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, TrendingUp, Notebook, Trophy, CalendarDays, LogIn } from "lucide-react";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="teacher-auth-dialog"
        className="left-1/2 top-[calc(4rem+10px)] w-full max-w-xl -translate-x-1/2 translate-y-0 border-none bg-transparent p-0 shadow-none"
      >
        <div className="relative overflow-hidden rounded-[26px] border border-white/30 bg-white/10 text-white shadow-[0_20px_80px_-40px_rgba(15,23,42,1)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -left-24 -top-32 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
            <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-purple-400/25 blur-3xl" />
          </div>
          <div className="relative space-y-6 p-6 md:space-y-7 md:p-10">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Teacher preview access
              </div>
              <h2 className="text-2xl font-semibold md:text-[26px]">Log in to your journey</h2>
              <p className="max-w-lg text-balance text-sm text-white/75">
                Access assignments, celebrate streaks, and follow teacher guidance the moment you sign in.
              </p>
            </div>

            <div className="flex items-center gap-3.5 rounded-[22px] border border-white/30 bg-white/10 p-4 backdrop-blur">
              <Avatar className="h-10 w-10 border border-white/30">
                <AvatarFallback className="bg-white/10 text-base font-medium text-white">AJ</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Previewing as</p>
                <p className="text-base font-medium text-white">Amelia Johnson</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="teacher-email" className="text-xs uppercase tracking-wide text-white/60">
                  School email
                </Label>
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder="you@studenthub.com"
                  className={cn(
                    "h-11 rounded-2xl border-white/30 bg-white/10 text-sm text-white placeholder:text-white/40 backdrop-blur",
                    "focus-visible:ring-white/50"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-code" className="text-xs uppercase tracking-wide text-white/60">
                  Access code
                </Label>
                <Input
                  id="teacher-code"
                  type="text"
                  placeholder="6-digit code"
                  className={cn(
                    "h-11 rounded-2xl border-white/30 bg-white/10 text-sm text-white placeholder:text-white/40 backdrop-blur",
                    "focus-visible:ring-white/50"
                  )}
                />
              </div>
            </div>

            <div className="space-y-3 text-sm text-white/75">
              <p className="text-sm font-semibold text-white">What you'll unlock</p>
              <ul className="grid gap-2 text-left text-xs sm:grid-cols-2">
                {featureItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-2">
                    {item.icon}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                size="lg"
                onClick={onConfirm}
                className="h-11 w-full rounded-2xl bg-white/90 text-sm font-semibold text-slate-900 shadow-[0_15px_50px_-35px_rgba(226,232,240,0.95)] transition hover:bg-white"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Log in to my journey
              </Button>
              <p className="text-center text-[11px] text-white/60">
                Need help? Ask your teacher to resend the code or reset your password.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherAuthDialog;
