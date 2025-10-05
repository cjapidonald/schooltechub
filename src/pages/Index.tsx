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
import { Reveal } from "@/components/animations/Reveal";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
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
  image: string;
};

const workflowTools: Feature[] = [
  {
    title: "Lesson Builder Platform",
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
    title: "Data-Driven Reports",
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

const featureShowcase = [...workflowTools, ...schoolSolutions];

const compactCardBaseClass =
  "group relative overflow-hidden rounded-[1.5rem] border border-orange-200 bg-white p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-orange-500";

const compactCardGradients = [
  "bg-white",
  "bg-white",
  "bg-white",
  "bg-white",
];

type Stat = {
  value: number;
  label: string;
  formatter: (value: number) => string;
};

const stats: Stat[] = [
  {
    value: 12,
    label: "AI-accelerated lessons created on SchoolTech Hub",
    formatter: (value) => `${Math.round(value)}k+`,
  },
  {
    value: 94,
    label: "Teachers reporting smoother workflow management",
    formatter: (value) => `${Math.round(value)}%`,
  },
  {
    value: 60,
    label: "Average reduction in time spent writing reports",
    formatter: (value) => `${Math.round(value)}%`,
  },
  {
    value: 35,
    label: "Districts modernising teaching with our platform",
    formatter: (value) => `${Math.round(value)}+`,
  },
];

const testimonials: Testimonial[] = [
  {
    quote:
      "SchoolTech Hub keeps our planning aligned and reflective. AI prompts help every lesson land for diverse learners.",
    name: "Emma Rodriguez",
    role: "Digital Learning Coach, Horizon Primary",
    image:
      "https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=facearea&facepad=3&w=320&h=320&q=80",
  },
  {
    quote:
      "The dashboards give our team a living picture of student growth, so we can intervene and celebrate faster.",
    name: "James Patel",
    role: "Year 6 Teacher, Northside Academy",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&facepad=3&w=320&h=320&q=80",
  },
  {
    quote:
      "Our leadership team finally has the analytics we need to coach staff and scale innovation responsibly.",
    name: "Dr. Amina Clarke",
    role: "Assistant Principal, Futures STEM School",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&facepad=3&w=320&h=320&q=80",
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
  "group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 transition-colors duration-300 shadow-lg hover:border-orange-500";

const neonCardGradients = [
  "bg-white",
  "bg-white",
  "bg-white",
];

const iconColorClasses = [
  "bg-green-500 text-white",
  "bg-white text-slate-900",
  "bg-blue-500 text-white",
  "bg-orange-500 text-white",
];

type StatCardProps = {
  stat: Stat;
  index: number;
  shouldAnimate: boolean;
};

const StatCard = ({ stat, index, shouldAnimate }: StatCardProps) => {
  const value = useCountUp(stat.value, shouldAnimate, { duration: 1800 });
  const displayValue = stat.formatter(value);

  return (
    <Reveal delay={index * 120}>
      <Card
        className={cn(
          "p-8",
          neonCardClass,
          neonCardGradients[index % neonCardGradients.length],
        )}
      >
        <p className="text-4xl font-bold text-orange-500">{displayValue}</p>
        <p className="mt-3 text-sm uppercase tracking-wide text-slate-500">{stat.label}</p>
      </Card>
    </Reveal>
  );
};

const Index = () => {
  const { language } = useLanguage();
  const { ref: statsRef, isInView: statsInView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_60%)]" />
          <div className="absolute inset-0 bg-white/90" />
        </div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid gap-16 md:grid-cols-[minmax(0,1fr)_0.9fr]">
            <div>
              <Reveal>
                <Card
                  className={cn(
                    neonCardClass,
                    "relative isolate rounded-[2rem] bg-white p-8 shadow-xl transition-shadow duration-500 hover:shadow-2xl md:p-10",
                    "before:absolute before:inset-[1.5px] before:rounded-[1.92rem] before:bg-[linear-gradient(150deg,rgba(255,255,255,0.22),rgba(15,15,35,0.65))] before:opacity-80 before:content-[''] before:z-0",
                    "after:absolute after:inset-0 after:rounded-[2rem] after:border after:border-white/12 after:shadow-[inset_0_2px_3px_rgba(255,255,255,0.45),inset_0_-6px_12px_rgba(12,11,30,0.85)] after:content-[''] after:pointer-events-none after:z-20",
                  )}
                >
                  <div className="relative z-10">
                    <div className="text-sm uppercase tracking-[0.28em] text-slate-500">Workflow brilliance</div>
                    <h2 className="mt-5 text-4xl font-semibold text-slate-900 md:text-5xl">
                      Power every lesson with organised workflows and luminous insights
                    </h2>
                    <p className="mt-6 max-w-xl text-base text-slate-600 md:text-lg">
                      SchoolTech Hub helps teachers orchestrate their workflow, collaborate with colleagues, and weave technology into every learning moment. Plan lessons, track progress, and publish AI-guided reports without leaving your digital staffroom.
                    </p>
                  </div>
                  <div className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-orange-200/70 blur-3xl" />
                  <div className="pointer-events-none absolute -right-16 -top-12 h-48 w-48 rounded-full bg-orange-100 blur-3xl" />
                </Card>
              </Reveal>
            </div>
            <div className="relative hidden md:flex">
              <div className="pointer-events-none absolute -inset-12 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative grid w-full max-w-2xl grid-cols-1 gap-6">
                <Reveal>
                  <Card className={cn(neonCardClass, "rounded-[1.75rem] bg-white")}
                  >
                    <div className="text-sm uppercase tracking-[0.3em] text-slate-500">Live dashboards</div>
                    <h3 className="mt-4 text-2xl font-semibold text-slate-900">Class and student insights synchronised in real time</h3>
                    <p className="mt-3 text-slate-600">
                      Monitor attendance, mastery, and wellbeing signals in one luminous workspace designed for teaching teams.
                    </p>
                  </Card>
                </Reveal>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Reveal delay={120}>
                    <Card className={cn(neonCardClass, "rounded-[1.75rem] bg-white")}
                    >
                      <div className="text-sm font-semibold text-orange-500">Lesson Builder Platform</div>
                      <p className="mt-2 text-sm text-slate-600">
                        Align objectives, differentiation, and formative checks in minutes with responsible AI support.
                      </p>
                    </Card>
                  </Reveal>
                  <Reveal delay={180}>
                    <Card className={cn(neonCardClass, "rounded-[1.75rem] bg-white")}
                    >
                      <div className="text-sm font-semibold text-emerald-500">Data-Driven Reports</div>
                      <p className="mt-2 text-sm text-slate-600">
                        Turn evidence into narrative-rich reports and share instantly with leadership and families.
                      </p>
                    </Card>
                  </Reveal>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 -z-10 bg-white" />
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <Reveal>
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
                Plan, track, and celebrate learning in one radiant hub
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-lg text-slate-600">
                Lesson planning, student dashboards, and report building live together so every teacher can deliver technology-enabled learning with confidence.
              </p>
            </Reveal>
            <div className="space-y-3">
              <Reveal delay={240}>
                <h3 className="text-2xl font-semibold text-slate-900">
                  Professional development and classroom technology aligned
                </h3>
              </Reveal>
              <Reveal delay={300}>
                <p className="text-base text-slate-600">
                  From interactive lessons to AI readiness, SchoolTech Hub brings every initiative under one collaborative roof. Partner with us to coach staff, embed digital citizenship, and track impact across campuses.
                </p>
              </Reveal>
            </div>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureShowcase.map(({ title, description, icon: Icon }, index) => {
              const isWorkflowTool = index < workflowTools.length;
              const gradientClass = compactCardGradients[index % compactCardGradients.length];

              return (
                <Reveal key={title} delay={index * 120}>
                  <Card className={cn("h-full", compactCardBaseClass, gradientClass)}>
                    <div className="flex flex-col gap-4 text-left">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          iconColorClasses[index % iconColorClasses.length],
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-orange-500">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">{description}</p>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Reveal>
              <Link to={getLocalizedPath("/contact", language)}>
                <Button size="lg" className="neon-pulse">
                  Talk with our team
                </Button>
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <Link to={getLocalizedPath("/events", language)}>
                <Button size="lg" variant="outline" className="border-orange-200 bg-white hover:bg-orange-50">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Join a training session
                </Button>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 -z-10 bg-white" />
        <div className="container mx-auto px-4">
          <div ref={statsRef} className="grid gap-8 text-center md:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} shouldAnimate={statsInView} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Reveal>
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
                Teachers trust SchoolTech Hub for digital transformation
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-5 text-lg text-slate-600">
                Hear how schools are building confident, future-ready classrooms with our AI-powered platform.
              </p>
            </Reveal>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map(({ quote, name, role, image }, index) => (
              <Reveal key={name} delay={index * 150}>
                <Card
                  className={cn(
                    "p-8 text-center",
                    neonCardClass,
                    neonCardGradients[index % neonCardGradients.length],
                  )}
                >
                  <div className="mb-6 flex justify-center">
                    <img
                      src={image}
                      alt={`Portrait of ${name}`}
                      className="h-20 w-20 rounded-full border border-slate-200 object-cover shadow-md"
                      loading="lazy"
                    />
                  </div>
                  <p className="mb-6 text-slate-700 italic">“{quote}”</p>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">{name}</p>
                    <p className="text-sm text-slate-500">{role}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 -z-10 bg-white" />
        <div className="container mx-auto px-4">
          <Reveal>
            <Card
              className={cn(
                "mx-auto max-w-4xl rounded-[2rem] bg-white p-12 text-center",
                neonCardClass,
              )}
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-orange-400 bg-orange-100 text-orange-500 shadow-md">
                <Award className="h-10 w-10" />
              </div>
              <h2 className="mt-8 text-3xl font-bold text-slate-900 md:text-4xl">
                Ready to simplify your teaching workflow?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Join SchoolTech Hub to connect planning, communication, analytics, and professional development for your entire staff.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to={getLocalizedPath("/auth", language)}>
                  <Button size="lg" className="neon-pulse">
                    Get started free
                  </Button>
                </Link>
                <Link to={getLocalizedPath("/services", language)}>
                  <Button size="lg" variant="outline" className="border-orange-200 bg-white hover:bg-orange-50">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    View implementation roadmap
                  </Button>
                </Link>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Index;
