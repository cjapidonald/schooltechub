import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  Bookmark,
  Building2,
  GraduationCap,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  SquarePen,
} from "lucide-react";
import { format, isValid, parse, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";

import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassCreateDialog } from "@/components/classes/ClassCreateDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useToast } from "@/hooks/use-toast";
import { listMyClasses } from "@/lib/classes";
import {
  createProfileImageSignedUrl,
  resolveAvatarReference,
  isHttpUrl,
} from "@/lib/avatar";
import { supabase } from "@/integrations/supabase/client";
import { SettingsPanel } from "./components/SettingsPanel";
import { UpcomingLessonsCard } from "./components/UpcomingLessonsCard";

const dashboardTabValues = [
  "overview",
  "classes",
  "lessonPlans",
  "savedPosts",
  "activity",
  "security",
  "settings",
  "research",
] as const;

type DashboardTabValue = (typeof dashboardTabValues)[number];

const summaryTabValues = [
  "classes",
  "lessonPlans",
  "savedPosts",
  "activity",
  "security",
  "settings",
] as const;

type SummaryTabValue = (typeof summaryTabValues)[number];

const defaultCounts: Record<SummaryTabValue, number> = {
  classes: 2,
  lessonPlans: 6,
  savedPosts: 4,
  activity: 5,
  security: 2,
  settings: 3,
};

const summaryTabDetails: Record<SummaryTabValue, { icon: LucideIcon; label: string }> = {
  classes: { icon: GraduationCap, label: "Classes awaiting updates" },
  lessonPlans: { icon: SquarePen, label: "Lesson plans needing attention" },
  savedPosts: { icon: Bookmark, label: "Saved posts to revisit" },
  activity: { icon: Activity, label: "Recent interactions to review" },
  security: { icon: ShieldCheck, label: "Security checks to complete" },
  settings: { icon: Settings, label: "Review your preferences" },
};

const RESEARCH_NOTIFICATION_KEY = "research_notifications_opt_in";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY = /^\d{2}:\d{2}/;

function isDashboardTabValue(value: string | null): value is DashboardTabValue {
  return value !== null && (dashboardTabValues as readonly string[]).includes(value);
}

function parseDateValue(value: string): Date | null {
  const trimmed = value.trim();

  if (ISO_DATE_ONLY.test(trimmed)) {
    const parsed = parse(trimmed, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : null;
  }

  try {
    const parsed = parseISO(trimmed);
    return isValid(parsed) ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function formatDateForDisplay(value: string | null): string {
  if (!value) {
    return "—";
  }

  const parsed = parseDateValue(value);
  return parsed ? format(parsed, "PPP") : value;
}

function formatTimeForDisplay(value: string | null): string {
  if (!value) {
    return "—";
  }

  const trimmed = value.trim();

  if (TIME_ONLY.test(trimmed)) {
    const parsed = parse(trimmed, "HH:mm", new Date());
    return isValid(parsed) ? format(parsed, "p") : trimmed;
  }

  const parsed = parseDateValue(trimmed);
  return parsed ? format(parsed, "p") : trimmed;
}

const loadingSkeleton = (
  <div className="container space-y-6 py-10">
    <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  </div>
);

const AccountDashboard = () => {
  const { user, loading } = useRequireAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [counts, setCounts] = useState<Record<SummaryTabValue, number> | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { fullName: profileFullName, schoolName, schoolLogoUrl } = useMyProfile();
  const [avatarReference, setAvatarReference] = useState<string | null>(null);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null);
  const [isResearchNotificationsEnabled, setIsResearchNotificationsEnabled] = useState(false);
  const [isResearchToggleSaving, setIsResearchToggleSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTabValue>(() => {
    const initial = searchParams.get("tab");
    return isDashboardTabValue(initial) ? initial : "overview";
  });

  const classesQuery = useQuery({
    queryKey: ["my-classes"],
    queryFn: () => listMyClasses(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user) return;

    const timeout = setTimeout(() => {
      setCounts(defaultCounts);
    }, 300);

    return () => clearTimeout(timeout);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsResearchNotificationsEnabled(false);
      return;
    }

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const stored = metadata[RESEARCH_NOTIFICATION_KEY];
    const normalized =
      typeof stored === "boolean"
        ? stored
        : typeof stored === "string"
        ? stored.toLowerCase() === "true"
        : false;

    setIsResearchNotificationsEnabled(normalized);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAvatarReference(null);
      setResolvedAvatarUrl(null);
      return;
    }

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const { reference, url } = resolveAvatarReference(metadata);

    setAvatarReference(reference);
    setResolvedAvatarUrl(url);
  }, [user]);

  useEffect(() => {
    const param = searchParams.get("tab");
    const normalized = isDashboardTabValue(param) ? param : "overview";

    if (normalized !== activeTab) {
      setActiveTab(normalized);
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    if (!avatarReference || isHttpUrl(avatarReference)) {
      return;
    }

    let isCancelled = false;

    const loadSignedUrl = async () => {
      try {
        const signedUrl = await createProfileImageSignedUrl(avatarReference);
        if (!isCancelled) {
          setResolvedAvatarUrl(signedUrl);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to resolve dashboard avatar", error);
          setResolvedAvatarUrl(null);
        }
      }
    };

    void loadSignedUrl();

    return () => {
      isCancelled = true;
    };
  }, [avatarReference]);

  const dashboardTabs = useMemo(
    () => {
      const labels = (t.account.tabs ?? {}) as Record<string, string>;
      return dashboardTabValues.map(value => ({
        value,
        label: labels[value] ?? value,
      }));
    },
    [t.account.tabs],
  );

  const summaryTabs = useMemo(
    () => {
      const labels = (t.account.tabs ?? {}) as Record<string, string>;
      return summaryTabValues.map(value => ({
        value,
        label: labels[value] ?? value,
      }));
    },
    [t.account.tabs],
  );

  const handleTabChange = (value: string) => {
    if (!isDashboardTabValue(value)) {
      return;
    }

    const nextValue = value as DashboardTabValue;

    if (nextValue !== activeTab) {
      setActiveTab(nextValue);
    }

    const params = new URLSearchParams(searchParams);

    if (nextValue === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", nextValue);
    }

    setSearchParams(params, { replace: true });
  };

  const greetingName = useMemo(() => {
    if (!user) return "";
    const metadataName =
      typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    const resolvedName = (profileFullName ?? metadataName).trim();
    if (resolvedName) {
      return resolvedName.split(" ")[0];
    }
    return user.email ?? "there";
  }, [profileFullName, user]);

  const roleDisplay = useMemo(() => {
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const metadataRole = typeof metadata.role === "string" ? metadata.role : null;

    const appMetadata = (user?.app_metadata ?? {}) as Record<string, unknown>;
    const appRole = typeof appMetadata.role === "string" ? (appMetadata.role as string) : null;

    const authRole = typeof user?.role === "string" ? user.role : null;
    const selectedRole = metadataRole ?? appRole ?? authRole;

    if (!selectedRole) {
      return t.account.profile.rolePlaceholder;
    }

    const normalized = selectedRole.toString().trim();
    const roleTranslations = (t.account.profile.roles ?? {}) as Record<string, string>;
    const match = Object.entries(roleTranslations).find(
      ([key]) => key.toLowerCase() === normalized.toLowerCase()
    );

    if (match) {
      return match[1];
    }

    return normalized
      .split(/[\s_]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, [t.account.profile.rolePlaceholder, t.account.profile.roles, user]);

  const handleResearchNotificationChange = async (checked: boolean) => {
    if (!user || isResearchToggleSaving) {
      return;
    }

    const previous = isResearchNotificationsEnabled;
    setIsResearchNotificationsEnabled(checked);
    setIsResearchToggleSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { [RESEARCH_NOTIFICATION_KEY]: checked },
      });

      if (error) {
        throw error;
      }

      toast({
        title: checked
          ? t.account.research.notificationsEnabledTitle
          : t.account.research.notificationsDisabledTitle,
        description: checked
          ? t.account.research.notificationsEnabledDescription
          : t.account.research.notificationsDisabledDescription,
      });
    } catch (error) {
      setIsResearchNotificationsEnabled(previous);
      toast({
        title: t.account.research.errorTitle,
        description:
          error instanceof Error
            ? error.message
            : t.account.research.errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsResearchToggleSaving(false);
    }
  };

  if (loading) {
    return loadingSkeleton;
  }

  if (!user) {
    return <Navigate to={getLocalizedPath("/auth", language)} replace />;
  }

  const avatarUrl = resolvedAvatarUrl;

  const fallbackName = "Mr Donald";
  const fullDisplayName =
    profileFullName?.trim() ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "") ||
    greetingName ||
    fallbackName;
  const welcomeDisplayName = fullDisplayName || fallbackName;
  const primaryInitial = welcomeDisplayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO
        title="My Dashboard | SchoolTech Hub"
        description="Quickly review your SchoolTech Hub activity and jump into settings, classes, lesson plans, and more."
        canonicalUrl="https://schooltechhub.com/account"
      />
      <div className="container space-y-8 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.account.overview.title}</h1>
          <p className="text-muted-foreground">{t.account.overview.subtitle}</p>
        </div>
        <Card className="border border-primary/30 bg-background/80 shadow-[0_0_35px_hsl(var(--glow-primary)/0.2)]">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/40 shadow-[0_0_25px_hsl(var(--glow-primary)/0.35)]">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={`${welcomeDisplayName} avatar`} />
                  ) : (
                    <AvatarFallback className="text-2xl font-semibold text-primary">
                      {primaryInitial || "S"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Welcome back</p>
                  <h2 className="text-2xl font-semibold text-foreground">{welcomeDisplayName}</h2>
                  <p className="text-sm text-muted-foreground">{roleDisplay}</p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--glow-primary)/0.25)]">
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t.account.school.nameLabel}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {schoolName?.trim() || t.account.school.namePlaceholder}
                      </p>
                    </div>
                  </div>
                  {schoolLogoUrl ? (
                    <div className="mt-4 flex items-center gap-3 rounded-md border border-border/50 bg-background/80 p-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-primary/30 bg-white">
                        <img
                          src={schoolLogoUrl}
                          alt={schoolName ? `${schoolName} logo` : t.account.school.logoAlt}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Official logo</p>
                        <p className="text-sm font-medium text-foreground">
                          {schoolName?.trim() || t.account.school.namePlaceholder}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.account.profile.roleLabel}
                  </p>
                  <p className="text-sm font-medium text-foreground">{roleDisplay}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  We&apos;re glad to see you, {greetingName || fallbackName}.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-xs lg:flex-col">
              <Button asChild size="sm" variant="secondary">
                <Link to={getLocalizedPath("/lesson-builder", language)}>{t.nav.builder}</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleTabChange("classes")}>
                {t.account.tabs.classes}
              </Button>
              <Button asChild size="sm">
                <Link to={getLocalizedPath("/blog/new", language)}>
                  {t.account.overview.ctas.postBlog}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={getLocalizedPath("/forum/new", language)}>
                  {t.account.overview.ctas.askQuestion}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-2 border-none bg-transparent p-0 shadow-none h-auto backdrop-blur-0">
            {dashboardTabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 whitespace-nowrap"
                disabled={tab.value === "research"}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border border-primary/30 bg-background/80 shadow-[0_0_30px_hsl(var(--glow-primary)/0.15)]">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold">At a glance</CardTitle>
                      <CardDescription>
                        Review your latest activity across the SchoolTech Hub community.
                      </CardDescription>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_25px_hsl(var(--glow-primary)/0.2)]">
                      <Sparkles className="h-5 w-5 animate-pulse-glow" aria-hidden="true" />
                    </span>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Stay informed with a quick overview of what&apos;s new since your last visit.
                    </p>
                  </CardContent>
                </Card>
                <UpcomingLessonsCard isEnabled={Boolean(user)} />
                <Card className="border border-primary/30 bg-background/80 shadow-[0_0_30px_hsl(var(--glow-primary)/0.15)]">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold">
                        {t.account.research.cardTitle}
                      </CardTitle>
                      <CardDescription>{t.account.research.cardDescription}</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                      {t.account.research.badge}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t.account.research.cardBody}
                    </p>
                    <div className="flex items-start justify-between gap-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {t.account.research.toggleLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.account.research.toggleDescription}
                        </p>
                      </div>
                      <Switch
                        checked={isResearchNotificationsEnabled}
                        onCheckedChange={handleResearchNotificationChange}
                        disabled={isResearchToggleSaving}
                        aria-label={t.account.research.toggleAria}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              {counts ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {summaryTabs.map(tab => {
                    const details = summaryTabDetails[tab.value];
                    const Icon = details.icon;

                    return (
                      <Card
                        key={tab.value}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open ${tab.label}`}
                        onClick={() => handleTabChange(tab.value)}
                        onKeyDown={event => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleTabChange(tab.value);
                          }
                        }}
                        className="border border-primary/20 bg-background/80 shadow-[0_0_25px_hsl(var(--glow-primary)/0.12)] transition hover:border-primary/40 hover:shadow-[0_0_35px_hsl(var(--glow-primary)/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                      >
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{tab.label}</CardTitle>
                            <p className="text-xs text-muted-foreground">{details.label}</p>
                          </div>
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--glow-primary)/0.2)]">
                            <Icon className="h-4 w-4 animate-pulse-glow" aria-hidden="true" />
                          </span>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{counts?.[tab.value] ?? 0}</div>
                          <p className="text-sm text-muted-foreground">Items awaiting your attention</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-md bg-muted/60" />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="classes">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">Classes</CardTitle>
                  <CardDescription>
                    Track the classes you lead and keep their key details up to date.
                  </CardDescription>
                </div>
                <Button className="w-full sm:w-auto" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </CardHeader>
              <CardContent>
                {classesQuery.isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : classesQuery.isError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to load classes</AlertTitle>
                    <AlertDescription>
                      {classesQuery.error instanceof Error
                        ? classesQuery.error.message
                        : "Please try again later."}
                      <div className="mt-4">
                        <Button variant="outline" onClick={() => classesQuery.refetch()} size="sm">
                          Try again
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : classesQuery.data && classesQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    {classesQuery.data.map(classItem => (
                      <Link
                        key={classItem.id}
                        to={getLocalizedPath(`/account/classes/${classItem.id}`, language)}
                        className="block rounded-lg border bg-card p-4 shadow-sm transition hover:border-primary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">{classItem.title}</h3>
                            {classItem.summary && (
                              <p className="mt-1 text-sm text-muted-foreground">{classItem.summary}</p>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium text-foreground">Starts:</span>{" "}
                              {formatDateForDisplay(classItem.startDate)}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Ends:</span>{" "}
                              {formatDateForDisplay(classItem.endDate)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                          <div>
                            <p className="text-muted-foreground">Subject</p>
                            <p className="font-medium text-foreground">{classItem.subject ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Stage</p>
                            <p className="font-medium text-foreground">{classItem.stage ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Meeting schedule</p>
                            <p className="font-medium text-foreground">{formatTimeForDisplay(classItem.meetingSchedule)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Max capacity</p>
                            <p className="font-medium text-foreground">
                              {typeof classItem.maxCapacity === "number" ? classItem.maxCapacity : "—"}
                            </p>
                          </div>
                        </div>
                        {classItem.meetingLink && (
                          <p className="mt-4 text-sm">
                            <a
                              href={classItem.meetingLink}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-primary underline"
                              onClick={event => event.stopPropagation()}
                              onMouseDown={event => event.stopPropagation()}
                            >
                              Join meeting
                            </a>
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">You haven't created any classes yet.</p>
                    <p className="mt-2">Use the Add Class button above to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <ClassCreateDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onCreated={() => {
                queryClient.invalidateQueries({ queryKey: ["my-classes"] });
              }}
            />
          </TabsContent>
          <TabsContent value="lessonPlans">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Lesson Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Review drafts, published plans, and collaborative projects. Soon you’ll be able to jump directly into editing
                  from this tab.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="savedPosts">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Saved Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep track of the blog posts and discussions you’ve bookmarked for later. Quick actions for sharing and
                  organizing will be added here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{t.account.activity.title}</CardTitle>
                <CardDescription>{t.account.activity.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">{t.account.activity.comments}</p>
                    <p className="text-2xl font-semibold text-foreground">{counts?.activity ?? 0}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">{t.account.activity.posts}</p>
                    <p className="text-2xl font-semibold text-foreground">{counts?.savedPosts ?? 0}</p>
                  </div>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  {t.account.activity.lastLogin}:{" "}
                  {user.last_sign_in_at
                    ? format(parseISO(user.last_sign_in_at), "PPP p")
                    : t.account.activity.neverLoggedIn}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{t.account.security.title}</CardTitle>
                <CardDescription>{t.account.security.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t.account.securityTips.description}</p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
                  {(t.account.securityTips.tips ?? []).map((tip: string, index: number) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
                <div>
                  <Button size="sm" variant="outline" onClick={() => handleTabChange("settings")}>
                    {t.account.tabs.settings}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <SettingsPanel user={user} />
          </TabsContent>
          <TabsContent value="research">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-semibold">{t.account.research.tabTitle}</CardTitle>
                <CardDescription>{t.account.research.tabDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                    {t.account.research.badge}
                  </Badge>
                  <span>{t.account.research.tabHelper}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountDashboard;
