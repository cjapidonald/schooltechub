import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Clock, Target, ArrowRight, Quote } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const CaseStudies = () => {
  const [caseStudies, setCaseStudies] = useState<any[]>([]);

  // Sample case studies for demonstration
  const sampleCaseStudies = [
    {
      id: "1",
      title: "Lincoln Elementary: From Tech-Shy to Tech-Savvy",
      slug: "lincoln-elementary-transformation",
      school_name: "Lincoln Elementary School",
      challenge: "Teachers were overwhelmed by new 1:1 Chromebook initiative with minimal training",
      solution: "Implemented phased training program with peer mentoring and weekly tech tips",
      results: "85% of teachers now integrate tech daily, student engagement up 40%",
      testimonial: {
        quote: "The transformation has been incredible. Our teachers went from avoiding technology to actively seeking new tools.",
        author_name: "Dr. Maria Rodriguez",
        author_role: "Principal",
      },
    },
    {
      id: "2",
      title: "Riverside High: Revolutionizing STEM with Simple Tools",
      slug: "riverside-high-stem",
      school_name: "Riverside High School",
      challenge: "Limited budget for STEM resources, outdated computer lab",
      solution: "Leveraged free tools like Google Colab and Tinkercad for virtual labs",
      results: "STEM enrollment increased 60%, AP Computer Science pass rate up 35%",
      testimonial: {
        quote: "We thought we needed expensive equipment. Turns out, we just needed the right strategy.",
        author_name: "James Chen",
        author_role: "STEM Coordinator",
      },
    },
    {
      id: "3",
      title: "Oakwood Middle: Engagement Through Gamification",
      slug: "oakwood-middle-gamification",
      school_name: "Oakwood Middle School",
      challenge: "Post-pandemic engagement crisis, especially in math classes",
      solution: "Introduced classroom gamification with free tools and peer competitions",
      results: "Math scores improved 28%, disciplinary issues down 45%",
      testimonial: {
        quote: "Students are actually excited about math now. The energy in classrooms has completely changed.",
        author_name: "Sarah Williams",
        author_role: "Math Department Head",
      },
    },
    {
      id: "4",
      title: "Maple Grove Primary: Special Ed Success Story",
      slug: "maple-grove-special-ed",
      school_name: "Maple Grove Primary",
      challenge: "Supporting diverse special education needs with limited resources",
      solution: "Customized iPad stations with accessibility features and differentiated apps",
      results: "IEP goal achievement up 50%, parent satisfaction scores at all-time high",
      testimonial: {
        quote: "Technology became the great equalizer for our special needs students.",
        author_name: "Jennifer Park",
        author_role: "Special Education Director",
      },
    },
  ];

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    const { data, error } = await supabase
      .from("case_studies")
      .select(`
        *,
        testimonial:testimonials(*)
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      // Use sample case studies if no data in database
      setCaseStudies(sampleCaseStudies);
    } else {
      setCaseStudies(data?.length ? data : sampleCaseStudies);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Case Studies</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real schools, real challenges, real results. See how educators like you transformed their classrooms.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">200+</p>
              <p className="text-sm text-muted-foreground">Schools Transformed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">73%</p>
              <p className="text-sm text-muted-foreground">Avg. Engagement Increase</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">5hrs</p>
              <p className="text-sm text-muted-foreground">Weekly Time Saved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">95%</p>
              <p className="text-sm text-muted-foreground">Teacher Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-16 px-4 flex-1">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {sampleCaseStudies.map((study) => (
              <Card key={study.id} className="overflow-hidden hover:shadow-large transition-shadow">
                {/* Header with gradient */}
                <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
                  <Badge className="mb-3">{study.school_name}</Badge>
                  <h3 className="text-xl font-bold mb-2">{study.title}</h3>
                </div>

                <div className="p-6">
                  {/* Challenge */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-destructive" />
                      <span className="font-semibold text-sm">Challenge</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{study.challenge}</p>
                  </div>

                  {/* Solution */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Solution</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{study.solution}</p>
                  </div>

                  {/* Results */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-secondary" />
                      <span className="font-semibold text-sm">Results</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{study.results}</p>
                  </div>

                  {/* Testimonial */}
                  {study.testimonial && (
                    <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-accent">
                      <Quote className="h-4 w-4 text-accent mb-2" />
                      <p className="text-sm italic mb-2">"{study.testimonial.quote}"</p>
                      <p className="text-xs font-semibold">{study.testimonial.author_name}</p>
                      <p className="text-xs text-muted-foreground">{study.testimonial.author_role}</p>
                    </div>
                  )}

                  <Button variant="ghost" className="w-full mt-6" asChild>
                    <Link to={`/case-studies/${study.slug}`}>
                      Read Full Story
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="mt-16 p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Write Your Success Story?</h3>
            <p className="text-muted-foreground mb-6">
              Every transformation starts with a single step. Let's discuss how we can help your school 
              achieve similar results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services">
                <Button size="lg">Book a Consultation</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  <Users className="mr-2 h-5 w-5" />
                  Partner With Us
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CaseStudies;