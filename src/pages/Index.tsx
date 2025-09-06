import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MouseGlowEffect from "@/components/MouseGlowEffect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
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
  ChevronRight
} from "lucide-react";
import heroImage from "@/assets/futuristic-classroom-hero.jpg";
import aiCollabImage from "@/assets/ai-collaboration.jpg";
import holoTeachImage from "@/assets/holographic-teaching.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MouseGlowEffect />
      <Navigation />
      
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-20" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Futuristic Classroom" 
            className="h-full w-full object-cover opacity-40"
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
              <span className="text-sm font-medium text-primary">Welcome to the Future of Education</span>
            </div>
            
            <h1 className="mb-6 font-orbitron text-6xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                SchoolTech
              </span>
              <br />
              <span className="text-foreground">Hub</span>
            </h1>
            
            <p className="mb-8 text-xl text-muted-foreground font-space animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Empowering educators with cutting-edge AI and immersive technology
              <br />for tomorrow's digital natives
            </p>
            
            <div className="mb-12 flex flex-wrap justify-center gap-6 text-sm font-space animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary animate-pulse-glow" />
                <span className="text-foreground">AI-Powered Learning</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent animate-pulse-glow delay-150" />
                <span className="text-foreground">Virtual Reality Classrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary animate-pulse-glow delay-300" />
                <span className="text-foreground">Real-time Analytics</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Link to="/contact">
                <Button 
                  size="lg" 
                  className="group relative overflow-hidden bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[0_0_40px_hsl(var(--glow-primary)/0.5)] transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Tech Journey
                    <Rocket className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link to="/tools">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary/30 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.3)] transition-all duration-300"
                >
                  Explore AI Tools
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
              Next-Gen Educational Technology
            </h2>
            <p className="text-muted-foreground font-space">Transform your classroom into a hub of innovation</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Brain,
                title: "AI Teaching Assistant",
                description: "24/7 personalized learning support with advanced natural language processing",
                color: "primary"
              },
              {
                icon: Globe,
                title: "Virtual Reality Labs",
                description: "Immersive 3D environments for hands-on learning experiences",
                color: "accent"
              },
              {
                icon: Binary,
                title: "Quantum Computing",
                description: "Introduce students to the future of computational thinking",
                color: "secondary"
              },
              {
                icon: Shield,
                title: "Blockchain Credentials",
                description: "Secure, verifiable digital certificates and achievements",
                color: "primary"
              },
              {
                icon: Wifi,
                title: "IoT Integration",
                description: "Connected classroom devices for seamless collaboration",
                color: "accent"
              },
              {
                icon: Monitor,
                title: "Holographic Displays",
                description: "3D projections for interactive lessons and presentations",
                color: "secondary"
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <feature.icon className={`mb-4 h-12 w-12 text-${feature.color} animate-pulse-glow`} />
                  <h3 className="mb-2 text-xl font-semibold font-orbitron">{feature.title}</h3>
                  <p className="text-muted-foreground font-space">{feature.description}</p>
                  <div className="mt-4 flex items-center text-primary group-hover:text-accent transition-colors">
                    <span className="text-sm font-medium">Learn more</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Showcase */}
      <section className="relative py-20 bg-gradient-to-b from-background via-card/30 to-background">
        <div className="container">
          <h2 className="text-4xl font-orbitron font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Experience the Future Today
          </h2>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="overflow-hidden border-primary/30 bg-card/50 backdrop-blur-sm">
              <img 
                src={aiCollabImage} 
                alt="AI Collaboration" 
                className="h-64 w-full object-cover opacity-80"
              />
              <div className="p-6">
                <h3 className="text-2xl font-orbitron font-semibold mb-3">AI-Powered Collaboration</h3>
                <p className="text-muted-foreground font-space mb-4">
                  Students work alongside AI tutors for personalized learning paths, instant feedback, 
                  and adaptive challenges that grow with their abilities.
                </p>
                <Button variant="outline" className="group border-primary/30 hover:border-primary hover:bg-primary/10">
                  See it in action
                  <Sparkles className="ml-2 h-4 w-4 group-hover:animate-pulse-glow" />
                </Button>
              </div>
            </Card>
            
            <Card className="overflow-hidden border-accent/30 bg-card/50 backdrop-blur-sm">
              <img 
                src={holoTeachImage} 
                alt="Holographic Teaching" 
                className="h-64 w-full object-cover opacity-80"
              />
              <div className="p-6">
                <h3 className="text-2xl font-orbitron font-semibold mb-3">Holographic Learning</h3>
                <p className="text-muted-foreground font-space mb-4">
                  Bring abstract concepts to life with 3D holographic projections. From molecular 
                  structures to historical events, make learning tangible.
                </p>
                <Button variant="outline" className="group border-accent/30 hover:border-accent hover:bg-accent/10">
                  Explore demos
                  <BookOpen className="ml-2 h-4 w-4 group-hover:animate-pulse-glow" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { value: "10K+", label: "AI-Powered Lessons", icon: Brain },
              { value: "500+", label: "VR Experiences", icon: Globe },
              { value: "98%", label: "Engagement Rate", icon: Zap },
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
              <h2 className="text-4xl font-orbitron font-bold mb-4">Ready to Transform Your Classroom?</h2>
              <p className="text-xl text-muted-foreground font-space mb-8 max-w-2xl mx-auto">
                Join thousands of educators leveraging AI and immersive technology to create 
                unforgettable learning experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_40px_hsl(var(--glow-primary)/0.5)]">
                    Get Started Today
                    <Rocket className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary hover:bg-primary/10">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;