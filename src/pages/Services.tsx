import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Users, Target, Calendar, Shield, CreditCard, FileText } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Services = () => {
  const { t } = useLanguage();
  
  const services = [
    {
      id: "consultation",
      title: "1:1 Coaching",
      price: "$30/session",
      duration: "60 minutes",
      description: "Get personalized support for your specific classroom tech challenges",
      features: [
        "Customized to your exact needs",
        "Screen sharing for hands-on help",
        "Action plan you can use tomorrow",
        "Follow-up resources included",
        "Recording available for review",
      ],
      ideal: "Teachers who need quick, targeted solutions",
    },
    {
      id: "whole-staff-pd",
      title: "Whole-Staff PD Program",
      price: "$60",
      duration: "per session",
      description: "Up to 30 staff members (larger groups possible with prior arrangement). Schools can choose any edtech topic most relevant to their needs.",
      features: [
        "60-90 minutes of live, engaging professional development",
        "Hands-on activities and demonstrations",
        "Differentiated by staff experience level (beginners to advanced)",
        "School receives a digital resource hub (guides, templates, links)",
        "30-day follow-up Q&A session (online) for continued support",
      ],
      ideal: "Schools wanting affordable, practical training to build staff confidence in technology",
    },
    {
      id: "custom-dashboard",
      title: "Custom School Dashboard & Tracker Setup",
      price: "$300",
      duration: "flat rate",
      description: "Design and implement custom digital dashboards tailored to your school's needs",
      features: [
        "60-minute consultation to identify your priorities and current tools",
        "Build centralized dashboards (Google Sheets, Airtable, Notion, or Supabase)",
        "Student performance trackers (grades, attendance, behavior, SEL)",
        "Teacher workflow dashboards & leadership dashboards",
        "Ready-to-use templates and staff training",
        "30-day implementation support (email or video check-ins)",
      ],
      ideal: "Schools that want to improve organization, communication, and data-driven decision making",
    },
  ];

  const faqs = [
    {
      question: "What devices do I need?",
      answer: "Any device with internet access works! We'll adapt to whatever you have - Chromebooks, iPads, laptops, or even smartphones.",
    },
    {
      question: "What about school filters and restrictions?",
      answer: "We specialize in working within school constraints. We'll find solutions that work with your existing security settings.",
    },
    {
      question: "How do you handle student privacy?",
      answer: "All recommendations are COPPA and FERPA compliant. We prioritize tools with strong privacy policies and minimal data collection.",
    },
    {
      question: "Can you help with LMS integration?",
      answer: "Yes! We work with Google Classroom, Canvas, Schoology, and most major learning management systems.",
    },
    {
      question: "Do you provide receipts for reimbursement?",
      answer: "Absolutely. You'll receive detailed invoices suitable for school reimbursement or professional development funds.",
    },
    {
      question: "What can I expect after one session?",
      answer: "You'll leave with at least 3 implementable strategies, relevant resources, and confidence to try something new immediately.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('services.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {services.map((service) => (
              <Card key={service.id} className="p-6 hover:shadow-large transition-shadow relative">
                {service.id === "consultation" && (
                  <Badge className="absolute -top-3 -right-3" variant="default">
                    Most Popular
                  </Badge>
                )}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-primary">{service.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration}</span>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{service.description}</p>

                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mb-6 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Ideal for:</span> {service.ideal}
                  </p>
                </div>

                <Link to="/contact">
                  <Button className="w-full">{t('services.bookNow')}</Button>
                </Link>
              </Card>
            ))}
          </div>

          {/* Guarantee */}
          <Card className="p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">{t('services.ourGuarantee')}</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('services.guaranteeText')}
            </p>
          </Card>
        </div>
      </section>

      {/* Booking Process */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('services.howItWorks')}</h2>
          
          <Tabs defaultValue="before" className="max-w-3xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="before">Before</TabsTrigger>
              <TabsTrigger value="during">During</TabsTrigger>
              <TabsTrigger value="after">After</TabsTrigger>
            </TabsList>
            
            <TabsContent value="before" className="mt-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">What to Prepare</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Target className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Your biggest challenge</p>
                      <p className="text-sm text-muted-foreground">What's the #1 thing you want to solve?</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Your classroom context</p>
                      <p className="text-sm text-muted-foreground">Grade level, subject, class size</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Available technology</p>
                      <p className="text-sm text-muted-foreground">What devices and tools you can access</p>
                    </div>
                  </li>
                </ul>
              </Card>
            </TabsContent>
            
            <TabsContent value="during" className="mt-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Your Session</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <span>Quick assessment of your current setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <span>Hands-on demonstration of solutions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <span>Practice with immediate feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <span>Q&A for your specific situation</span>
                  </li>
                </ul>
              </Card>
            </TabsContent>
            
            <TabsContent value="after" className="mt-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Follow-Up Support</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <span>Written summary of strategies discussed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <span>Links to all resources mentioned</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <span>Recording available for 30 days (if applicable)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <span>Email support for clarifications</span>
                  </li>
                </ul>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('services.faq')}</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/contact">
              <Button size="lg" className="shadow-large">
                Book Your Session Today
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Questions? Email us at dcjapi@gmail.com
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;