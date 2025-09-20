import { useEffect, useState, useRef } from "react";
import MouseGlowEffect from "@/components/MouseGlowEffect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Cpu, 
  Brain, 
  Sparkles,
  Zap,
  Shield,
  BookOpen,
  ArrowRight,
  Rocket,
  Globe,
  Binary,
  Wifi,
  Monitor,
  ChevronRight,
  Gamepad2,
  Database,
  UserCog,
  GraduationCap,
  FileCheck,
  Layout,
  Facebook,
  Instagram,
  Linkedin,
  Mail
} from "lucide-react";
import heroImage from "@/assets/futuristic-classroom-hero.jpg";
import aiCollabImage from "@/assets/ai-collaboration.jpg";
import holoTeachImage from "@/assets/holographic-teaching.jpg";

const Index = () => {
  const [counters, setCounters] = useState({ lessons: 0, vr: 0, engagement: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            // Animate counters
            const duration = 2000;
            const steps = 60;
            const interval = duration / steps;
            let currentStep = 0;

            const timer = setInterval(() => {
              currentStep++;
              const progress = currentStep / steps;
              
              setCounters({
                lessons: Math.floor(10000 * progress),
                vr: Math.floor(500 * progress),
                engagement: Math.floor(98 * progress)
              });

              if (currentStep >= steps) {
                clearInterval(timer);
              }
            }, interval);
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
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEO 
        title="Home"
        description="Transform your classroom with SchoolTech Hub's AI-powered educational technology. Explore VR labs, gamification tools, and teacher management software. Get started for free today"
        keywords="AI education platform, virtual reality classroom, gamification in education, teacher management software, student tracking system, curriculum development tools, educational technology Albania, auto graded homework, classroom management software"
        canonicalUrl="https://schooltechhub.com"
      />
      <StructuredData type="Organization" data={{}} />
      <MouseGlowEffect />
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-20" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
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
        
        {/* Animated Particles */}
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
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary animate-pulse-glow" />
                <span className="text-foreground">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent animate-pulse-glow delay-150" />
                <span className="text-foreground">VR Classrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary animate-pulse-glow delay-300" />
                <span className="text-foreground">Real-Time Analytics</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Link to="/contact">
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
              <Link to="/edutech">
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

        {/* Scanning line effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-orbitron font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t.features.title}
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Brain,
                title: t.features.feature1.title,
                description: t.features.feature1.description,
                color: "primary"
              },
              {
                icon: Globe,
                title: t.features.feature2.title,
                description: t.features.feature2.description,
                color: "accent"
              },
              {
                icon: Gamepad2,
                title: t.features.feature3.title,
                description: t.features.feature3.description,
                color: "secondary"
              },
              {
                icon: Database,
                title: t.features.feature4.title,
                description: t.features.feature4.description,
                color: "primary"
              },
              {
                icon: Layout,
                title: t.features.feature5.title,
                description: t.features.feature5.description,
                color: "accent"
              },
              {
                icon: BookOpen,
                title: t.features.feature6.title,
                description: t.features.feature6.description,
                color: "secondary"
              }
            ].map((feature, index) => (
              <Link to="/edutech" key={index} className="block">
                <Card 
                  className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.2)] cursor-pointer h-full"
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


      {/* Stats Section with animated counters */}
      <section className="relative py-20" ref={statsRef}>
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { value: `${counters.lessons.toLocaleString()}+`, label: "AI-Powered Lessons", icon: Brain },
              { value: `${counters.vr}+`, label: "VR Experiences", icon: Globe },
              { value: `${counters.engagement}%`, label: "Engagement Rate", icon: Zap },
              { value: "24/7", label: "Support Available", icon: Shield }
            ].map((stat, index) => (
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

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="container">
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-12 text-center">
            <div className="absolute inset-0 bg-cyber-grid bg-[size:30px_30px] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-orbitron font-bold mb-4">Ready to Transform Your School?</h2>
              <p className="text-xl text-muted-foreground font-space mb-8 max-w-2xl mx-auto">
                Join thousands of educators who are already using our platform to create better learning experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to="/contact">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_40px_hsl(var(--glow-primary)/0.5)]">
                    Get Started
                    <Rocket className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary hover:bg-primary/10">
                    View Pricing
                  </Button>
                </Link>
              </div>
              
              {/* Social Media Icons */}
              <div className="flex justify-center space-x-4">
                <a 
                  href="https://www.facebook.com/share/g/1NukWcXVpp/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  aria-label="Facebook"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a 
                  href="https://www.instagram.com/schooltechhub/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  aria-label="Instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
                <a 
                  href="https://www.linkedin.com/in/donald-cjapi-b7800a383/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
                <a 
                  href="mailto:dcjapi@gmail.com" 
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  aria-label="Email"
                >
                  <Mail className="h-6 w-6" />
                </a>
              </div>
            </div>
          </Card>
        </div>
      </section>

    </div>
  );
};

export default Index;
