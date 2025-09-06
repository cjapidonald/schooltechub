import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Clock, 
  Users, 
  Target, 
  ChartBar, 
  Sparkles, 
  RefreshCw,
  ArrowRight,
  Quote,
  GraduationCap,
  Zap,
  Shield,
  BookOpen
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
              School Tech Hub
            </h1>
            <p className="mb-8 text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Helping teachers use classroom tech effectively, practically, and confidently.
            </p>
            
            <div className="mb-10 space-y-4 text-left sm:flex sm:space-x-8 sm:space-y-0 sm:text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <div className="flex items-center gap-2 sm:justify-center">
                <Zap className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-foreground">Save 5+ hours weekly on lesson prep</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-center">
                <Users className="h-5 w-5 text-primary animate-pulse delay-150" />
                <span className="text-foreground">Boost student engagement by 40%</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-center">
                <Shield className="h-5 w-5 text-primary animate-pulse delay-300" />
                <span className="text-foreground">Feel confident with AI & tech tools</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Link to="/contact">
                <Button size="lg" className="w-full sm:w-auto hover:scale-105 transition-transform">
                  Book a 1-hour consultation ($20)
                </Button>
              </Link>
              <Link to="/tools">
                <Button size="lg" variant="outline" className="w-full sm:w-auto hover:scale-105 transition-transform">
                  Browse classroom-ready tools
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Teachers Choose School Tech Hub</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom duration-700">
              <Clock className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Save Time</h3>
              <p className="text-muted-foreground">Cut lesson planning time in half with AI-powered tools</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
              <Users className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Boost Engagement</h3>
              <p className="text-muted-foreground">Transform passive learners into active participants</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
              <Target className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Differentiate Easily</h3>
              <p className="text-muted-foreground">Meet every student where they are with adaptive tech</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <ChartBar className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Track Progress</h3>
              <p className="text-muted-foreground">Real-time assessment data without the paperwork</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
              <Sparkles className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Master AI</h3>
              <p className="text-muted-foreground">Use ChatGPT & AI tools confidently in your classroom</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom duration-700 delay-500">
              <RefreshCw className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Build Routines</h3>
              <p className="text-muted-foreground">Create sustainable tech habits that actually stick</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/10 py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">What Teachers Are Saying</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <Quote className="mb-4 h-8 w-8 text-primary/50" />
              <p className="mb-4 text-muted-foreground italic">
                "The AI exit ticket strategies saved me hours of grading time. My students love the instant feedback!"
              </p>
              <p className="font-semibold">Sarah M., 5th Grade</p>
            </Card>
            <Card className="p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <Quote className="mb-4 h-8 w-8 text-primary/50" />
              <p className="mb-4 text-muted-foreground italic">
                "Finally, someone who gets that we need practical solutions, not more theory. Game-changer!"
              </p>
              <p className="font-semibold">James L., High School Science</p>
            </Card>
            <Card className="p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <Quote className="mb-4 h-8 w-8 text-primary/50" />
              <p className="mb-4 text-muted-foreground italic">
                "The workshop transformed how I use tablets for phonics. My K-2 students are more engaged than ever."
              </p>
              <p className="font-semibold">Maria G., Kindergarten</p>
            </Card>
          </div>
          <div className="mt-8 text-center text-muted-foreground">
            <p className="text-lg">Used by teachers in 200+ schools across 15 districts</p>
          </div>
        </div>
      </section>

      {/* Featured Blog Posts */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">Latest from the Blog</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="p-6 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <BookOpen className="mb-4 h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="mb-3 text-xl font-semibold">5 Quick Wins with AI for Busy Teachers</h3>
              <p className="mb-4 text-muted-foreground">
                Transform your daily routines with these simple AI strategies that take less than 5 minutes to implement. From automated feedback to differentiated assignments, start small and see big results.
              </p>
              <p className="mb-4 font-semibold text-primary">Key takeaway: Start with exit tickets</p>
              <Link to="/blog">
                <Button variant="outline" className="group/btn">
                  Read more <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </Card>
            <Card className="p-6 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <GraduationCap className="mb-4 h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="mb-3 text-xl font-semibold">TPR + Tablets: Movement Meets Media</h3>
              <p className="mb-4 text-muted-foreground">
                Combine Total Physical Response with digital tools for maximum engagement. These 7 warm-up activities get students moving while learning, perfect for kinesthetic learners and energetic classrooms.
              </p>
              <p className="mb-4 font-semibold text-primary">Key takeaway: Movement doubles retention</p>
              <Link to="/blog">
                <Button variant="outline" className="group/btn">
                  Read more <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
