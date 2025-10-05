import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Users, Target, Calendar, Shield, FileText, Sparkles } from "lucide-react";
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
    "border border-white/15 bg-white/10 text-white shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25";

  const iconMap = {
    target: Target,
    users: Users,
    fileText: FileText,
    check: CheckCircle,
  } as const;

  const defaultTab = steps?.tabs?.[0]?.value ?? "before";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
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

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-[-10rem] h-[18rem] w-[18rem] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-24 md:px-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-10 text-center shadow-[0_25px_80px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-80" />
          <div className="absolute inset-y-0 right-[-20%] hidden w-[50%] rounded-full bg-gradient-to-br from-cyan-400/30 via-transparent to-transparent blur-3xl md:block" />
          <div className="relative z-10 space-y-6">
            <Badge className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
              <Target className="h-4 w-4" />
              {pageContent.badge}
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{pageContent.header.title}</h1>
            <p className="mx-auto max-w-2xl text-lg text-white/75">{pageContent.header.subtitle}</p>
          </div>
        </section>

        {/* Services */}
        <section className="grid gap-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className={cn("relative flex h-full flex-col gap-6 p-6", accentCardClass)}>
                {service.highlight && (
                  <Badge className="absolute -top-3 right-6 flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white">
                    <Sparkles className="h-3 w-3" />
                    {pageContent.badge}
                  </Badge>
                )}

                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-white">{service.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-base font-semibold text-white">
                      {service.price}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-white/60" />
                      <span>{service.duration}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-white/70">{service.description}</p>

                <ul className="space-y-3 text-sm text-white/75">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <CheckCircle className="mt-1 h-4 w-4 text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  <span className="font-medium text-white">{pageContent.idealLabel}</span> {service.ideal}
                </div>

                <Link to={getLocalizedPath("/contact", language)} className="mt-auto block">
                  <Button className="w-full rounded-2xl bg-white/90 text-slate-900 shadow-[0_15px_45px_-25px_rgba(226,232,240,0.9)] hover:bg-white">
                    {pageContent.bookNow}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          {/* Guarantee */}
          <Card className={cn("relative overflow-hidden p-10 text-center", accentCardClass)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.25)_0%,_rgba(15,23,42,0)_70%)] opacity-90" />
            <div className="relative z-10 space-y-4">
              <Shield className="mx-auto h-12 w-12 text-emerald-300" />
              <h3 className="text-3xl font-semibold text-white">{guarantee.title}</h3>
              <p className="mx-auto max-w-2xl text-base text-white/75">{guarantee.description}</p>
            </div>
          </Card>
        </section>

        {/* Booking Process */}
        <section className="rounded-[2rem] border border-white/10 bg-white/10 p-10 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
          <div className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
            <h2 className="text-3xl font-semibold text-white">{steps.title}</h2>
            {steps.subtitle && <p className="text-base text-white/70">{steps.subtitle}</p>}
          </div>

          <Tabs defaultValue={defaultTab} className="mt-10">
            <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-3 rounded-2xl border border-white/15 bg-white/5 p-1 text-white/80">
              {steps.tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="rounded-2xl data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {steps.tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-10">
                <Card className={cn("space-y-5 p-8", accentCardClass)}>
                  <h3 className="text-2xl font-semibold text-white">{tab.title}</h3>
                  <ul className="space-y-4 text-sm text-white/75">
                    {tab.items.map((item, index) => {
                      const Icon = iconMap[item.icon as keyof typeof iconMap] ?? CheckCircle;

                      return (
                        <li key={index} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <Icon className="mt-1 h-5 w-5 text-cyan-200" />
                          {item.title ? (
                            <div className="space-y-1">
                              <p className="font-medium text-white">{item.title}</p>
                              {item.description && <p>{item.description}</p>}
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
        </section>

        {/* FAQs */}
        <section className="rounded-[2rem] border border-white/10 bg-white/10 p-10 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-white">{faqs.title}</h2>
            {faqs.description && <p className="mt-3 text-base text-white/70">{faqs.description}</p>}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {faqs.items.map((faq, index) => (
              <Card key={index} className={cn("space-y-3 p-6", accentCardClass)}>
                <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                <p className="text-sm text-white/75">{faq.answer}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <Link to={getLocalizedPath("/contact", language)}>
              <Button size="lg" className="rounded-2xl bg-white/90 px-8 text-slate-900 shadow-[0_15px_45px_-25px_rgba(226,232,240,0.9)] hover:bg-white">
                {faqs.cta.button}
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-white/70">
              {faqs.cta.note}{" "}
              <a className="text-white underline" href={`mailto:${faqs.cta.email}`}>
                {faqs.cta.email}
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Services;