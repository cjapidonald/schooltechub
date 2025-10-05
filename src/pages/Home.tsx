import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Users,
  BookOpen,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  BarChart3,
  BrainCircuit,
  Building2,
  GraduationCap,
  Laptop,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { cn } from "@/lib/utils";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const Home = () => {
  const { language } = useLanguage();

  const heroHighlights = [
    "AI-assisted lesson planning",
    "Data-driven student insights",
    "Technology coaching for every classroom",
  ];

  const workflowTools: Feature[] = [
    {
      title: "Lesson Planner",
      description:
        "Design engaging lessons in minutes with templates, curriculum alignment, and collaborative feedback.",
      icon: CalendarRange,
    },
    {
      title: "Progress Tracker",
      description:
        "Monitor academic and skill growth with dashboards that surface the data that matters most to teachers.",
      icon: LayoutDashboard,
    },
    {
      title: "Student Dashboards",
      description:
        "Give learners clarity with AI-powered summaries, learning goals, and next steps personalised to their needs.",
      icon: BarChart3,
    },
    {
      title: "Report Builder",
      description:
        "Generate narrative-rich reports and share them instantly with families and leadership teams.",
      icon: ClipboardList,
    },
  ];

  const schoolSolutions: Feature[] = [
    {
      title: "Technology in the Classroom",
      description:
        "Deploy devices, apps, and blended learning strategies with built-in professional development.",
      icon: Laptop,
    },
    {
      title: "AI Readiness",
      description:
        "Introduce responsible AI practices, resources, and policies that elevate teaching and learning.",
      icon: BrainCircuit,
    },
    {
      title: "Staff Collaboration",
      description:
        "Connect departments with shared workspaces, resource hubs, and real-time updates.",
      icon: Layers,
    },
    {
      title: "Leadership Insights",
      description:
        "Equip school leaders with holistic analytics, strengths-based reporting, and action planning.",
      icon: Building2,
    },
  ];

  const stats = [
    { number: "12k+", label: "Lessons streamlined with SchoolTech Hub" },
    { number: "94%", label: "Of teachers report improved workflow efficiency" },
    { number: "60%", label: "Average time saved on student reporting" },
    { number: "35+", label: "Districts adopting our technology-first toolkit" },
  ];

  const testimonials = [
    {
      quote:
        "SchoolTech Hub has transformed how our staff plan and reflect. The AI suggestions keep lessons relevant and inclusive.",
      name: "Emma Rodriguez",
      role: "Digital Learning Coach, Horizon Primary",
    },
    {
      quote:
        "The student dashboards give us a live pulse on progress so every child has a personalised path forward.",
      name: "James Patel",
      role: "Year 6 Teacher, Northside Academy",
    },
    {
      quote:
        "Leadership finally has the analytics we need to coach, celebrate, and plan strategically.",
      name: "Dr. Amina Clarke",
      role: "Assistant Principal, Futures STEM School",
    },
  ];

  const accentCardClass =
    "border-2 border-primary/35 shadow-[0_0_20px_hsl(var(--glow-primary)/0.08)] transition-colors duration-300 hover:border-primary/75";

  const renderFeatureCard = ({ title, description, icon: Icon }: Feature) => (
    <Card key={title} className={cn("p-6 h-full", accentCardClass)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-white/80 leading-relaxed">{description}</p>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="All-in-One Teacher Workspace | SchoolTech Hub"
        description="SchoolTech Hub helps teachers organise their workflow, plan lessons, build AI-powered student reports, and embed technology in every classroom."
        keywords="teacher workflow platform, lesson planner, student dashboards, AI report builder, technology in the classroom, professional development for teachers, edtech for schools"
        canonicalUrl="https://schooltechhub.com/home"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 bg-primary/15 text-primary">
              The digital staffroom for future-ready schools
            </Badge>
            <h1 className="text-4xl font-bold md:text-6xl">
              Empowering teachers to plan, track, and grow with technology
            </h1>
            <p className="mt-6 text-lg text-white/80 md:text-xl">
              SchoolTech Hub is the all-in-one workspace where educators streamline their workflow, share best practices, and leverage AI to personalise learning for every student.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={getLocalizedPath("/services", language)}>
                <Button size="lg">
                  Explore teacher solutions
                </Button>
              </Link>
              <Link to={getLocalizedPath("/resources", language)}>
                <Button size="lg" variant="outline">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Browse learning resources
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
              {heroHighlights.map((highlight) => (
                <span key={highlight} className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
                  <Award className="h-4 w-4 text-primary" />
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Tools */}
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Plan smarter. Teach with confidence.</h2>
            <p className="mt-4 text-lg text-white/70">
              From lesson ideation to reporting, SchoolTech Hub keeps every part of the teaching journey connected and collaborative.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {workflowTools.map(renderFeatureCard)}
          </div>
        </div>
      </section>

      {/* School Solutions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-xl">
              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                Built for whole-school impact
              </Badge>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                Technology in the classroom that sparks innovation
              </h2>
              <p className="mt-4 text-lg text-white/70">
                Whether you are digitising curriculum, launching AI initiatives, or scaling professional development, SchoolTech Hub gives your team a shared platform to plan, deliver, and measure success.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to={getLocalizedPath("/contact", language)}>
                  <Button size="lg">
                    Talk to our team
                  </Button>
                </Link>
                <Link to={getLocalizedPath("/curriculum", language)}>
                  <Button size="lg" variant="outline">
                    <Users className="mr-2 h-5 w-5" />
                    View school programmes
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
              {schoolSolutions.map(renderFeatureCard)}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
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

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Trusted by teachers leading digital change</h2>
            <p className="mt-4 text-lg text-white/70">
              Hear how schools are building confident, tech-enabled classrooms with SchoolTech Hub.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className={cn("p-6", accentCardClass)}>
                <p className="mb-4 text-white/90 italic">“{testimonial.quote}”</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-white/70">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4">
          <Card
            className={cn(
              "mx-auto max-w-4xl bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-10 text-center",
              accentCardClass,
            )}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold md:text-4xl">
              Ready to design the future of teaching?
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Join SchoolTech Hub and give your staff the digital toolkit to collaborate, innovate, and deliver impactful learning experiences.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={getLocalizedPath("/auth", language)}>
                <Button size="lg">Get started free</Button>
              </Link>
              <Link to={getLocalizedPath("/events", language)}>
                <Button size="lg" variant="outline">
                  <CalendarRange className="mr-2 h-5 w-5" />
                  Join a training session
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
