import { Fragment } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarPlus,
  GraduationCap,
  Layers3,
  MessageCircle,
  NotebookPen,
  PencilLine,
  PlusCircle,
  Sparkles,
} from "lucide-react";

import MouseGlowEffect from "@/components/MouseGlowEffect";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const quickActions = [
  {
    title: "Create a lesson plan",
    description: "Draft standards-aligned lessons and let the workspace manage materials for you.",
    icon: PencilLine,
    action: "Open lesson planner",
    link: (language: string) => getLocalizedPath("/account?tab=lessonPlans", language),
  },
  {
    title: "Schedule it on the calendar",
    description: "Add a date and the plan appears instantly on your teaching calendar.",
    icon: CalendarPlus,
    action: "Schedule lesson",
    link: (language: string) => getLocalizedPath("/account?tab=lessonPlans", language),
  },
  {
    title: "Monitor student progress",
    description: "See class performance at a glance and dive into individual learning journeys.",
    icon: BarChart3,
    action: "View analytics",
    link: (language: string) => getLocalizedPath("/account?tab=activity", language),
  },
  {
    title: "Respond to class needs",
    description: "Post updates, share resources, and answer questions in one workspace.",
    icon: MessageCircle,
    action: "Open community board",
    link: (language: string) => getLocalizedPath("/account?tab=classes", language),
  },
];

const workspaceModules = [
  {
    title: "Lesson Planning & Builder",
    description:
      "Design lesson plans with AI assistance, reuse templates, and launch the full lesson builder without leaving the dashboard.",
    icon: NotebookPen,
    linkLabel: "Launch builder",
    link: (language: string) => getLocalizedPath("/account?tab=lessonPlans&view=builder", language),
  },
  {
    title: "Calendar",
    description:
      "Every lesson with a date automatically lands on your teaching calendar. Drag-and-drop to adjust pacing instantly.",
    icon: CalendarCheck,
    linkLabel: "Open calendar",
    link: (language: string) => getLocalizedPath("/account?tab=lessonPlans&view=calendar", language),
  },
  {
    title: "Student Progress",
    description:
      "Track mastery, attendance, and participation across classes with easy-to-read analytics dashboards.",
    icon: BarChart3,
    linkLabel: "Review progress",
    link: (language: string) => getLocalizedPath("/account?tab=activity", language),
  },
  {
    title: "Class Hub",
    description: "Create classes, group students, assign tasks, and keep conversations organized in threads.",
    icon: GraduationCap,
    linkLabel: "Manage classes",
    link: (language: string) => getLocalizedPath("/account?tab=classes", language),
  },
  {
    title: "Resource Library & Blogs",
    description: "Store handouts, attach media, and publish blog posts that can be shared with your learning community.",
    icon: Layers3,
    linkLabel: "Open library",
    link: (language: string) => getLocalizedPath("/account/resources", language),
  },
  {
    title: "Teacher Queries",
    description: "Post questions to other teachers, capture reflections, and turn solutions into reusable notes.",
    icon: MessageCircle,
    linkLabel: "Visit queries",
    link: (language: string) => getLocalizedPath("/account?tab=activity&view=queries", language),
  },
];

const calendarItems = [
  {
    title: "Grade 5 Science – Weather Patterns",
    date: "Mon, Apr 22",
    time: "09:30 AM",
    detail: "Auto-added from lesson plan",
  },
  {
    title: "Class Reflection – Inquiry Circles",
    date: "Tue, Apr 23",
    time: "12:00 PM",
    detail: "Notes space ready for quick journaling",
  },
  {
    title: "Parent Update Blog",
    date: "Wed, Apr 24",
    time: "05:00 PM",
    detail: "Draft post pulled from resource library",
  },
];

const blogHighlights = [
  {
    title: "How to remix last week's plan in seconds",
    summary: "Use saved templates and the builder to adapt content for diverse groups.",
    link: (language: string) => getLocalizedPath("/blog", language),
  },
  {
    title: "Turning formative checks into progress insights",
    summary: "Capture quick student responses and convert them into dashboard metrics.",
    link: (language: string) => getLocalizedPath("/blog", language),
  },
  {
    title: "Teacher query spotlight",
    summary: "See top-voted solutions from this week’s community board.",
    link: (language: string) => getLocalizedPath("/blog", language),
  },
];

const communityPrompts = [
  "What strategies are you using for project-based pacing this month?",
  "Share a reflection from today’s class that you want feedback on.",
  "Looking for enrichment tasks for advanced readers—drop your ideas!",
];

const Index = () => {
  const { language } = useLanguage();

  return (
    <div className="relative min-h-screen bg-background">
      <SEO
        title="Teacher Workspace Dashboard"
        description="Plan lessons, manage classes, and track student progress from one workspace designed for educators."
        keywords="teacher dashboard, lesson planner, education calendar, student progress tracking, teacher blogs, class management"
        canonicalUrl="https://schooltechhub.com"
      />
      <StructuredData
        type="WebApplication"
        data={{
          name: "SchoolTech Hub Teacher Workspace",
          description:
            "A centralized workspace for teachers to plan lessons, manage classes, track progress, and publish resources.",
          applicationCategory: "Education",
        }}
      />
      <MouseGlowEffect />

      <section className="border-b bg-gradient-to-br from-background via-background to-primary/10">
        <div className="container grid gap-10 py-20 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Badge className="w-fit bg-primary/15 text-primary">Your teaching headquarters</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Work, plan, and reflect in the SchoolTech Hub dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Build lessons, organize classes, publish blogs, and respond to student needs without jumping between apps.
              Everything you plan appears on the calendar, so you always know what’s next.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to={getLocalizedPath("/auth", language)}>
                  <Sparkles className="h-4 w-4" />
                  Sign in to your dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={getLocalizedPath("/about", language)}>
                  Learn how the workspace supports teachers
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {quickActions.slice(0, 3).map((action) => (
                <Card key={action.title} className="border-dashed border-primary/40 bg-primary/5">
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-center gap-2 text-primary">
                      <action.icon className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Workflow</span>
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{action.description}</p>
                    <Button asChild size="sm" variant="secondary" className="gap-2">
                      <Link to={action.link(language)}>
                        <PlusCircle className="h-4 w-4" />
                        {action.action}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="self-start border-primary/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarCheck className="h-5 w-5 text-primary" />
                This week at a glance
              </CardTitle>
              <CardDescription>
                Lesson plans with dates are scheduled automatically—edit once and every view stays in sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {calendarItems.map((item) => (
                <Fragment key={item.title}>
                  <div className="flex items-start justify-between gap-4 rounded-lg border border-dashed border-primary/30 bg-muted/40 p-4">
                    <div>
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-primary">{item.date}</p>
                      <p className="text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                </Fragment>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to={getLocalizedPath("/account?tab=lessonPlans&view=calendar", language)}>
                  Manage calendar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-b py-16">
        <div className="container space-y-10">
          <div className="space-y-3 text-center">
            <Badge className="bg-secondary/20 text-secondary">Workspace modules</Badge>
            <h2 className="text-3xl font-semibold">Everything teachers need in one place</h2>
            <p className="max-w-3xl mx-auto text-muted-foreground">
              Launch the lesson builder, review student performance, publish blogs, or respond to queries—each module is one click away inside the dashboard.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {workspaceModules.map((module) => (
              <Card key={module.title} className="flex h-full flex-col border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <module.icon className="h-5 w-5 text-primary" />
                    {module.title}
                  </CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="secondary" className="w-full">
                    <Link to={module.link(language)}>{module.linkLabel}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b py-16">
        <div className="container grid gap-8 lg:grid-cols-2">
          <Card className="h-full border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                Knowledge center
              </CardTitle>
              <CardDescription>
                Keep teachers inspired with curated blog posts, saved strategies, and update announcements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {blogHighlights.map((item) => (
                <div key={item.title} className="rounded-lg border border-dashed border-primary/30 bg-background/70 p-4">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.summary}</p>
                  <Button asChild variant="link" className="px-0">
                    <Link to={item.link(language)}>Read more</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="h-full border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                Query board
              </CardTitle>
              <CardDescription>
                Capture questions, reflections, and peer feedback so the whole team can collaborate asynchronously.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {communityPrompts.map((prompt) => (
                <div key={prompt} className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                  {prompt}
                </div>
              ))}
              <Button asChild className="w-full">
                <Link to={getLocalizedPath("/account?tab=activity&view=queries", language)}>
                  Post a new query
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
            <CardHeader className="text-center space-y-3">
              <Badge className="mx-auto bg-primary text-primary-foreground">Ready when you are</Badge>
              <CardTitle className="text-3xl font-semibold">
                Your dashboard is the teacher’s home base
              </CardTitle>
              <CardDescription className="max-w-2xl mx-auto text-base">
                Create a plan, set the date, and we’ll place it on the calendar. Track student growth, share blogs, and answer queries without leaving the workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to={getLocalizedPath("/auth", language)}>
                  <Sparkles className="h-4 w-4" />
                  Enter the dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={getLocalizedPath("/contact", language)}>
                  Talk with our team
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
