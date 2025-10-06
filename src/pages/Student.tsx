import { useEffect, useRef, useState, type MouseEvent } from "react";

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
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle2, Clock, LogIn, Notebook, Sparkles, TrendingUp, Trophy } from "lucide-react";

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
const observationLabel = observationCheckIns > 0 ? `${observationCheckIns} check-ins` : "recent updates";
const emptySkillChartLabel = "Skill trend data will appear once your teacher shares updates.";

const STUDENT_UNLOCKED_TOAST = {
  title: "Prototype login successful",
  description: "Explore the student journey preview—no real credentials required.",
} as const;

const fallbackStudentName = "Jordan Martinez";
const exampleStudentFullName = exampleStudent?.fullName ?? fallbackStudentName;
const exampleStudentPreferredName =
  exampleStudent?.preferredName ?? exampleStudentFullName.split(/\s+/)[0] ?? exampleStudentFullName;
const exampleStudentGuardian = exampleStudent?.guardianName ?? "Family Advocate";
const exampleStudentGuardianContact = exampleStudent?.guardianContact ?? "family@example.com";
const exampleStudentInitials = getInitials(exampleStudentFullName);
const exampleStudentClassTitle = DASHBOARD_EXAMPLE_CLASS.title;
const exampleStudentStage = DASHBOARD_EXAMPLE_CLASS.stage;
const exampleStudentBehaviorComment =
  exampleStudent?.behaviorComment ??
  "Consistently supportive of classmates and contributes thoughtful ideas during class discussions.";
const exampleStudentAcademicComment =
  exampleStudent?.academicComment ??
  "Showing strong progress in reading comprehension with increasing confidence in writing tasks.";

const profileHighlights = [
  { label: "Class group", value: `${exampleStudentClassTitle} • ${exampleStudentStage}` },
  { label: "Preferred name", value: exampleStudentPreferredName },
  { label: "Primary guardian", value: exampleStudentGuardian },
  { label: "Family contact", value: exampleStudentGuardianContact },
];

const assignments = [
  {
    id: "research",
    title: "Solar System Field Notes",
    description: "Summarize your findings and upload photos from the observatory visit.",
    due: "Due tomorrow · 4:00 PM",
    status: "In progress",
    accent: "bg-sky-500/20 text-sky-100 border-sky-500/40",
    progress: 68,
  },
  {
    id: "reading",
    title: "Chapter 5 Reflection Journal",
    description: "Respond to the essential questions about ecosystems in 3-4 paragraphs.",
    due: "Due Friday",
    status: "Upcoming",
    accent: "bg-violet-500/20 text-violet-100 border-violet-500/40",
    progress: 25,
  },
  {
    id: "lab",
    title: "Chemistry Lab Report",
    description: "Upload your data table and analysis from the acids and bases experiment.",
    due: "Submitted",
    status: "Completed",
    accent: "bg-emerald-500/20 text-emerald-100 border-emerald-500/40",
    progress: 100,
  },
];

const upcomingSessions = [
  {
    id: "math",
    title: "Math Acceleration",
    time: "Today · 2:30 PM",
    facilitator: "Ms. Rivera",
    location: "Lab 3",
  },
  {
    id: "club",
    title: "Robotics Studio",
    time: "Wednesday · 4:00 PM",
    facilitator: "Coach Lin",
    location: "Innovation Hub",
  },
  {
    id: "support",
    title: "Study Coaching",
    time: "Thursday · 3:15 PM",
    facilitator: "Mr. Patel",
    location: "Learning Lounge",
  },
];

const focusAreas = [
  {
    id: "science",
    title: "Science Mastery",
    description: "Great job retaining 92% of your quiz streak this term.",
    change: "+6% this week",
    tone: "text-emerald-100",
  },
  {
    id: "writing",
    title: "Writing Flow",
    description: exampleStudentAcademicComment,
    change: "2 reflections pending",
    tone: "text-sky-100",
  },
  {
    id: "wellness",
    title: "Wellness Pulse",
    description: "Daily focus score landed at 82 yesterday. Remember to pause and stretch.",
    change: "4-day streak",
    tone: "text-amber-100",
  },
];

const achievements = [
  {
    id: "attendance",
    label: "Attendance",
    value: "98%",
    detail: "Perfect arrival streak this month",
  },
  {
    id: "homework",
    label: "Homework",
    value: "12",
    detail: "Assignments turned in on time",
  },
  {
    id: "class",
    label: "Class",
    value: exampleStudentStage,
    detail: exampleStudentClassTitle,
  },
];

const timeline = [
  {
    id: "feedback",
    title: "New reflection from Ms. Rivera",
    description: `“${exampleStudentBehaviorComment}”`,
    time: "20 minutes ago",
  },
  {
    id: "message",
    title: "Family contact updated",
    description: `${exampleStudentGuardian} (${exampleStudentGuardianContact}) confirmed the robotics showcase RSVP.`,
    time: "1 hour ago",
  },
  {
    id: "grade",
    title: "Biology quiz scored 94%",
    description: "Keep revisiting the virtual lab to maintain mastery.",
    time: "Yesterday",
  },
];

export default function StudentPage() {
  const { toast } = useToast();
  const [hasEntered, setHasEntered] = useState(false);
  const journeyContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!hasEntered) {
      return;
    }

    journeyContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasEntered]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "student") {
      setHasEntered(true);
    }
  }, []);

  const handleEnterJourney = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (hasEntered) {
      return;
    }

    setHasEntered(true);
    toast(STUDENT_UNLOCKED_TOAST);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <SEO
        title="Student Portal"
        description="Students can log in to explore assignments, track progress, and follow the learning path curated by their teachers."
      />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-[-10rem] h-[18rem] w-[18rem] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-24 md:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-8 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl transition-colors duration-500 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-80" />
          <div className="absolute inset-y-0 right-[-20%] hidden w-[50%] rounded-full bg-gradient-to-br from-cyan-400/30 via-transparent to-transparent blur-3xl md:block" />

          {hasEntered ? (
            <div className="relative z-10 grid gap-10 md:grid-cols-[1.6fr,1fr] md:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  Effortless learning for every student
                </div>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                    Welcome back, {exampleStudentPreferredName}. Your personal learning space is ready.
                  </h1>
                  <p className="mt-4 text-lg text-white/70 md:max-w-xl">
                    Jump into the assignments your teacher prepared, review curated feedback, and celebrate your streaks—all from
                    one immersive hub.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {achievements.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center shadow-[0_10px_40px_-20px_rgba(15,23,42,0.7)] backdrop-blur-xl"
                    >
                      <p className="text-sm uppercase tracking-wide text-white/60">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                      <p className="mt-1 text-xs text-white/60">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border-white/20 bg-white/10 text-white shadow-[0_20px_70px_-25px_rgba(15,23,42,0.85)] backdrop-blur-xl">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border border-white/30">
                      <AvatarFallback className="bg-white/10 text-lg text-white">{exampleStudentInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">Profile snapshot</p>
                      <CardTitle className="text-2xl font-semibold text-white">{exampleStudentFullName}</CardTitle>
                      <CardDescription className="text-white/65">
                        {exampleStudentPreferredName}&apos;s details at a glance.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <dl className="grid gap-4">
                    {profileHighlights.map((item) => (
                      <div key={item.label} className="space-y-1 text-sm">
                        <dt className="text-xs uppercase tracking-wide text-white/50">{item.label}</dt>
                        <dd className="text-white/80">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/70">
                    <p className="font-medium text-white">Teacher reflection</p>
                    <p className="mt-1">{exampleStudentAcademicComment}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="relative z-10 mx-auto max-w-sm">
              <Card className="border-white/15 bg-white/10 text-white shadow-[0_16px_50px_-30px_rgba(15,23,42,0.85)] backdrop-blur-xl">
                <CardHeader className="space-y-2 text-center">
                  <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.7rem] font-medium text-white/80 backdrop-blur">
                    <Sparkles className="h-4 w-4" />
                    Student journey portal
                  </div>
                  <CardTitle className="text-xl font-semibold text-white">Log in to your journey</CardTitle>
                  <CardDescription className="text-xs text-white/70">
                    Access assignments, celebrate streaks, and follow teacher guidance the moment you sign in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="student-email" className="text-[0.65rem] uppercase tracking-wide text-white/60">
                        School email
                      </Label>
                      <Input
                        id="student-email"
                        type="email"
                        placeholder="you@studenthub.com"
                        className="h-11 rounded-2xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-code" className="text-[0.65rem] uppercase tracking-wide text-white/60">
                        Access code
                      </Label>
                      <Input
                        id="student-code"
                        type="text"
                        placeholder="6-digit code"
                        className="h-11 rounded-2xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/40"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="h-11 w-full rounded-2xl bg-white/90 text-sm font-semibold text-slate-900 shadow-[0_10px_40px_-20px_rgba(226,232,240,0.95)] hover:bg-white disabled:cursor-default disabled:bg-white/70"
                    size="lg"
                    onClick={handleEnterJourney}
                    disabled={hasEntered}
                    aria-pressed={hasEntered}
                  >
                    {hasEntered ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Journey unlocked
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Log in to my journey
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-white/60">
                    Need help? Ask your teacher to resend the code or reset your password.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
        {hasEntered && skillInsights.length > 0 && (
          <section ref={journeyContentRef} className="grid gap-8">
            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                    <TrendingUp className="h-6 w-6" />
                    Guided skill growth
                  </CardTitle>
                  <CardDescription className="text-white/65">
                    Live updates from your teacher&apos;s skills workspace show exactly how your mastery is building each week.
                  </CardDescription>
                </div>
                <Badge className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                  Teacher skill goals
                </Badge>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,1)]">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Average mastery</p>
                        <p className="mt-2 text-4xl font-semibold text-white">{overallLatestAverageDisplay}%</p>
                        <p className="mt-3 text-sm text-white/70">{overallChangeLabel} since {observationLabel}.</p>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/70">
                        <Sparkles className="h-4 w-4" />
                        Teacher check-ins sync automatically
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
                      Every time your teacher logs evidence on the skills page, your dashboard refreshes with the newest score, narrative context, and focus tips. Use these signals to plan study sessions and celebrate growth.
                    </p>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/50">Teacher reflection</p>
                        <p className="mt-2 text-sm text-white/70">{exampleStudentAcademicComment}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/50">How to use it</p>
                        <p className="mt-2 text-sm text-white/70">Review the charts after each workshop or assignment to decide which skill to practice next.</p>
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
                          <p className="text-xs uppercase tracking-wide text-white/50">{exampleStudentPreferredName}&apos;s progress</p>
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

        {hasEntered && (
          <section className="grid gap-8 lg:grid-cols-[1.9fr,1fr]">
            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold">This week's homework</CardTitle>
                  <CardDescription className="text-white/60">
                    Track teacher assignments, due dates, and your progress in real time.
                  </CardDescription>
                </div>
                <Badge className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                  <Notebook className="h-3.5 w-3.5" />
                  Live updates
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="group rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-[0_15px_55px_-35px_rgba(15,23,42,1)] transition-all duration-300 hover:border-white/20 hover:bg-white/15"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                        <p className="text-sm text-white/65">{assignment.description}</p>
                      </div>
                      <Badge className={`w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${assignment.accent}`}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
                      <div className="space-y-3">
                        <Progress value={assignment.progress} className="h-2 rounded-full bg-white/10" />
                        <p className="text-xs font-medium uppercase tracking-wide text-white/50">{assignment.progress}% complete</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
                        <Clock className="h-4 w-4" />
                        {assignment.due}
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
                    Upcoming sessions
                  </CardTitle>
                  <CardDescription className="text-white/65">
                    Arrive a few minutes early to get the most from each experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-medium text-white">{session.title}</p>
                          <p className="text-sm text-white/60">{session.facilitator}</p>
                        </div>
                        <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                          {session.location}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-white/65">
                        <Clock className="h-4 w-4" />
                        {session.time}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                    <Trophy className="h-6 w-6" />
                    Focus highlights
                  </CardTitle>
                  <CardDescription className="text-white/65">
                    Micro-updates from your teacher to guide what comes next.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {focusAreas.map((focus) => (
                    <div key={focus.id} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-lg font-semibold text-white">{focus.title}</p>
                      <p className="mt-2 text-sm text-white/70">{focus.description}</p>
                      <p className={`mt-3 text-xs font-medium uppercase tracking-wide ${focus.tone}`}>{focus.change}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {hasEntered && (
          <section ref={skillInsights.length > 0 ? undefined : journeyContentRef} className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold">Activity timeline</CardTitle>
                  <CardDescription className="text-white/60">
                    Every update from your teachers and clubs appears here instantly.
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
                  Borrowed from Apple-inspired design systems to keep your dashboard calm yet energetic.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="font-medium text-white">Sync devices</p>
                  <p className="mt-1 text-white/65">Use the SchoolTech app on your iPad to capture photos directly into assignments.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="font-medium text-white">Stay notified</p>
                  <p className="mt-1 text-white/65">Enable push notifications for gentle nudges before homework is due.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="font-medium text-white">Share wins</p>
                  <p className="mt-1 text-white/65">Celebrate progress with classmates by posting highlights to your learning journal.</p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
