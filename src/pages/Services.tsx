import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Users, Target, Calendar, Shield, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { cn } from "@/lib/utils";
// Import removed - useContent hook no longer exists

const Services = () => {
  const { language, t } = useLanguage();

  const pageContent = t.services.page;
  const services = t.services.packages;
  const guarantee = t.services.guarantee;
  const steps = t.services.steps;
  const faqs = t.services.faq;

  const accentCardClass =
    "border-2 border-primary/40 shadow-[0_0_22px_hsl(var(--glow-primary)/0.08)] transition-colors duration-300 hover:border-primary/80";

  const iconMap = {
    target: Target,
    users: Users,
    fileText: FileText,
    check: CheckCircle,
  } as const;

  const defaultTab = steps?.tabs?.[0]?.value ?? "before";

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={pageContent.seo.title}
        description={pageContent.seo.description}
        keywords={pageContent.seo.keywords}
        canonicalUrl="https://schooltechhub.com/services"
      />
      <StructuredData
        type="Service"
        data={{
          serviceType: pageContent.structuredData.serviceType,
          services: services.map((s) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": s.title,
              "description": s.description,
              "price": s.price.replace(/[^0-9.]/g, ''),
              "priceCurrency": "USD"
            }
          }))
        }}
      />

      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{pageContent.header.title}</h1>
          <p className="text-xl text-white max-w-2xl mx-auto">
            {pageContent.header.subtitle}
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {services.map((service) => (
              <Card
                key={service.id}
                className={cn("relative p-6 transition-shadow hover:shadow-large", accentCardClass)}
              >
                {service.highlight && (
                  <Badge className="absolute -top-3 -right-3" variant="default">
                    {pageContent.badge}
                  </Badge>
                )}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-primary">{service.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration}</span>
                  </div>
                </div>

                <p className="text-white mb-6">{service.description}</p>

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
                    <span className="font-semibold">{pageContent.idealLabel}</span> {service.ideal}
                  </p>
                </div>

                <Link to={getLocalizedPath("/contact", language)}>
                  <Button className="w-full">{pageContent.bookNow}</Button>
                </Link>
              </Card>
            ))}
          </div>

          {/* Guarantee */}
          <Card
            className={cn(
              "p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5",
              accentCardClass,
            )}
          >
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">{guarantee.title}</h3>
            <p className="text-lg text-white max-w-2xl mx-auto">
              {guarantee.description}
            </p>
          </Card>
        </div>
      </section>

      {/* Booking Process */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{steps.title}</h2>

          <Tabs defaultValue={defaultTab} className="max-w-3xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              {steps.tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {steps.tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-8">
                <Card className={cn("p-6", accentCardClass)}>
                  <h3 className="text-xl font-semibold mb-4">{tab.title}</h3>
                  <ul className="space-y-3">
                    {tab.items.map((item, index) => {
                      const Icon = iconMap[item.icon as keyof typeof iconMap] ?? CheckCircle;

                      return (
                        <li key={index} className="flex items-start gap-2">
                          <Icon className={`h-5 w-5 ${item.icon === "target" || item.icon === "users" || item.icon === "fileText" ? "text-primary" : "text-secondary"} mt-0.5 flex-shrink-0`} />
                          {item.title ? (
                            <div>
                              <p className="font-medium">{item.title}</p>
                              {item.description && (
                                <p className="text-sm text-white">{item.description}</p>
                              )}
                            </div>
                          ) : (
                            <span>{item.text}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{faqs.title}</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.items.map((faq, index) => (
              <Card key={index} className={cn("p-6", accentCardClass)}>
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-white">{faq.answer}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to={getLocalizedPath("/contact", language)}>
              <Button size="lg" className="shadow-large">
                {faqs.cta.button}
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-white mt-4">
              {faqs.cta.note} <a className="underline" href={`mailto:${faqs.cta.email}`}>{faqs.cta.email}</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;