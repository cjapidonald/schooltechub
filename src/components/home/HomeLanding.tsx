import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cpu,
  ArrowRight,
  Rocket,
  ChevronRight,
  NotebookPen,
  Library,
  FileSpreadsheet,
  ActivitySquare,
  BarChart3,
  BrainCircuit,
  Sparkles,
  LifeBuoy,
  TabletSmartphone,
  CloudCog,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
} from "lucide-react";

import MouseGlowEffect from "@/components/MouseGlowEffect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

import heroImage from "@/assets/futuristic-classroom-hero.jpg";

const TARGET_COUNTERS = { lessons: 12000, resources: 4500, satisfaction: 97 } as const;

type HomeLandingProps = {
  embedded?: boolean;
  canonicalUrl?: string;
};

export const HomeLanding = ({ embedded = false, canonicalUrl = "https://schooltechhub.com" }: HomeLandingProps) => {
  const [counters, setCounters] = useState({ lessons: 0, resources: 0, satisfaction: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const duration = 2000;
            const start = performance.now();

            const animateCounters = (currentTime: number) => {
              const elapsed = currentTime - start;
              const progress = Math.min(elapsed / duration, 1);

              setCounters({
                lessons: Math.floor(TARGET_COUNTERS.lessons * progress),
                resources: Math.floor(TARGET_COUNTERS.resources * progress),
                satisfaction: Math.floor(TARGET_COUNTERS.satisfaction * progress),
              });

              if (progress < 1) {
                requestAnimationFrame(animateCounters);
              } else {
                setCounters({ ...TARGET_COUNTERS });
              }
            };

            requestAnimationFrame(animateCounters);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const highlights = [
    { icon: NotebookPen, text: t.home.highlights.workspace, iconColor: "text-primary" },
    { icon: FileSpreadsheet, text: t.home.highlights.resourceLibrary, iconColor: "text-accent" },
    { icon: ActivitySquare, text: t.home.highlights.community, iconColor: "text-secondary" },
  ];

  const statsData = [
    { value: `${counters.lessons.toLocaleString()}+`, label: t.home.stats.lessonPlans, icon: NotebookPen },
    { value: `${counters.resources.toLocaleString()}+`, label: t.home.stats.resourceDownloads, icon: Library },
    { value: `${counters.satisfaction}%`, label: t.home.stats.teacherSatisfaction, icon: Sparkles },
    { value: "40+", label: t.home.stats.supportAvailable, icon: LifeBuoy },
  ];

  const workflowIcons = [NotebookPen, FileSpreadsheet, ActivitySquare];
  const workflowItems = t.home.workflow.items.map((item, index) => ({
    ...item,
    Icon: workflowIcons[index] ?? NotebookPen,
  }));

  const techTopicIcons = [BrainCircuit, TabletSmartphone, CloudCog, Sparkles];
  const techTopicCards = t.home.techTopics.items.map((item, index) => ({
    ...item,
    Icon: techTopicIcons[index % techTopicIcons.length],
  }));

  const iconStyles = [
    {
      iconWrapper:
        "border border-white/5 bg-[hsl(var(--glow-accent))] text-white shadow-[0_12px_28px_-12px_hsla(var(--glow-accent)/0.9)]",
      title: "text-[hsl(var(--glow-accent))]",
      hoverGlow:
        "hover:border-accent/60 hover:shadow-[0_30px_72px_-30px_hsl(var(--glow-accent)/0.6)]",
    },
    {
      iconWrapper:
        "border border-white/5 bg-[hsl(var(--glow-secondary))] text-white shadow-[0_12px_28px_-12px_hsla(var(--glow-secondary)/0.85)]",
      title: "text-[hsl(var(--glow-secondary))]",
      hoverGlow:
        "hover:border-secondary/60 hover:shadow-[0_30px_72px_-30px_hsl(var(--glow-secondary)/0.6)]",
    },
    {
      iconWrapper:
        "border border-white/5 bg-[hsl(var(--glow-primary))] text-white shadow-[0_12px_28px_-12px_hsla(var(--glow-primary)/0.85)]",
      title: "text-[hsl(var(--glow-primary))]",
      hoverGlow:
        "hover:border-primary/60 hover:shadow-[0_30px_72px_-30px_hsl(var(--glow-primary)/0.6)]",
    },
  ] as const;

  const featureHoverEffects = {
    primary:
      "hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.2)]",
    accent:
      "hover:border-accent/50 hover:shadow-[0_0_30px_hsl(var(--glow-accent)/0.2)]",
    secondary:
      "hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(var(--glow-secondary)/0.2)]",
  } as const;

  const featureCards = [
    {
      icon: NotebookPen,
      title: t.features.feature1.title,
      description: t.features.feature1.description,
      color: "primary" as const,
    },
    {
      icon: FileSpreadsheet,
      title: t.features.feature2.title,
      description: t.features.feature2.description,
      color: "accent" as const,
    },
    {
      icon: BarChart3,
      title: t.features.feature3.title,
      description: t.features.feature3.description,
      color: "secondary" as const,
    },
    {
      icon: ActivitySquare,
      title: t.features.feature4.title,
      description: t.features.feature4.description,
      color: "primary" as const,
    },
    {
      icon: BrainCircuit,
      title: t.features.feature5.title,
      description: t.features.feature5.description,
      color: "accent" as const,
    },
    {
      icon: LifeBuoy,
      title: t.features.feature6.title,
      description: t.features.feature6.description,
      color: "secondary" as const,
    },
  ] as const;

  const socialLinks = [
    {
      href: "https://www.facebook.com/share/g/1NukWcXVpp/",
      label: t.home.cta.social.facebook,
      Icon: Facebook,
      ariaLabel: t.home.cta.social.facebook,
    },
    {
      href: "https://www.instagram.com/schooltechhub/",
      label: t.home.cta.social.instagram,
      Icon: Instagram,
      ariaLabel: t.home.cta.social.instagram,
    },
    {
      href: "https://www.linkedin.com/in/donald-cjapi-b7800a383/",
      label: t.home.cta.social.linkedin,
      Icon: Linkedin,
      ariaLabel: t.home.cta.social.linkedin,
    },
    {
      href: "mailto:dcjapi@gmail.com",
      label: t.home.cta.social.email,
      Icon: Mail,
      ariaLabel: t.home.cta.social.email,
      target: "_self" as const,
      rel: undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {!embedded && (
        <>
          <SEO
            title="Teacher Workspace for Lesson Planning & Student Reports | SchoolTech Hub"
            description="SchoolTech Hub is the digital staffroom where teachers plan lessons, generate student reports, track skills, assign digital homework, and master classroom technology."
            keywords="teacher workspace, lesson planning software, student progress reports, skill tracking dashboard, digital homework platform, classroom technology coaching, edtech for teachers"
            canonicalUrl={canonicalUrl}
          />
          <StructuredData
            type="Organization"
            data={{
              "@type": "EducationalOrganization",
              name: "SchoolTech Hub",
              url: canonicalUrl,
              description:
                "Teacher workspace for lesson planning, student reporting, digital homework, and classroom technology coaching.",
              sameAs: [
                "https://www.facebook.com/share/g/1NukWcXVpp/",
                "https://www.instagram.com/schooltechhub/",
                "https://www.linkedin.com/in/donald-cjapi-b7800a383/",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "hello@schooltechhub.com",
                availableLanguage: ["English"],
              },
            }}
          />
        </>
      )}
      <MouseGlowEffect />
      <div className="pointer-events-none fixed inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-20" />

      <section className="relative min-h-[600px] lg:min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Futuristic classroom with advanced educational technology - AI-powered learning environment"
            className="h-full w-full object-cover opacity-40"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 bg-primary rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 backdrop-blur-sm">
              <Cpu className="h-4 w-4 text-primary animate-pulse-glow" />
              <span className="text-sm font-medium text-primary">{t.hero.subtitle}</span>
            </div>

            <h1 className="mb-6 font-orbitron text-6xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                {t.hero.title}
              </span>
            </h1>

            <p className="mb-8 text-xl text-muted-foreground font-space animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              {t.hero.description}
            </p>

            <div className="mb-12 flex flex-wrap justify-center gap-6 text-sm font-space animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <highlight.icon className={`h-5 w-5 ${highlight.iconColor} animate-pulse-glow`} />
                  <span className="text-foreground">{highlight.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Link to={getLocalizedPath("/contact", language)}>
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[0_0_40px_hsl(var(--glow-primary)/0.5)] transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t.hero.getStarted}
                    <Rocket className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link to={getLocalizedPath("/services", language)}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/30 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.3)] transition-all duration-300"
                >
                  {t.hero.learnMore}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
        </div>
      </section>

      <section className="relative py-12 lg:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-orbitron font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t.features.title}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => (
              <Link to={getLocalizedPath("/services", language)} key={index} className="block">
                <Card
                  className={`group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 cursor-pointer h-full ${featureHoverEffects[feature.color]}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-6">
                    <feature.icon className={`mb-4 h-12 w-12 text-${feature.color} animate-pulse-glow`} />
                    <h3 className="mb-2 text-xl font-semibold font-orbitron">{feature.title}</h3>
                    <p className="text-muted-foreground font-space">{feature.description}</p>
                    <div className="mt-4 flex items-center text-primary group-hover:text-accent transition-colors">
                      <span className="text-sm font-medium">{t.hero.learnMore}</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-12 lg:py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              <Sparkles className="h-4 w-4" />
              <span>{workflowItems.map((item) => item.badge).join(" • ")}</span>
            </div>
            <h2 className="text-4xl font-orbitron font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t.home.workflow.title}
            </h2>
            <p className="text-lg text-muted-foreground font-space">
              {t.home.workflow.subtitle}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {workflowItems.map((item, index) => {
              const { hoverGlow } = iconStyles[index % iconStyles.length];

              return (
                <Card
                  key={`${item.badge}-${index}`}
                  className={`group relative h-full overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 ${hoverGlow}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex h-full flex-col p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {item.badge}
                    </span>
                    <item.Icon className="h-10 w-10 text-primary animate-pulse-glow" />
                  </div>
                  <h3 className="mb-3 text-xl font-orbitron font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-space flex-1">
                    {item.description}
                  </p>
                </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-12 lg:py-20" ref={statsRef}>
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            {statsData.map((stat, index) => (
              <div key={index} className="text-center group">
                <stat.icon className="mx-auto mb-4 h-8 w-8 text-primary animate-pulse-glow" />
                <div className="text-4xl font-orbitron font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-space mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-12 lg:py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-4xl font-orbitron font-bold mb-4 bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
              {t.home.techTopics.title}
            </h2>
            <p className="text-lg text-muted-foreground font-space">
              {t.home.techTopics.subtitle}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {techTopicCards.map((topic, index) => (
              <Link
                to={getLocalizedPath("/blog", language)}
                key={`${topic.title}-${index}`}
                className="block h-full"
              >
                <Card className="group relative flex h-full flex-col overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-accent/60 hover:shadow-[0_0_35px_hsl(var(--glow-accent)/0.25)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex h-full flex-col p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <topic.Icon className="h-10 w-10 text-accent animate-pulse-glow" />
                      <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                    <h3 className="mb-3 text-lg font-orbitron font-semibold text-foreground">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground font-space flex-1">{topic.description}</p>
                    <div className="mt-6 inline-flex items-center text-primary group-hover:text-accent transition-colors">
                      <span className="text-sm font-semibold">{t.home.techTopics.action}</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-12 lg:py-20">
        <div className="container">
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-12 text-center">
            <div className="absolute inset-0 bg-cyber-grid bg-[size:30px_30px] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-orbitron font-bold mb-4">{t.home.cta.title}</h2>
              <p className="text-xl text-muted-foreground font-space mb-8 max-w-2xl mx-auto">
                {t.home.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to={getLocalizedPath("/contact", language)}>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_40px_hsl(var(--glow-primary)/0.5)]">
                    {t.home.cta.primary}
                    <Rocket className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to={getLocalizedPath("/services", language)}>
                  <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary hover:bg-primary/10">
                    {t.home.cta.secondary}
                  </Button>
                </Link>
              </div>

              <div className="flex justify-center space-x-4">
                {socialLinks.map(({ href, label, Icon, ariaLabel, target, rel }, index) => (
                  <a
                    key={index}
                    href={href}
                    target={target ?? "_blank"}
                    rel={rel ?? (target === "_self" ? undefined : "noopener noreferrer")}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={ariaLabel}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="sr-only">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomeLanding;
