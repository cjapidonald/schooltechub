import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("faq")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedFAQs = faqs.reduce((acc, faq) => {
    const category = faq.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="FAQ - School Tech Hub"
        description="Find answers to frequently asked questions about our educational technology services and tools"
        keywords="FAQ, frequently asked questions, edtech help, tech support"
      />
      <Navigation />
      
      <main className="flex-1">
        <div className="container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
              <p className="text-lg text-muted-foreground">
                Get answers to common questions about our services and tools
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading FAQs...</div>
            ) : Object.keys(groupedFAQs).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No FAQs available at the moment.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedFAQs).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle>{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {items.map((faq) => (
                          <AccordionItem key={faq.id} value={faq.id}>
                            <AccordionTrigger className="text-left">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent>
                              <p className="text-muted-foreground">{faq.answer}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="mt-12">
              <CardContent className="py-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-4">
                  Our team is here to help you with any additional questions
                </p>
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Contact Us
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;