import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export type DashboardQuickAction =
  | "ask-question"
  | "post-blog";

export interface DashboardHeaderNameParts {
  honorific?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface DashboardHeaderProps {
  nameParts: DashboardHeaderNameParts;
  displayName?: string | null;
  avatarUrl?: string | null;
  onQuickAction: (action: DashboardQuickAction) => void;
}

export function DashboardHeader({
  nameParts,
  displayName,
  avatarUrl,
  onQuickAction,
}: DashboardHeaderProps) {
  const { t } = useLanguage();

  const honorific = nameParts.honorific?.trim() ?? null;
  const firstName = nameParts.firstName?.trim() ?? null;
  const lastName = nameParts.lastName?.trim() ?? null;

  const greetingName = honorific && lastName
    ? `${honorific} ${lastName}`
    : firstName
      ? `Mr ${firstName}`
      : t.dashboard.fallbackDisplayName;

  const fallbackInitial = (lastName ?? firstName ?? displayName ?? t.dashboard.fallbackDisplayName)
    ?.charAt(0)
    ?.toUpperCase() || "T";

  return (
    <header className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 px-8 py-6 text-white shadow-[0_25px_80px_-20px_rgba(15,23,42,0.75)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-70" />
      <div className="absolute inset-y-0 right-[-15%] hidden w-[45%] rounded-full bg-gradient-to-br from-cyan-400/30 via-transparent to-transparent blur-3xl lg:block" />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <Avatar className="h-14 w-14 border border-white/40 bg-white/10">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={greetingName} /> : null}
            <AvatarFallback className="bg-white/10 text-lg font-semibold text-white">
              {fallbackInitial}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              {t.dashboard.header.title}
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              {t.dashboard.header.greeting.replace("{name}", greetingName ?? t.dashboard.fallbackDisplayName)}
            </h1>
            <p className="max-w-xl text-sm text-white/70">
              {t.dashboard.header.subtitle}
            </p>
          </div>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
          <Button
            onClick={() => onQuickAction("ask-question")}
            variant="outline"
            className="h-12 w-full justify-center rounded-2xl border-white/40 bg-white/10 text-sm font-semibold text-white/90 transition hover:border-white/60 hover:bg-white/20"
            aria-label={t.dashboard.quickActions.askQuestion}
          >
            {t.dashboard.quickActions.askQuestion}
          </Button>
          <Button
            onClick={() => onQuickAction("post-blog")}
            variant="outline"
            className="h-12 w-full justify-center rounded-2xl border-white/40 bg-white/10 text-sm font-semibold text-white/90 transition hover:border-white/60 hover:bg-white/20"
            aria-label={t.dashboard.quickActions.postBlog}
          >
            {t.dashboard.quickActions.postBlog}
          </Button>
        </div>
      </div>
    </header>
  );
}
