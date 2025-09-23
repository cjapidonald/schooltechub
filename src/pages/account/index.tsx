import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassCreateDialog } from "@/components/classes/ClassCreateDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { listMyClasses } from "@/lib/classes";
import { SettingsPanel } from "./components/SettingsPanel";
import { UpcomingLessonsCard } from "./components/UpcomingLessonsCard";

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
  const queryClient = useQueryClient();
  const [counts, setCounts] = useState<TabCounts | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
            <div className="grid gap-4 lg:grid-cols-2">
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
              <UpcomingLessonsCard isEnabled={Boolean(user)} />
            </div>
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
                      <div key={classItem.id} className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">{classItem.title}</h3>
                            {classItem.summary && (
                              <p className="mt-1 text-sm text-muted-foreground">{classItem.summary}</p>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium text-foreground">Starts:</span> {classItem.startDate ?? "—"}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Ends:</span> {classItem.endDate ?? "—"}
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
                            <p className="font-medium text-foreground">{classItem.meetingSchedule ?? "—"}</p>
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
                            >
                              Join meeting
                            </a>
                          </p>
                        )}
                      </div>
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
