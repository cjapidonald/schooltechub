import { Link } from "react-router-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarRange,
  ClipboardList,
  Laptop,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import MouseGlowEffect from "@/components/MouseGlowEffect";
import SparklesBackground from "@/components/SparklesBackground";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { cn } from "@/lib/utils";

import heroImage from "@/assets/futuristic-classroom-hero.jpg";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

const workflowTools: Feature[] = [
  {
    title: "AI Lesson Planner",
    description:
      "Draft engaging lessons in minutes with standards alignment, smart suggestions, and reusable templates.",
    icon: CalendarRange,
  },
  {
    title: "Progress Tracker",
    description:
      "See class and individual growth at a glance with dashboards that surface data-driven insights automatically.",
    icon: LayoutDashboard,
  },
  {
    title: "Student Dashboards",
    description:
      "Give every learner clarity with personalised AI summaries, goals, and next steps that keep families in the loop.",
    icon: BarChart3,
  },
  {
    title: "AI Report Builder",
    description:
      "Transform evidence into narrative-rich reports and share them instantly with leadership teams and guardians.",
    icon: ClipboardList,
  },
];

const schoolSolutions: Feature[] = [
  {
    title: "Technology in the Classroom",
    description:
      "Embed devices, apps, and blended learning strategies with coaching that supports every teacher.",
    icon: Laptop,
  },
  {
    title: "Responsible AI Adoption",
    description:
      "Launch AI initiatives with governance, ready-made resources, and professional development pathways.",
    icon: BrainCircuit,
  },
  {
    title: "Collaborative Staff Culture",
    description:
      "Unite departments with shared workspaces, lesson libraries, and community boards for rapid feedback.",
    icon: Users,
  },
  {
    title: "Data-Informed Leadership",
    description:
      "Equip leaders with real-time analytics, progress indicators, and planning tools for strategic decisions.",
    icon: Sparkles,
  },
];

const stats = [
  { number: "12k+", label: "AI-accelerated lessons created on SchoolTech Hub" },
  { number: "94%", label: "Teachers reporting smoother workflow management" },
  { number: "60%", label: "Average reduction in time spent writing reports" },
  { number: "35+", label: "Districts modernising teaching with our platform" },
];

const testimonials: Testimonial[] = [
  {
    quote:
      "SchoolTech Hub keeps our planning aligned and reflective. AI prompts help every lesson land for diverse learners.",
    name: "Emma Rodriguez",
    role: "Digital Learning Coach, Horizon Primary",
  },
  {
    quote:
      "The dashboards give our team a living picture of student growth, so we can intervene and celebrate faster.",
    name: "James Patel",
    role: "Year 6 Teacher, Northside Academy",
  },
  {
    quote:
      "Our leadership team finally has the analytics we need to coach staff and scale innovation responsibly.",
    name: "Dr. Amina Clarke",
    role: "Assistant Principal, Futures STEM School",
  },
];

const structuredData = {
  description:
    "SchoolTech Hub is the all-in-one teacher workspace for lesson planning, student dashboards, AI report building, and technology professional development.",
  sameAs: [
    "https://www.facebook.com/schooltechhub",
    "https://www.instagram.com/schooltechhub/",
    "https://www.linkedin.com/company/schooltechhub/",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Teacher workflow platform",
    itemListElement: workflowTools.map((tool) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: tool.title,
        description: tool.description,
      },
    })),
  },
};

const neonCardClass =
  "group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_25px_hsl(var(--glow-primary)/0.12)] backdrop-blur-xl transition-all duration-500 hover:border-primary/80 hover:shadow-[0_0_45px_hsl(var(--glow-primary)/0.35)]";

const neonIconClass =
  "relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-[0_0_18px_hsl(var(--glow-primary)/0.25)] before:absolute before:-inset-3 before:rounded-full before:bg-primary/10 before:blur-lg before:content-['']";

const neonIconSecondaryClass =
  "relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10 text-secondary shadow-[0_0_18px_hsl(var(--glow-secondary)/0.25)] before:absolute before:-inset-3 before:rounded-full before:bg-secondary/10 before:blur-lg before:content-['']";

const gradientVariants = [
  "bg-gradient-to-b from-primary/18 via-background/70 to-background",
  "bg-gradient-to-b from-secondary/20 via-background/70 to-background",
  "bg-gradient-to-b from-accent/18 via-background/70 to-background",
  "bg-gradient-to-b from-primary/24 via-background/70 to-background",
];

const Index = () => {
  const { language } = useLanguage();

  const highlightPills = [
    "Organise lessons, calendars, and reflections in one place",
    "Share best practice and professional learning with your team",
    "Harness AI and data to personalise every student journey",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SEO
        title="All-in-One Teacher Technology Platform | SchoolTech Hub"
        description="Empower teachers with an AI-ready workspace to plan lessons, track student progress, build reports, and embed technology across the school."
        keywords="teacher workflow platform, AI lesson planner, student progress dashboards, report builder for teachers, technology in the classroom, professional development in educational technology"
        canonicalUrl="https://schooltechhub.com/"
      />
      <StructuredData type="Organization" data={structuredData} />

      <section className="relative overflow-hidden pt-20 pb-28 md:pt-24">
        <MouseGlowEffect />
        <SparklesBackground />
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Futuristic classroom with holographic interfaces"
            className="h-full w-full object-cover object-center opacity-45"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsla(var(--glow-primary)/0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        </div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid gap-16 md:grid-cols-[minmax(0,1fr)_0.9fr]">
            <div>
              <Badge variant="secondary" className="mb-6 bg-primary/20 text-primary backdrop-blur">
                The all-in-one technology workspace for teachers
              </Badge>
              <h1 className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-4xl font-bold tracking-tight text-transparent animate-gradient md:text-6xl">
                Power every lesson with organised workflows and luminous insights
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
                SchoolTech Hub helps teachers orchestrate their workflow, collaborate with colleagues, and weave technology into every learning moment. Plan lessons, track progress, and publish AI-guided reports without leaving your digital staffroom.
              </p>
              <div className="mt-10 flex flex-col items-center justify-start gap-4 sm:flex-row">
                <Link to={getLocalizedPath("/services", language)}>
                  <Button size="lg" className="neon-pulse">
                    Explore platform features
                  </Button>
                </Link>
                <Link to={getLocalizedPath("/resources", language)}>
                  <Button size="lg" variant="outline" className="border-white/30 bg-white/10 backdrop-blur">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Browse teaching resources
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-4 text-sm text-white/75">
                {highlightPills.map((highlight) => (
                  <span
                    key={highlight}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 shadow-[0_0_25px_hsl(var(--glow-primary)/0.15)] backdrop-blur"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative hidden md:flex">
              <div className="pointer-events-none absolute -inset-12 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative grid w-full max-w-2xl grid-cols-1 gap-6">
                <Card className={cn(neonCardClass, "rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-background/60 to-background")}
                >
                  <div className="text-sm uppercase tracking-[0.3em] text-white/60">Live dashboards</div>
                  <h3 className="mt-4 text-2xl font-semibold text-white">Class and student insights synchronised in real time</h3>
                  <p className="mt-3 text-white/70">
                    Monitor attendance, mastery, and wellbeing signals in one luminous workspace designed for teaching teams.
                  </p>
                </Card>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Card className={cn(neonCardClass, "rounded-[1.75rem] bg-gradient-to-b from-secondary/20 via-background/70 to-background")}
                  >
                    <div className="text-sm font-semibold text-secondary">AI Lesson Planner</div>
                    <p className="mt-2 text-sm text-white/75">
                      Align objectives, differentiation, and formative checks in minutes with responsible AI support.
                    </p>
                  </Card>
                  <Card className={cn(neonCardClass, "rounded-[1.75rem] bg-gradient-to-b from-accent/20 via-background/70 to-background")}
                  >
                    <div className="text-sm font-semibold text-accent">Report Builder</div>
                    <p className="mt-2 text-sm text-white/75">
                      Turn evidence into narrative-rich reports and share instantly with leadership and families.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/10 to-background" />
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Plan, track, and celebrate learning in one radiant hub
            </h2>
            <p className="mt-5 text-lg text-white/75">
              Lesson planning, student dashboards, and report building live together so every teacher can deliver technology-enabled learning with confidence.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {workflowTools.map(({ title, description, icon: Icon }, index) => (
              <Card
                key={title}
                className={cn("h-full", neonCardClass, gradientVariants[index % gradientVariants.length])}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={neonIconClass}>
                    <Icon className="relative h-8 w-8 drop-shadow-[0_0_10px_hsl(var(--glow-primary)/0.35)]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-primary">
                    {title}
                  </h3>
                  <p className="mt-4 text-base text-white/80">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
            <div className="max-w-xl space-y-6">
              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                School-wide technology solutions
              </Badge>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Professional development and classroom technology aligned
              </h2>
              <p className="text-lg text-white/75">
                From interactive lessons to AI readiness, SchoolTech Hub brings every initiative under one collaborative roof. Partner with us to coach staff, embed digital citizenship, and track impact across campuses.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to={getLocalizedPath("/contact", language)}>
                  <Button size="lg" className="neon-pulse">
                    Talk with our team
                  </Button>
                </Link>
                <Link to={getLocalizedPath("/events", language)}>
                  <Button size="lg" variant="outline" className="border-white/30 bg-white/10 backdrop-blur">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Join a training session
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
              {schoolSolutions.map(({ title, description, icon: Icon }, index) => (
                <Card
                  key={title}
                  className={cn(
                    "h-full",
                    neonCardClass,
                    gradientVariants[index % gradientVariants.length],
                  )}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={neonIconSecondaryClass}>
                      <Icon className="relative h-8 w-8 drop-shadow-[0_0_10px_hsl(var(--glow-secondary)/0.35)]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-secondary">
                      {title}
                    </h3>
                    <p className="mt-4 text-base text-white/80">{description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/15 via-background to-secondary/15" />
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center md:grid-cols-4">
            {stats.map((stat, index) => (
              <Card
                key={stat.label}
                className={cn(
                  "p-8",
                  neonCardClass,
                  gradientVariants[index % gradientVariants.length],
                )}
              >
                <p className="text-4xl font-bold text-primary text-glow">{stat.number}</p>
                <p className="mt-3 text-sm uppercase tracking-wide text-white/65">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Teachers trust SchoolTech Hub for digital transformation
            </h2>
            <p className="mt-5 text-lg text-white/75">
              Hear how schools are building confident, future-ready classrooms with our AI-powered platform.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map(({ quote, name, role }, index) => (
              <Card
                key={name}
                className={cn(
                  "p-8 text-center",
                  neonCardClass,
                  gradientVariants[index % gradientVariants.length],
                )}
              >
                <p className="mb-6 text-white/90 italic">“{quote}”</p>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white">{name}</p>
                  <p className="text-sm text-white/70">{role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-background to-secondary/20" />
        <div className="container mx-auto px-4">
          <Card
            className={cn(
              "mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-primary/15 via-background/80 to-secondary/15 p-12 text-center",
              neonCardClass,
            )}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary shadow-[0_0_35px_hsl(var(--glow-primary)/0.45)]">
              <Award className="h-10 w-10" />
            </div>
            <h2 className="mt-8 text-3xl font-bold text-white md:text-4xl">
              Ready to simplify your teaching workflow?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Join SchoolTech Hub to connect planning, communication, analytics, and professional development for your entire staff.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={getLocalizedPath("/auth", language)}>
                <Button size="lg" className="neon-pulse">
                  Get started free
                </Button>
              </Link>
              <Link to={getLocalizedPath("/services", language)}>
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 backdrop-blur">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  View implementation roadmap
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
