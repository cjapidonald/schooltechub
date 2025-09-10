import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Target, ArrowLeft, Quote, Clock, Calendar } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RichContent from "@/components/RichContent";
import { SEO } from "@/components/SEO";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruybexkjupmannggnstn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eWJleGtqdXBtYW5uZ2duc3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTk3MTYsImV4cCI6MjA3MjgzNTcxNn0.n2MlQf65ggrUVW1nSXKMvoSsyBe9cxY_ElOHvMD5Das";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface CaseStudy {
  id: string;
  title: string;
  school_name: string;
  challenge: string;
  solution: any;
  results: any;
  testimonial?: {
    quote: string;
    author_name: string;
    author_role: string;
    school_name?: string;
    picture_url?: string;
    company?: string;
  };
  created_at?: string;
}

const CaseStudyDetail = () => {
  const { slug } = useParams();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);

  // Sample case studies matching those from CaseStudies page
  const sampleCaseStudies: Record<string, CaseStudy> = {
    "lincoln-elementary-transformation": {
      id: "1",
      title: "Lincoln Elementary: From Tech-Shy to Tech-Savvy",
      school_name: "Lincoln Elementary School",
      challenge: "Teachers were overwhelmed by new 1:1 Chromebook initiative with minimal training",
      solution: "Implemented phased training program with peer mentoring and weekly tech tips",
      results: "85% of teachers now integrate tech daily, student engagement up 40%",
      testimonial: {
        quote: "The transformation has been incredible. Our teachers went from avoiding technology to actively seeking new tools.",
        author_name: "Dr. Maria Rodriguez",
        author_role: "Principal",
        company: "Lincoln School District"
      },
      created_at: new Date().toISOString()
    },
    "riverside-high-stem": {
      id: "2",
      title: "Riverside High: Revolutionizing STEM with Simple Tools",
      school_name: "Riverside High School",
      challenge: "Limited budget for STEM resources, outdated computer lab",
      solution: "Leveraged free tools like Google Colab and Tinkercad for virtual labs",
      results: "STEM enrollment increased 60%, AP Computer Science pass rate up 35%",
      testimonial: {
        quote: "We thought we needed expensive equipment. Turns out, we just needed the right strategy.",
        author_name: "James Chen",
        author_role: "STEM Coordinator",
        company: "Riverside Unified"
      },
      created_at: new Date().toISOString()
    },
    "oakwood-middle-gamification": {
      id: "3",
      title: "Oakwood Middle: Engagement Through Gamification",
      school_name: "Oakwood Middle School",
      challenge: "Post-pandemic engagement crisis, especially in math classes",
      solution: "Introduced classroom gamification with free tools and peer competitions",
      results: "Math scores improved 28%, disciplinary issues down 45%",
      testimonial: {
        quote: "Students are actually excited about math now. The energy in classrooms has completely changed.",
        author_name: "Sarah Williams",
        author_role: "Math Department Head",
        company: "Oakwood School District"
      },
      created_at: new Date().toISOString()
    },
    "maple-grove-special-ed": {
      id: "4",
      title: "Maple Grove Primary: Special Ed Success Story",
      school_name: "Maple Grove Primary",
      challenge: "Supporting diverse special education needs with limited resources",
      solution: "Customized iPad stations with accessibility features and differentiated apps",
      results: "IEP goal achievement up 50%, parent satisfaction scores at all-time high",
      testimonial: {
        quote: "Technology became the great equalizer for our special needs students.",
        author_name: "Jennifer Park",
        author_role: "Special Education Director",
        company: "Maple Grove School System"
      },
      created_at: new Date().toISOString()
    }
  };

  useEffect(() => {
    fetchCaseStudy();
  }, [slug]);

  const fetchCaseStudy = async () => {
    if (!slug) return;
    
    // First try to get from database with simplified query - use 'as any' to avoid type depth issue
    const result: any = await supabase
      .from("case_studies")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    
    const { data, error } = result;

    if (error) {
      console.error("Error fetching case study:", error);
      
      // If no data from database, use sample data
      if (sampleCaseStudies[slug]) {
        setCaseStudy(sampleCaseStudies[slug]);
      } else {
        setCaseStudy(null);
      }
      setLoading(false);
      return;
    }

    // If we have a case study, fetch its testimonial separately
    let caseStudyToSet: CaseStudy = {
      id: data.id,
      title: data.title,
      school_name: data.school_name,
      challenge: data.challenge || "",
      solution: data.solution,
      results: data.results,
      created_at: data.created_at
    };

    if (data && data.testimonial_id) {
      const { data: testimonialData } = await supabase
        .from("testimonials")
        .select("*")
        .eq("id", data.testimonial_id)
        .single();
      
      if (testimonialData) {
        caseStudyToSet.testimonial = {
          quote: testimonialData.quote,
          author_name: testimonialData.author_name,
          author_role: testimonialData.author_role || "",
          school_name: testimonialData.school_name,
          picture_url: testimonialData.picture_url,
          company: testimonialData.company
        };
      }
    }

    setCaseStudy(caseStudyToSet);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Case Study Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The case study you're looking for doesn't exist.
            </p>
            <Link to="/case-studies">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Case Studies
              </Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={caseStudy.title}
        description={`Learn how ${caseStudy.school_name} transformed their classroom with technology. ${caseStudy.challenge}`}
        keywords="school technology case study, edtech success story, classroom transformation"
        canonicalUrl={`https://schooltechhub.com/case-studies/${slug}`}
      />
      <Navigation />

      <article className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Link to="/case-studies">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case Studies
            </Button>
          </Link>

          {/* Header */}
          <header className="mb-12">
            <Badge className="mb-4">{caseStudy.school_name}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{caseStudy.title}</h1>
            {caseStudy.created_at && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(caseStudy.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>5 min read</span>
                </div>
              </div>
            )}
          </header>

          {/* Challenge Section */}
          <Card className="mb-8 p-8 bg-destructive/5 border-l-4 border-destructive">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-destructive" />
              <h2 className="text-2xl font-bold">The Challenge</h2>
            </div>
            <p className="text-lg text-muted-foreground">{caseStudy.challenge}</p>
          </Card>

          {/* Solution Section */}
          <Card className="mb-8 p-8 bg-primary/5 border-l-4 border-primary">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">The Solution</h2>
            </div>
            <div className="text-lg">
              {typeof caseStudy.solution === 'string' ? (
                <p>{caseStudy.solution}</p>
              ) : (
                <RichContent content={caseStudy.solution as any} />
              )}
            </div>
          </Card>

          {/* Results Section */}
          <Card className="mb-8 p-8 bg-secondary/5 border-l-4 border-secondary">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-secondary" />
              <h2 className="text-2xl font-bold">The Results</h2>
            </div>
            <div className="text-lg font-medium">
              {typeof caseStudy.results === 'string' ? (
                <p>{caseStudy.results}</p>
              ) : Array.isArray(caseStudy.results) && typeof (caseStudy.results as any[])[0] === 'string' ? (
                // Handle legacy text[] format
                <ul className="list-disc list-inside space-y-2">
                  {(caseStudy.results as string[]).map((result: string, idx: number) => (
                    <li key={idx}>{result}</li>
                  ))}
                </ul>
              ) : (
                // Handle new jsonb format
                <RichContent content={caseStudy.results as any} />
              )}
            </div>
          </Card>

          {/* Testimonial */}
          {caseStudy.testimonial && (
            <Card className="mb-12 p-8 bg-accent/5">
              <Quote className="h-8 w-8 text-accent mb-4" />
              <blockquote className="text-xl italic mb-4">
                "{caseStudy.testimonial.quote}"
              </blockquote>
              <footer className="flex items-center gap-4">
                {caseStudy.testimonial.picture_url && (
                  <img 
                    src={caseStudy.testimonial.picture_url} 
                    alt={caseStudy.testimonial.author_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{caseStudy.testimonial.author_name}</p>
                  <p className="text-muted-foreground">{caseStudy.testimonial.author_role}</p>
                  {caseStudy.testimonial.company && (
                    <p className="text-sm text-muted-foreground">{caseStudy.testimonial.company}</p>
                  )}
                </div>
              </footer>
            </Card>
          )}

          {/* Call to action */}
          <Card className="p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your School?</h3>
            <p className="text-muted-foreground mb-6">
              Let's discuss how we can help you achieve similar results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services">
                <Button size="lg">Book a Consultation</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Partner With Us
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default CaseStudyDetail;