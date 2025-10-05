import { useState } from "react";
import { Link } from "react-router-dom";

import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StudentSkillChart } from "@/components/students/StudentSkillChart";
import { DASHBOARD_EXAMPLE_CLASS } from "@/features/dashboard/examples";
import { DASHBOARD_EXAMPLE_SKILLS, DASHBOARD_EXAMPLE_STUDENTS } from "@/features/students/examples";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  LogIn,
  MessageSquare,
  Notebook,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const getInitials = (name: string): string => {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters.slice(0, 2) || "ST";
};

const exampleStudent = DASHBOARD_EXAMPLE_STUDENTS[0];
const exampleStudentSkills = exampleStudent?.skills ?? [];
const teacherSkillCatalog = new Map(DASHBOARD_EXAMPLE_SKILLS.map(skill => [skill.id, skill]));
const skillInsights = exampleStudentSkills.map(skill => {
  const firstScore = skill.scores[0]?.score ?? 0;
  const latestScore = skill.scores[skill.scores.length - 1]?.score ?? firstScore;
  const change = latestScore - firstScore;
  const teacherDescription = teacherSkillCatalog.get(skill.skillId)?.description;

  return {
    record: skill,
    startScore: firstScore,
    latestScore,
    change,
    changeLabel: `${change >= 0 ? "+" : ""}${change} pts`,
    teacherDescription,
  };
});

const overallStartAverage =
  skillInsights.length > 0
    ? skillInsights.reduce((sum, entry) => sum + entry.startScore, 0) / skillInsights.length
    : 0;
const overallLatestAverage =
  skillInsights.length > 0
    ? skillInsights.reduce((sum, entry) => sum + entry.latestScore, 0) / skillInsights.length
    : 0;
const overallChange = overallLatestAverage - overallStartAverage;
const overallChangeLabel = `${overallChange >= 0 ? "+" : ""}${Math.round(overallChange)} pts`;
const overallLatestAverageDisplay = Math.round(overallLatestAverage);
const observationCheckIns = exampleStudentSkills.reduce((max, skill) => Math.max(max, skill.scores.length), 0);
const observationLabel = observationCheckIns > 0 ? `${observationCheckIns} check-ins logged` : "recent entries";
const emptySkillChartLabel = "Log a quick observation to activate trendlines across your roster.";

const exampleTeacherName = "Alex Rivera";
const exampleTeacherRole = "Grade 6 STEM Lead";
const exampleTeacherSchool = "Northside Academy";
const exampleTeacherContact = "alex.rivera@northside.edu";
const exampleTeacherInitials = getInitials(exampleTeacherName);
const exampleTeacherTeam = "Innovation Cohort";
const exampleClassTitle = DASHBOARD_EXAMPLE_CLASS.title;
const exampleClassStage = DASHBOARD_EXAMPLE_CLASS.stage;

const workspaceMetrics = [
  {
    id: "learners",
    label: "Learners",
    value: `${DASHBOARD_EXAMPLE_STUDENTS.length}`,
    detail: "Synced across rosters",
  },
  {
    id: "classes",
    label: "Classes",
    value: "3",
    detail: "Active groups this term",
  },
  {
    id: "plans",
    label: "Lessons",
    value: "12",
    detail: "Scheduled and ready",
  },
];

const profileHighlights = [
  { label: "School", value: exampleTeacherSchool },
  { label: "Role", value: exampleTeacherRole },
  { label: "Teaching focus", value: `${exampleClassTitle} • ${exampleClassStage}` },
  { label: "Team", value: exampleTeacherTeam },
];

const planningBoard = [
  {
    id: "robotics",
    title: "Robotics Sprint Launch",
    description: "Finalize maker station prompts and upload tomorrow's lab resources for students.",
    due: "Goes live tomorrow • 8:15 AM",
    status: "Ready",
    accent: "bg-emerald-500/20 text-emerald-100 border-emerald-500/40",
    progress: 90,
  },
  {
    id: "literacy",
    title: "Literacy Workshop Story Circles",
    description: "Attach mentor texts and push talking points to the family portal.",
    due: "Publish by Wednesday",
    status: "In review",
    accent: "bg-sky-500/20 text-sky-100 border-sky-500/40",
    progress: 65,
  },
  {
    id: "conference",
    title: "Family Conference Guides",
    description: "Collect highlights from advisory notes and generate shareable PDFs.",
    due: "Draft saved",
    status: "Draft",
    accent: "bg-violet-500/20 text-violet-100 border-violet-500/40",
    progress: 40,
  },
];

const upcomingCommitments = [
  {
    id: "plc",
    title: "STEM PLC planning",
    time: "Today • 3:45 PM",
    partner: "Instructional Coach", 
    location: "Innovation Hub",
  },
  {
    id: "family",
    title: "Family advisory sync",
    time: "Wednesday • 5:30 PM",
    partner: "Martinez family",
    location: "Zoom room 4",
  },
  {
    id: "walkthrough",
    title: "Classroom tech walkthrough",
    time: "Thursday • 10:15 AM",
    partner: "Tech team",
    location: "Lab 2",
  },
];

const focusStreams = [
  {
    id: "instruction",
    title: "Instructional focus",
    description: "Small-group robotics launch planned. Ensure sensors kits are staged by 7:45 AM.",
    change: "Final checklist",
    tone: "text-emerald-100",
  },
  {
    id: "support",
    title: "Student support",
    description: "Three learners flagged for extra check-ins during workshop rotations.",
    change: "Add reflections",
    tone: "text-sky-100",
  },
  {
    id: "growth",
    title: "Professional growth",
    description: "Submit evidence for STEM fellowship micro-credential this Friday.",
    change: "2 artifacts due",
    tone: "text-amber-100",
  },
];

const timeline = [
  {
    id: "report",
    title: "Family report generated",
    description: "Automated PDF shared with the Rivera family showcasing STEM mastery gains.",
    time: "12 minutes ago",
  },
  {
    id: "note",
    title: "Advisory note synced",
    description: "Jordan's reflection on perseverance pushed to the student dashboard.",
    time: "1 hour ago",
  },
  {
    id: "lesson",
    title: "Lesson plan approved",
    description: "Team lead signed off on next week's inquiry cycle for robotics.",
    time: "Yesterday",
  },
];

const workspaceTips = [
  {
    title: "Stage tomorrow's launch",
    description: "Drop links and files into the lesson plan tonight so learners arrive to fully prepped stations.",
  },
  {
    title: "Capture micro-evidence",
    description: "Use the mobile app after each rotation to log quick mastery notes while context is fresh.",
  },
  {
    title: "Loop in families",
    description: "Share celebrations straight from the dashboard to keep caregivers aligned with classroom wins.",
  },
];

export default function TeacherPage() {
  const [hasUnlockedWorkspace, setHasUnlockedWorkspace] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <SEO
        title="Teacher Portal"
        description="Teachers orchestrate lessons, track learner momentum, and collaborate with families from one calm control center."
      />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-[-10rem] h-[18rem] w-[18rem] rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-24 md:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-8 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl transition-colors duration-500 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-80" />
          <div className="absolute inset-y-0 right-[-20%] hidden w-[50%] rounded-full bg-gradient-to-br from-emerald-400/30 via-transparent to-transparent blur-3xl md:block" />

          <div className="relative z-10 grid gap-10 md:grid-cols-[1.6fr,1fr] md:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Guiding the day for every learner
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  Welcome back, {exampleTeacherName.split(" ")[0]}. Your teaching studio is prepped and waiting.
                </h1>
                <p className="mt-4 text-lg text-white/70 md:max-w-xl">
                  Coordinate lessons, sync family communications, and monitor mastery signals without juggling endless tabs.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {workspaceMetrics.map(metric => (
                  <div
                    key={metric.id}
                    className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center shadow-[0_10px_40px_-20px_rgba(15,23,42,0.7)] backdrop-blur-xl"
                  >
                    <p className="text-sm uppercase tracking-wide text-white/60">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-1 text-xs text-white/60">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-white/20 bg-white/10 text-white shadow-[0_20px_70px_-25px_rgba(15,23,42,0.85)] backdrop-blur-xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-semibold">Sign into your workspace</CardTitle>
                <CardDescription className="text-white/65">
                  Use your school credentials to pick up today&apos;s plans exactly where you left them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                  <Avatar className="h-12 w-12 border border-white/30">
                    <AvatarFallback className="bg-white/10 text-lg text-white">{exampleTeacherInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-white/70">Primary account</p>
                    <p className="text-lg font-medium text-white">{exampleTeacherName}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="teacher-email" className="text-xs uppercase tracking-wide text-white/60">
                      School email
                    </Label>
                    <Input
                      id="teacher-email"
                      type="email"
                      placeholder="you@schooltech.edu"
                      className="h-12 rounded-2xl border-white/20 bg-white/10 text-base text-white placeholder:text-white/40 focus-visible:ring-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-code" className="text-xs uppercase tracking-wide text-white/60">
                      Workspace key
                    </Label>
                    <Input
                      id="workspace-code"
                      type="text"
                      placeholder="Enter launch key"
                      className="h-12 rounded-2xl border-white/20 bg-white/10 text-base text-white placeholder:text-white/40 focus-visible:ring-white/40"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  className="h-12 w-full rounded-2xl bg-white/90 text-base font-semibold text-slate-900 shadow-[0_10px_40px_-20px_rgba(226,232,240,0.95)] hover:bg-white disabled:cursor-default disabled:bg-white/70"
                  size="lg"
                  onClick={() => setHasUnlockedWorkspace(true)}
                  disabled={hasUnlockedWorkspace}
                >
                  {hasUnlockedWorkspace ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Workspace ready
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Review today&apos;s plan
                    </>
                  )}
                </Button>
                {hasUnlockedWorkspace && (
                  <Button
                    asChild
                    className="h-11 w-full rounded-2xl border border-white/30 bg-transparent text-base font-semibold text-white hover:bg-white/10"
                  >
                    <Link to="/dashboard">Go to live dashboard</Link>
                  </Button>
                )}
                <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/50">Profile snapshot</p>
                  <dl className="grid gap-3">
                    {profileHighlights.map(item => (
                      <div key={item.label} className="space-y-1 text-sm">
                        <dt className="text-xs uppercase tracking-wide text-white/50">{item.label}</dt>
                        <dd className="text-white/80">{item.value}</dd>
                      </div>
                    ))}
                    <div className="space-y-1 text-sm">
                      <dt className="text-xs uppercase tracking-wide text-white/50">Contact</dt>
                      <dd className="text-white/80">{exampleTeacherContact}</dd>
                    </div>
                  </dl>
                </div>
                <p className="text-center text-xs text-white/60">
                  Need a reset link? Ping your admin or use the password help option on the sign-in page.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {!hasUnlockedWorkspace && (
          <section className="grid gap-8">
            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
              <CardHeader className="space-y-2 text-center md:text-left">
                <CardTitle className="text-2xl font-semibold">Preview your workspace</CardTitle>
                <CardDescription className="text-white/65">
                  Unlock the workspace to orchestrate planning, progress, and communication in one calm view.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-4 text-sm text-white/70 md:grid-cols-3">
                  <li className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <TrendingUp className="h-5 w-5 shrink-0 text-white/80" />
                    <div>
                      <p className="font-medium text-white">Live mastery pulses</p>
                      <p>Every observation updates student skills and roster averages instantly.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <ClipboardList className="h-5 w-5 shrink-0 text-white/80" />
                    <div>
                      <p className="font-medium text-white">Lesson flow control</p>
                      <p>Drag, drop, and publish plans without losing track of essential resources.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <MessageSquare className="h-5 w-5 shrink-0 text-white/80" />
                    <div>
                      <p className="font-medium text-white">Caregiver alignment</p>
                      <p>Push highlights to families so everyone enters conversations with context.</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {hasUnlockedWorkspace && skillInsights.length > 0 && (
          <section className="grid gap-8">
            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                    <TrendingUp className="h-6 w-6" />
                    Student mastery radar
                  </CardTitle>
                  <CardDescription className="text-white/65">
                    Track roster health without spreadsheets. Your evidence flows straight into these calm, high-signal visuals.
                  </CardDescription>
                </div>
                <Badge className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                  <Target className="h-3.5 w-3.5" />
                  Progress signals
                </Badge>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,1)]">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Roster average</p>
                        <p className="mt-2 text-4xl font-semibold text-white">{overallLatestAverageDisplay}%</p>
                        <p className="mt-3 text-sm text-white/70">{overallChangeLabel} since {observationLabel}.</p>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/70">
                        <Sparkles className="h-4 w-4" />
                        Notes sync with student view
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      {skillInsights.map(insight => (
                        <div key={insight.record.skillId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-white/50">{insight.record.skillName}</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{insight.latestScore}%</p>
                          <p className="text-xs text-white/60">Started at {insight.startScore}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,1)]">
                    <p className="text-sm text-white/70">
                      Every evidence log updates family-ready narratives and the student dashboard. Use these insights to plan differentiation groups and celebrate wins in the moment.
                    </p>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/50">Latest reflection</p>
                        <p className="mt-2 text-sm text-white/70">{exampleStudent?.academicComment ?? "Students are stretching their problem-solving muscles with collaborative builds."}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/50">Action step</p>
                        <p className="mt-2 text-sm text-white/70">Review charts before advisory to spotlight growth areas with each learner.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {skillInsights.map(insight => (
                    <div
                      key={`${insight.record.skillId}-chart`}
                      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,1)] backdrop-blur"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{insight.record.skillName}</h3>
                          <p className="text-xs uppercase tracking-wide text-white/50">Roster spotlight</p>
                        </div>
                        <Badge className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/70">
                          {insight.changeLabel}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <StudentSkillChart skill={insight.record} emptyLabel={emptySkillChartLabel} />
                      </div>
                      {insight.teacherDescription && (
                        <p className="mt-4 text-sm text-white/70">{insight.teacherDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {hasUnlockedWorkspace && (
          <section className="grid gap-8 lg:grid-cols-[1.9fr,1fr]">
            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold">Lesson launch board</CardTitle>
                  <CardDescription className="text-white/60">
                    Keep every plan, checklist, and resource aligned before the bell rings.
                  </CardDescription>
                </div>
                <Badge className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                  <Notebook className="h-3.5 w-3.5" />
                  Auto-synced
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {planningBoard.map(plan => (
                  <div
                    key={plan.id}
                    className="group rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-[0_15px_55px_-35px_rgba(15,23,42,1)] transition-all duration-300 hover:border-white/20 hover:bg-white/15"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-white">{plan.title}</h3>
                        <p className="text-sm text-white/65">{plan.description}</p>
                      </div>
                      <Badge className={`w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${plan.accent}`}>
                        {plan.status}
                      </Badge>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
                      <div className="space-y-3">
                        <Progress value={plan.progress} className="h-2 rounded-full bg-white/10" />
                        <p className="text-xs font-medium uppercase tracking-wide text-white/50">{plan.progress}% aligned</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
                        <Clock className="h-4 w-4" />
                        {plan.due}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-8">
              <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                    <CalendarDays className="h-6 w-6" />
                    Upcoming commitments
                  </CardTitle>
                  <CardDescription className="text-white/65">
                    Slide into every session with context and materials ready.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingCommitments.map(commitment => (
                    <div key={commitment.id} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-medium text-white">{commitment.title}</p>
                          <p className="text-sm text-white/60">{commitment.partner}</p>
                        </div>
                        <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                          {commitment.location}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-white/65">
                        <Clock className="h-4 w-4" />
                        {commitment.time}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                    <Users className="h-6 w-6" />
                    Focus streams
                  </CardTitle>
                  <CardDescription className="text-white/65">
                    Quick cues to steer instruction, support, and growth.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {focusStreams.map(stream => (
                    <div key={stream.id} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-lg font-semibold text-white">{stream.title}</p>
                      <p className="mt-2 text-sm text-white/70">{stream.description}</p>
                      <p className={`mt-3 text-xs font-medium uppercase tracking-wide ${stream.tone}`}>{stream.change}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {hasUnlockedWorkspace && (
          <section className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold">Activity timeline</CardTitle>
                  <CardDescription className="text-white/60">
                    Every log, report, and message lands here so nothing slips.
                  </CardDescription>
                </div>
                <Badge className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Synced
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={item.id} className="relative pl-6">
                    {index !== timeline.length - 1 && (
                      <span className="absolute left-2 top-6 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-white/40 to-transparent" />
                    )}
                    <span className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-white/20" />
                    <div className="space-y-1">
                      <p className="text-lg font-medium text-white">{item.title}</p>
                      <p className="text-sm text-white/65">{item.description}</p>
                      <p className="text-xs uppercase tracking-wide text-white/40">{item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Quick start tips</CardTitle>
                <CardDescription className="text-white/65">
                  Borrowed from calm productivity systems so your dashboard stays focused and breathable.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-white/70">
                {workspaceTips.map(tip => (
                  <div key={tip.title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="font-medium text-white">{tip.title}</p>
                    <p className="mt-1 text-white/65">{tip.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
