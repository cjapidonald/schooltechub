import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { SettingsPanel } from "./components/SettingsPanel";

const dashboardTabs = [
  { value: "overview", label: "Overview" },
  { value: "settings", label: "Settings" },
  { value: "classes", label: "Classes" },
  { value: "lessonPlans", label: "Lesson Plans" },
  { value: "notifications", label: "Notifications" },
  { value: "savedPosts", label: "Saved Posts" },
  { value: "research", label: "My Research (Applications & Submissions)" },
] as const;

type DashboardTabValue = (typeof dashboardTabs)[number]["value"];
type NonOverviewTab = Exclude<DashboardTabValue, "overview">;

type TabCounts = Record<NonOverviewTab, number>;

const defaultCounts: TabCounts = {
  settings: 3,
  classes: 2,
  lessonPlans: 6,
  notifications: 5,
  savedPosts: 4,
  research: 1,
};

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
  const { language } = useLanguage();
  const [counts, setCounts] = useState<TabCounts | null>(null);

  useEffect(() => {
    if (!user) return;

    const timeout = setTimeout(() => {
      setCounts(defaultCounts);
    }, 300);

    return () => clearTimeout(timeout);
  }, [user]);

  const summaryTabs = useMemo(
    () =>
      dashboardTabs
        .filter(tab => tab.value !== "overview")
        .map(tab => ({ value: tab.value as NonOverviewTab, label: tab.label })),
    []
  );

  const greetingName = useMemo(() => {
    if (!user) return "";
    const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    if (fullName.trim()) {
      return fullName.trim().split(" ")[0];
    }
    return user.email ?? "there";
  }, [user]);

  if (loading) {
    return loadingSkeleton;
  }

  if (!user) {
    return <Navigate to={getLocalizedPath("/auth", language)} replace />;
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO
        title="My Dashboard | SchoolTech Hub"
        description="Quickly review your SchoolTech Hub activity and jump into settings, classes, lesson plans, and more."
        canonicalUrl="https://schooltechhub.com/account"
      />
      <div className="container space-y-8 py-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {greetingName}.</p>
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-2">
            {dashboardTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1 whitespace-nowrap">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">At a glance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Review your latest activity across the SchoolTech Hub community.
                </p>
              </CardContent>
            </Card>
            {counts ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {summaryTabs.map(tab => (
                  <Card key={tab.value}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">{tab.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{counts?.[tab.value] ?? 0}</div>
                      <p className="text-sm text-muted-foreground">Items awaiting your attention</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="settings">
            <SettingsPanel user={user} />
          </TabsContent>
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track the classes you are part of and monitor upcoming sessions. Class rosters and schedules will appear here.
                </p>
              </CardContent>
            </Card>
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
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Stay informed about updates, mentions, and community replies. Notification filters and delivery preferences
                  will live here.
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
          <TabsContent value="research">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">My Research</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor your applications and submissions in progress. This space will highlight deadlines, statuses, and any
                  feedback that requires your attention.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountDashboard;
