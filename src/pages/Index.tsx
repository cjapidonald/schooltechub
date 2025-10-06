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

import futuristicHeroImage from "@/assets/futuristic-classroom-hero.jpg";

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

const compactCardBaseClass =
  "group relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-[hsla(222,47%,14%,0.68)] p-5 shadow-[0_22px_48px_-28px_rgba(10,18,55,0.65)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_30px_72px_-30px_rgba(35,78,182,0.6)] backdrop-blur-xl";

const compactCardGradients = [
  "bg-[linear-gradient(145deg,hsla(var(--glow-primary)/0.22),hsla(222,47%,12%,0.55))]",
  "bg-[linear-gradient(145deg,hsla(var(--glow-secondary)/0.22),hsla(222,47%,12%,0.55))]",
  "bg-[linear-gradient(145deg,hsla(var(--glow-accent)/0.22),hsla(222,47%,12%,0.55))]",
  "bg-[linear-gradient(145deg,hsla(var(--glow-primary)/0.18),hsla(222,47%,12%,0.55))]",
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
  "group relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6 transition-colors duration-300 hover:border-primary/60";

const neonCardGradients = [
  "bg-gradient-to-br from-primary/20 via-background/75 to-background/95",
  "bg-gradient-to-br from-secondary/25 via-background/75 to-background/95",
  "bg-gradient-to-br from-accent/25 via-background/75 to-background/95",
];

const convexOverlayClass = "convex-panel-sheen";

const glassBoardClass =
  "relative overflow-hidden rounded-[2.25rem] border border-white/12 bg-white/10 p-8 text-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.82)] backdrop-blur-2xl sm:p-12";

const glassBoardOverlayClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22)_0%,_rgba(15,23,42,0.55)_60%,_rgba(15,23,42,0.92)_100%)] opacity-85";

const classroomTechnologyBackgrounds = {
  featureShowcase:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=2100&q=80",
  stats:
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=2100&q=80",
  testimonials:
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=2100&q=80",
  cta:
    "https://images.unsplash.com/photo-1530229525026-1b0e9753a0c1?auto=format&fit=crop&w=2100&q=80",
};

const iconStyles = [
  {
    iconWrapper:
      "border border-white/5 bg-[hsl(var(--glow-accent))] text-white shadow-[0_12px_28px_-12px_hsla(var(--glow-accent)/0.9)]",
    title: "text-[hsl(var(--glow-accent))]",
  },
  {
    iconWrapper:
      "border border-white/5 bg-[hsl(var(--glow-secondary))] text-white shadow-[0_12px_28px_-12px_hsla(var(--glow-secondary)/0.85)]",
    title: "text-[hsl(var(--glow-secondary))]",
  },
  {
    iconWrapper:
      "border border-white/5 bg-[hsl(var(--glow-primary))] text-white shadow-[0_12px_28px_-12px_hsla(var(--glow-primary)/0.85)]",
    title: "text-[hsl(var(--glow-primary))]",
  },
];

type DecorativeBackgroundImage = {
  src: string;
  className: string;
};

const featureBackgroundDecorations: DecorativeBackgroundImage[] = [
  {
    src: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
    className:
      "-top-20 left-[12%] hidden h-48 w-72 -rotate-3 overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_32px_80px_-34px_rgba(55,48,163,0.55)] lg:block",
  },
  {
    src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
    className:
      "bottom-[-18%] right-[8%] hidden h-56 w-80 rotate-6 overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_90px_-28px_rgba(16,185,129,0.45)] xl:block",
  },
  {
    src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    className:
      "top-[40%] left-[-8%] hidden h-48 w-64 rotate-12 overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_26px_72px_-30px_rgba(244,114,182,0.4)] 2xl:block",
  },
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
        <p className="text-4xl font-bold text-primary text-glow">{displayValue}</p>
        <p className="mt-3 text-sm uppercase tracking-wide text-white/65">{stat.label}</p>
      </Card>
    </Reveal>
  );
};

const Index = () => {
  const { language } = useLanguage();
  const { ref: statsRef, isInView: statsInView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SEO
        title="All-in-One Teacher Technology Platform | SchoolTech Hub"
        description="Empower teachers with an AI-ready workspace to plan lessons, track student progress, build reports, and embed technology across the school."
        keywords="teacher workflow platform, AI lesson planner, student progress dashboards, report builder for teachers, technology in the classroom, professional development in educational technology"
        canonicalUrl="https://schooltechhub.com/"
      />
      <StructuredData type="Organization" data={structuredData} />

      <section className="relative overflow-hidden pt-3 pb-28 md:pt-3">
        <MouseGlowEffect />
        <SparklesBackground />
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0">
            <img
              src={futuristicHeroImage}
              alt="Futuristic classroom with holographic interfaces"
              className="h-full w-full object-cover object-center opacity-80"
              loading="lazy"
            />
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsla(var(--glow-primary)/0.14),transparent_62%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background/90" />
        </div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="relative mx-auto max-w-5xl">
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-background/45 via-background/70 to-background/85" />
            </div>
            <div>
              <Reveal>
                <Card
                  className={cn(
                    neonCardClass,
                    "relative isolate rounded-[2rem] bg-gradient-to-br from-primary/20 via-background/45 to-background/70 p-8 backdrop-blur-lg shadow-[0_28px_60px_-20px_rgba(54,20,130,0.65)] transition-shadow duration-500 hover:shadow-[0_36px_72px_-18px_rgba(76,32,176,0.7)] md:p-10",
                    "before:absolute before:inset-[1.5px] before:rounded-[1.92rem] before:bg-[linear-gradient(150deg,rgba(255,255,255,0.16),rgba(15,15,35,0.45))] before:opacity-60 before:content-[''] before:z-0",
                  )}
                >
                  <span className={convexOverlayClass} aria-hidden />
                  <span className="bolt-fastener absolute left-8 top-6 z-20 md:left-12 md:top-8" aria-hidden />
                  <span className="bolt-fastener absolute right-8 top-6 z-20 md:right-12 md:top-8" aria-hidden />
                  <span className="bolt-fastener absolute left-8 bottom-6 z-20 md:left-12 md:bottom-8" aria-hidden />
                  <span className="bolt-fastener absolute right-8 bottom-6 z-20 md:right-12 md:bottom-8" aria-hidden />
                  <div className="relative z-10 flex flex-col items-center gap-10 text-center">
                    <div className="flex flex-col items-center text-center">
                      <div className="text-sm uppercase tracking-[0.28em] text-white/60">Workflow brilliance</div>
                      <h2 className="mt-5 text-4xl font-semibold text-white md:text-5xl">
                        Power every lesson with organised workflows and luminous insights
                      </h2>
                      <p className="mt-6 max-w-xl text-base text-white/60 md:text-lg">
                        SchoolTech Hub helps teachers orchestrate their workflow, collaborate with colleagues, and weave technology into every learning moment. Plan lessons, track progress, and publish AI-guided reports without leaving your digital staffroom.
                      </p>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl" />
                </Card>
              </Reveal>
            </div>
            <div className="mt-12 grid gap-[15px] sm:grid-cols-2 xl:grid-cols-4">
              {workflowTools.map(({ title, description, icon: Icon }, index) => {
                const { iconWrapper, title: titleColor } = iconStyles[index % iconStyles.length];

                return (
                  <Reveal key={title} delay={index * 120}>
                    <Card
                      className={cn(
                        "h-full",
                        compactCardBaseClass,
                        compactCardGradients[index % compactCardGradients.length],
                      )}
                    >
                      <span className={cn(convexOverlayClass, "convex-panel-sheen--compact")} aria-hidden />
                      <div className="relative z-10 flex h-full flex-col gap-4 text-left">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            iconWrapper,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                          <h3 className={cn("text-xl font-semibold", titleColor)}>{title}</h3>
                          <p className="text-sm text-white/70">{description}</p>
                        </div>
                      </div>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-16 overflow-hidden pt-16 pb-24 md:-mt-20 md:pt-20">
        <div className="absolute inset-0 -z-20">
          <img
            src={classroomTechnologyBackgrounds.featureShowcase}
            alt="Collaborative classroom using interactive technology"
            className="h-full w-full object-cover object-center opacity-55"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsla(var(--glow-primary)/0.18),transparent_62%)]" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="container relative mx-auto px-4">
          <div className="pointer-events-none absolute inset-0 -z-10">
            {featureBackgroundDecorations.map(({ src, className }) => (
              <div key={src} className={cn("absolute bg-white/5", className)}>
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/75 to-background/85" />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/85 to-background" />
          </div>
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <Card
                className={cn(
                  neonCardClass,
                  "relative isolate rounded-[2rem] bg-gradient-to-br from-primary/20 via-background/45 to-background/70 p-8 backdrop-blur-lg shadow-[0_28px_60px_-20px_rgba(54,20,130,0.65)] transition-shadow duration-500 hover:shadow-[0_36px_72px_-18px_rgba(76,32,176,0.7)] md:p-12",
                  "before:absolute before:inset-[1.5px] before:rounded-[1.92rem] before:bg-[linear-gradient(150deg,rgba(255,195,255,0.16),rgba(15,15,35,0.45))] before:opacity-60 before:content-[''] before:z-0"
                )}
              >
                <span className={convexOverlayClass} aria-hidden />
                <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                  <h2 className="text-3xl font-semibold text-white md:text-4xl">
                    Plan, track, and celebrate learning in one radiant hub
                  </h2>
                  <p className="max-w-2xl text-base text-white/65 md:text-lg">
                    Lesson planning, student dashboards, and report building live together so every teacher can deliver technology-enabled learning with confidence.
                  </p>
                </div>
                <div className="pointer-events-none absolute -right-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl" />
              </Card>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-[15px] sm:grid-cols-2 lg:grid-cols-4">
            {schoolSolutions.map(({ title, description, icon: Icon }, index) => {
              const gradientClass = compactCardGradients[index % compactCardGradients.length];
              const { iconWrapper, title: titleColor } = iconStyles[index % iconStyles.length];

              return (
                <Reveal key={title} delay={index * 120}>
                  <Card className={cn("h-full", compactCardBaseClass, gradientClass)}>
                    <span
                      className={cn(convexOverlayClass, "convex-panel-sheen--compact")}
                      aria-hidden
                    />
                    <div className="relative z-10 flex flex-col gap-4 text-left">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          iconWrapper,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={cn("text-xl font-semibold", titleColor)}>{title}</h3>
                        <p className="mt-2 text-sm text-white/80">{description}</p>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-10">
            <Reveal delay={120}>
              <Card className={cn(glassBoardClass, "mx-auto flex max-w-4xl flex-col items-center gap-8 text-center")}> 
                <span className={glassBoardOverlayClass} aria-hidden />
                <div className="relative z-10 space-y-3">
                  <h3 className="text-2xl font-semibold text-white md:text-3xl">
                    Professional development and classroom technology aligned
                  </h3>
                  <p className="text-base text-white/75">
                    From interactive lessons to AI readiness, SchoolTech Hub brings every initiative under one collaborative roof. Partner with us to coach staff, embed digital citizenship, and track impact across campuses.
                  </p>
                </div>
                <div className="relative z-10" />
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-20">
          <img
            src={classroomTechnologyBackgrounds.stats}
            alt="Teacher reviewing analytics on a classroom display"
            className="h-full w-full object-cover object-center opacity-25"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/15 via-background to-secondary/15" />
        <div className="container mx-auto px-4">
          <div ref={statsRef} className="grid gap-[15px] text-center md:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} shouldAnimate={statsInView} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-20">
          <img
            src={classroomTechnologyBackgrounds.testimonials}
            alt="Students collaborating with digital tablets"
            className="h-full w-full object-cover object-center opacity-25"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/95 via-background/80 to-background" />
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl">
            <Reveal>
              <Card className={cn(neonCardClass, glassBoardClass)}>
                <span className={convexOverlayClass} aria-hidden />
                <div className="relative z-10 space-y-5">
                  <h2 className="text-3xl font-bold text-white md:text-4xl">
                    Teachers trust SchoolTech Hub for digital transformation
                  </h2>
                  <p className="text-lg text-white/75">
                    Hear how schools are building confident, future-ready classrooms with our AI-powered platform.
                  </p>
                </div>
                <div className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl" />
                <div className="pointer-events-none absolute -right-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-secondary/20 blur-3xl" />
              </Card>
            </Reveal>
          </div>
          <div className="grid gap-[15px] md:grid-cols-3">
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
                      className="h-20 w-20 rounded-full border border-white/20 object-cover shadow-[0_0_18px_hsl(var(--glow-primary)/0.3)]"
                      loading="lazy"
                    />
                  </div>
                  <p className="mb-6 text-white/90 italic">“{quote}”</p>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-white">{name}</p>
                    <p className="text-sm text-white/70">{role}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-20">
          <img
            src={classroomTechnologyBackgrounds.cta}
            alt="Educators collaborating with immersive classroom tools"
            className="h-full w-full object-cover object-center opacity-25"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-background to-secondary/20" />
        <div className="container mx-auto px-4">
          <Reveal>
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
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Index;
