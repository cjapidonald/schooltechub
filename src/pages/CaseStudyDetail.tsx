import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Target, ArrowLeft, Quote } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RichContent from "@/components/RichContent";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import type { Json } from "@/integrations/supabase/types";

interface CaseStudy {
  id: string;
  title: string;
  school_name: string;
  challenge: string;
  solution: Json;
  results: Json;
  testimonial?: any;
}

const CaseStudyDetail = () => {
  const { slug } = useParams();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseStudy();
  }, [slug]);

  const fetchCaseStudy = async () => {
    if (!slug) return;
    
    const { data, error } = await supabase
      .from("case_studies")
      .select(`
        *,
        testimonial:testimonials(*)
      `)
      .eq("id", slug)
      .eq("is_published", true)
      .single();

    if (error) {
      console.error("Error fetching case study:", error);
      setLoading(false);
      return;
    }

    setCaseStudy(data);
    setLoading(false);
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
        canonicalUrl={`https://schooltechhub.com/case-studies/${caseStudy.slug}`}
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
              <RichContent content={caseStudy.solution as any} />
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
              <footer>
                <p className="font-semibold">{caseStudy.testimonial.author_name}</p>
                <p className="text-muted-foreground">{caseStudy.testimonial.author_role}</p>
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