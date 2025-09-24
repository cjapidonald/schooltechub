import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { useLanguage } from "@/contexts/LanguageContext";
import { HelpCircle } from "lucide-react";
import RichContent from "@/components/RichContent";
import type { Json } from "@/integrations/supabase/types";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  display_order: number;
}

const FAQ = () => {
  const { t } = useLanguage();
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
        title="FAQ"
        description="Find answers to frequently asked questions about our educational technology services, AI tools, VR classrooms, and teacher management software"
        keywords="FAQ, frequently asked questions, edtech help, tech support, AI education, VR learning, teacher tools"
        canonicalUrl="https://schooltechub.com/faq"
      />
      {faqs.length > 0 && (
        <StructuredData
          type="FAQPage"
          data={{
            mainEntity: faqs.map(faq => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: typeof faq.answer === 'string' ? faq.answer : JSON.stringify(faq.answer)
              }
            }))
          }}
        />
      )}
      <main className="flex-1">
        <div className="container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">{t.faq.hero.title}</h1>
              <p className="text-lg text-white">
                {t.faq.hero.subtitle}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">{t.faq.loading}</div>
            ) : Object.keys(groupedFAQs).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-white">
                  {t.faq.empty}
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
                              <RichContent content={faq.answer as any} />
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
                <h3 className="text-lg font-semibold mb-2">{t.faq.cta.title}</h3>
                <p className="text-white mb-4">
                  {t.faq.cta.subtitle}
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  {t.faq.cta.button}
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

    </div>
  );
};

export default FAQ;