import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

export type DashboardQuickAction =
  | "ask-question"
  | "post-blog"
  | "new-lesson-plan"
  | "new-curriculum"
  | "new-class";

export interface DashboardHeaderNameParts {
  honorific?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface DashboardHeaderProps {
  nameParts: DashboardHeaderNameParts;
  displayName?: string | null;
  avatarUrl?: string | null;
  hasCurriculumContext: boolean;
  onQuickAction: (action: DashboardQuickAction) => void;
}

export function DashboardHeader({
  nameParts,
  displayName,
  avatarUrl,
  hasCurriculumContext,
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
        <TooltipProvider>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2 lg:grid-cols-5">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    onClick={() => onQuickAction("new-lesson-plan")}
                    className="w-full justify-center"
                    aria-label={t.dashboard.quickActions.newLessonPlan}
                    disabled={!hasCurriculumContext}
                  >
                    {t.dashboard.quickActions.newLessonPlan}
                  </Button>
                </span>
              </TooltipTrigger>
              {!hasCurriculumContext ? (
                <TooltipContent side="bottom">
                  {t.dashboard.quickActions.newLessonPlanTooltip}
                </TooltipContent>
              ) : null}
            </Tooltip>
            <Button
              onClick={() => onQuickAction("new-curriculum")}
              className="w-full justify-center"
              aria-label={t.dashboard.quickActions.newCurriculum}
            >
              {t.dashboard.quickActions.newCurriculum}
            </Button>
            <Button
              onClick={() => onQuickAction("new-class")}
              className="w-full justify-center"
              variant="secondary"
              aria-label={t.dashboard.quickActions.newClass}
            >
              {t.dashboard.quickActions.newClass}
            </Button>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
