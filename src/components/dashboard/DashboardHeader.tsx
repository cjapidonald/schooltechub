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

  const normalizedDisplayName = displayName?.trim() ?? "";
  const honorific = nameParts.honorific?.trim() ?? "";
  const firstName = nameParts.firstName?.trim() ?? "";
  const lastName = nameParts.lastName?.trim() ?? "";

  const combinedName = [firstName, lastName].filter(Boolean).join(" ");
  const greetingName =
    normalizedDisplayName ||
    (honorific && lastName ? `${honorific} ${lastName}` : "") ||
    combinedName ||
    t.dashboard.fallbackDisplayName;

  const fallbackInitial = (greetingName || t.dashboard.fallbackDisplayName)
    .charAt(0)
    .toUpperCase();

  return (
    <header className="rounded-xl border bg-card px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={greetingName} /> : null}
            <AvatarFallback>{fallbackInitial}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t.dashboard.header.title}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">
              {t.dashboard.header.greeting.replace("{name}", greetingName ?? t.dashboard.fallbackDisplayName)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.dashboard.header.subtitle}
            </p>
          </div>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2 lg:grid-cols-2">
          <Button
            onClick={() => onQuickAction("ask-question")}
            variant="outline"
            className="w-full justify-center"
            aria-label={t.dashboard.quickActions.askQuestion}
          >
            {t.dashboard.quickActions.askQuestion}
          </Button>
          <Button
            onClick={() => onQuickAction("post-blog")}
            variant="outline"
            className="w-full justify-center"
            aria-label={t.dashboard.quickActions.postBlog}
          >
            {t.dashboard.quickActions.postBlog}
          </Button>
        </div>
      </div>
    </header>
  );
}
