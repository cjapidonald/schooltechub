import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardPen,
  FileSpreadsheet,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const planningFocusAreas = [
  {
    title: "Capture every unit",
    description:
      "Outline your scope and sequence with clear titles, key concepts, and pacing so you can see the full academic year at a glance.",
    tips: [
      "Group related lessons into meaningful units with a short narrative about student outcomes.",
      "Use the stage and subject fields to keep grade-level materials organised.",
      "Add dates when you know them so the calendar view reflects your real schedule.",
    ],
    icon: FileSpreadsheet,
  },
  {
    title: "Connect lessons and resources",
    description:
      "Link each curriculum item to draft lesson plans, slide decks, and supporting materials to keep your teaching toolkit one click away.",
    tips: [
      "Start a lesson builder workspace directly from any curriculum row.",
      "Attach presentation links so you never have to hunt for files mid-lesson.",
      "Track status to see which lessons are drafts, published, or ready to teach.",
    ],
    icon: ClipboardPen,
  },
  {
    title: "Review progress often",
    description:
      "Schedule quick reviews to ensure your plans stay aligned with student needs and school initiatives throughout the term.",
    tips: [
      "Filter by class to check for coverage gaps or pacing adjustments.",
      "Use lesson status badges to see where extra planning time is needed.",
      "Archive older units once they are taught to maintain a focused view.",
    ],
    icon: CalendarCheck2,
  },
];

const quickStartActions = [
  {
    title: "Open the curriculum workspace",
    description:
      "Build, reorder, and update every unit from a single drag-and-drop view tailored for School Tech Hub teachers.",
    cta: "Go to curriculum workspace",
    href: "/teacher?tab=curriculum",
    icon: LayoutDashboard,
  },
  {
    title: "Launch a lesson builder",
    description:
      "Draft new lessons connected to your curriculum so instructional materials stay in sync with the plan.",
    cta: "Start a lesson plan",
    href: "/lesson-builder",
    icon: Sparkles,
  },
];

const supportHighlights = [
  {
    title: "Stay organised",
    description:
      "Use consistent naming conventions for classes, units, and lessons so colleagues can quickly understand your plan.",
  },
  {
    title: "Collaborate with your team",
    description:
      "Share curriculum exports when you need feedback or want to celebrate progress with instructional coaches.",
  },
  {
    title: "Reflect and improve",
    description:
      "Add notes about what worked and where students needed support—future you will thank present you.",
  },
];

const gradientBackground =
  "absolute inset-0 -z-10 overflow-hidden bg-slate-950 after:absolute after:left-1/2 after:top-1/3 after:h-[560px] after:w-[560px] after:-translate-x-1/2 after:rounded-full after:bg-gradient-to-br after:from-blue-500/20 after:via-indigo-500/10 after:to-cyan-500/20 after:blur-3xl";

export default function TeacherCurriculumManagement() {
  return (
    <div className="relative isolate overflow-hidden text-white">
      <SEO
        title="Curriculum management guide"
        description="Learn how to organise, review, and iterate on your School Tech Hub curriculum with practical tips and quick actions."
      />
      <div className={gradientBackground} aria-hidden />

      <section className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16 sm:px-10 sm:py-20">
        <header className="space-y-6 text-balance">
          <Badge variant="secondary" className="border-white/30 bg-white/15 text-white/90">
            Curriculum support
          </Badge>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Manage your curriculum with confidence
            </h1>
            <p className="text-lg text-white/80 sm:text-xl">
              Keep every unit, lesson, and resource connected so you can focus on instruction instead of admin work. Use this
              guide to build a curriculum that stays organised all year long.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {quickStartActions.map(action => (
              <Button
                key={action.title}
                asChild
                className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.75)] transition hover:bg-white/20"
              >
                <Link to={action.href}>
                  <action.icon className="h-4 w-4" />
                  {action.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </Link>
              </Button>
            ))}
          </div>
        </header>

        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Three pillars of curriculum management</h2>
            <p className="text-base text-white/75 sm:text-lg">
              Focus on these core habits to maintain a clear, actionable plan for your students.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {planningFocusAreas.map(area => (
              <Card
                key={area.title}
                className="h-full rounded-3xl border border-white/10 bg-white/5 text-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.95)]"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3 text-white/80">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                      <area.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-xl font-semibold text-white">{area.title}</CardTitle>
                      <CardDescription className="text-sm text-white/70">{area.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-white/75">
                  {area.tips.map(tip => (
                    <div key={tip} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-emerald-300" />
                      <p>{tip}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.9)]">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Weekly management checklist</h2>
            <p className="text-base text-white/75 sm:text-lg">
              Spend a few minutes each week keeping your curriculum updated so it reflects what&apos;s happening in the classroom.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border border-white/10 bg-transparent text-white">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold">Before the week begins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/75">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-cyan-300" />
                  <p>Confirm upcoming lessons have clear objectives and linked materials.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-cyan-300" />
                  <p>Adjust pacing if assessments or school events shift the schedule.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-cyan-300" />
                  <p>Flag lessons that need extra support or differentiation plans.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-white/10 bg-transparent text-white">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold">After the week wraps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/75">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-indigo-300" />
                  <p>Record quick reflections about student understanding and engagement.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-indigo-300" />
                  <p>Update lesson statuses to keep the dashboard current.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-indigo-300" />
                  <p>Archive or reorganise items so upcoming units stay front and centre.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Helpful habits</h2>
            <p className="text-base text-white/75 sm:text-lg">
              Keep momentum going with these quick reminders for sustainable curriculum upkeep.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {supportHighlights.map(highlight => (
              <Card
                key={highlight.title}
                className="h-full rounded-3xl border border-white/10 bg-white/5 text-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.85)]"
              >
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg font-semibold">{highlight.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/75">{highlight.description}</CardContent>
              </Card>
            ))}
          </div>
          <Separator className="border-white/10" />
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <span>
              Need deeper support? Share feedback with the School Tech Hub team so we can keep improving the curriculum
              experience.
            </span>
            <Button
              asChild
              variant="link"
              className="px-0 text-white hover:text-white/90"
            >
              <Link to="/contact" className="inline-flex items-center gap-1">
                Contact us
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </section>
      </section>
    </div>
  );
}
