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
        className="max-w-2xl border-none bg-transparent p-0 shadow-none"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-950 text-white shadow-[0_30px_120px_-40px_rgba(15,23,42,1)]">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-cyan-500/40 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl" />
          </div>
          <div className="relative space-y-8 p-8 md:p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Teacher preview access
              </div>
              <h2 className="text-3xl font-semibold">Log in to your journey</h2>
              <p className="max-w-xl text-balance text-sm text-white/75">
                Access assignments, celebrate streaks, and follow teacher guidance the moment you sign in.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/5 p-4">
              <Avatar className="h-12 w-12 border border-white/30">
                <AvatarFallback className="bg-white/10 text-lg text-white">AJ</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-xs uppercase tracking-wide text-white/60">Previewing as</p>
                <p className="text-lg font-medium text-white">Amelia Johnson</p>
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
                    "h-12 rounded-2xl border-white/20 bg-white/10 text-base text-white placeholder:text-white/40",
                    "focus-visible:ring-white/40"
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
                    "h-12 rounded-2xl border-white/20 bg-white/10 text-base text-white placeholder:text-white/40",
                    "focus-visible:ring-white/40"
                  )}
                />
              </div>
            </div>

            <div className="space-y-3 text-sm text-white/75">
              <p className="font-medium text-white">What you'll unlock</p>
              <ul className="grid gap-2 text-left sm:grid-cols-2">
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
                className="h-12 w-full rounded-2xl bg-white/95 text-base font-semibold text-slate-900 shadow-[0_10px_40px_-20px_rgba(226,232,240,0.95)] hover:bg-white"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Log in to my journey
              </Button>
              <p className="text-center text-xs text-white/60">
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
