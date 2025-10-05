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
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { cn } from "@/lib/utils";

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

const accentCardClass =
  "border border-primary/35 shadow-[0_0_25px_hsl(var(--glow-primary)/0.12)] transition-colors duration-300 hover:border-primary/70";

const Index = () => {
  const { language } = useLanguage();

  const highlightPills = [
    "Organise lessons, calendars, and reflections in one place",
    "Share best practice and professional learning with your team",
    "Harness AI and data to personalise every student journey",
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <SEO
        title="All-in-One Teacher Technology Platform | SchoolTech Hub"
        description="Empower teachers with an AI-ready workspace to plan lessons, track student progress, build reports, and embed technology across the school."
        keywords="teacher workflow platform, AI lesson planner, student progress dashboards, report builder for teachers, technology in the classroom, professional development in educational technology"
        canonicalUrl="https://schooltechhub.com/"
      />
      <StructuredData type="Organization" data={structuredData} />

      <section className="relative overflow-hidden py-24">
        <MouseGlowEffect />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 bg-primary/15 text-primary">
              The all-in-one technology workspace for teachers
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Power every lesson with organised workflows and smart insights
            </h1>
            <p className="mt-6 text-lg text-white/80 md:text-xl">
              SchoolTech Hub helps teachers organise their workflow, collaborate with colleagues, and use technology to elevate every classroom experience. Plan lessons, track progress, and publish AI-driven reports without leaving your digital staffroom.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={getLocalizedPath("/services", language)}>
                <Button size="lg">Explore platform features</Button>
              </Link>
              <Link to={getLocalizedPath("/resources", language)}>
                <Button size="lg" variant="outline">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Browse teaching resources
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
              {highlightPills.map((highlight) => (
                <span
                  key={highlight}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Plan, track, and celebrate learning in one hub</h2>
            <p className="mt-4 text-lg text-white/70">
              Lesson planning, student dashboards, and report building live together so every teacher can deliver technology-enabled learning with confidence.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {workflowTools.map(({ title, description, icon: Icon }) => (
              <Card key={title} className={cn("h-full p-6", accentCardClass)}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                </div>
                <p className="text-white/80 leading-relaxed">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
            <div className="max-w-xl">
              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                School-wide technology solutions
              </Badge>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                Professional development and classroom technology aligned
              </h2>
              <p className="mt-4 text-lg text-white/70">
                From interactive lessons to AI readiness, SchoolTech Hub brings every initiative under one collaborative roof. Partner with us to coach staff, embed digital citizenship, and track impact across campuses.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to={getLocalizedPath("/contact", language)}>
                  <Button size="lg">Talk with our team</Button>
                </Link>
                <Link to={getLocalizedPath("/events", language)}>
                  <Button size="lg" variant="outline">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Join a training session
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
              {schoolSolutions.map(({ title, description, icon: Icon }) => (
                <Card key={title} className={cn("h-full p-6", accentCardClass)}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15">
                      <Icon className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">{title}</h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">{description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className={cn("p-8", accentCardClass)}>
                <p className="text-4xl font-bold text-primary">{stat.number}</p>
                <p className="mt-3 text-sm uppercase tracking-wide text-white/60">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Teachers trust SchoolTech Hub for digital transformation</h2>
            <p className="mt-4 text-lg text-white/70">
              Hear how schools are building confident, future-ready classrooms with our AI-powered platform.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ quote, name, role }) => (
              <Card key={name} className={cn("p-6", accentCardClass)}>
                <p className="mb-4 text-white/90 italic">“{quote}”</p>
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-white/70">{role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4">
          <Card
            className={cn(
              "mx-auto max-w-4xl bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-10 text-center",
              accentCardClass,
            )}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold md:text-4xl">Ready to simplify your teaching workflow?</h2>
            <p className="mt-4 text-lg text-white/70">
              Join SchoolTech Hub to connect planning, communication, analytics, and professional development for your entire staff.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={getLocalizedPath("/auth", language)}>
                <Button size="lg">Get started free</Button>
              </Link>
              <Link to={getLocalizedPath("/services", language)}>
                <Button size="lg" variant="outline">
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
