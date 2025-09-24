import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Users, BookOpen, Target, Heart, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { cn } from "@/lib/utils";

const About = () => {
  const { language, t } = useLanguage();

  const missionIcons = [Target, Heart, Lightbulb];
  const mission = (t.about.values.items ?? []).map((item, index) => ({
    ...item,
    icon: missionIcons[index] ?? Target,
  }));
  const stats = t.about.stats.items ?? [];
  const storyParagraphs = t.about.story.paragraphs ?? [];
  const certifications = t.about.credentials.certifications.items ?? [];
  const featured = t.about.credentials.featured.items ?? [];
  const expertise = t.about.expertise.items ?? [];
  const testimonials = t.about.testimonials.items ?? [];
  const faqs = t.about.faq.items ?? [];

  const accentCardClass =
    "border-2 border-primary/35 shadow-[0_0_20px_hsl(var(--glow-primary)/0.08)] transition-colors duration-300 hover:border-primary/75";

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={t.about.seo.title}
        description={t.about.seo.description}
        keywords={t.about.seo.keywords}
        canonicalUrl={t.about.seo.canonical}
      />

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t.about.hero.title}</h1>
            <p className="text-xl text-white">{t.about.hero.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto">
            <Card className={cn("p-8 bg-gradient-to-br from-card to-primary/5", accentCardClass)}>
              <h2 className="text-2xl font-bold mb-6">{t.about.story.title}</h2>
              <div className="space-y-4 text-white">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-bold mb-4">{t.about.story.ceo.title}</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <img
                    src="/lovable-uploads/96483919-4154-4163-b949-8ebebd6fb820.png"
                    alt="Donald Cjapi - CEO message"
                    className="w-48 h-48 rounded-lg object-cover shadow-lg md:w-64 md:h-64"
                  />
                  <div className="flex-1">
                    <p className="text-white leading-relaxed">{t.about.story.ceo.message}</p>
                    {t.about.story.ceo.signature && (
                      <p className="font-semibold mt-4">{t.about.story.ceo.signature}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-bold mb-4">{t.about.story.mission.title}</h3>
                <p className="text-white">{t.about.story.mission.description}</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t.about.values.title}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {mission.map((item, index) => (
              <Card key={index} className={cn("p-6 text-center", accentCardClass)}>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-white">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">{stat.number}</p>
                <p className="text-sm text-white">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto">
            <Card className={cn("p-8", accentCardClass)}>
              <h2 className="text-2xl font-bold mb-6">{t.about.credentials.title}</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">{t.about.credentials.certifications.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((certification, index) => (
                      <Badge key={index} variant="secondary">
                        {certification}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{t.about.credentials.featured.title}</h3>
                  <div className="flex flex-wrap gap-4 opacity-60">
                    {featured.map((item, index) => (
                      <div
                        key={index}
                        className="w-32 h-12 bg-muted rounded flex items-center justify-center text-xs"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{t.about.credentials.partnerships.title}</h3>
                  <p className="text-white mb-4">{t.about.credentials.partnerships.description}</p>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    {t.about.credentials.partnerships.cta}
                  </Button>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <Card
              className={cn(
                "mt-8 p-8 text-center bg-gradient-to-r from-primary/10 to-secondary/10",
                accentCardClass,
              )}
            >
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">{t.about.cta.title}</h3>
              <p className="text-white mb-6">{t.about.cta.description}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={getLocalizedPath("/services", language)}>
                  <Button size="lg">{t.about.cta.primary}</Button>
                </Link>
                <Link to={getLocalizedPath("/tools", language)}>
                  <Button size="lg" variant="outline">
                    <BookOpen className="mr-2 h-5 w-5" />
                    {t.about.cta.secondary}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t.about.expertise.title}</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {expertise.map((item, index) => (
              <Card key={index} className={cn("p-6 text-center", accentCardClass)}>
                <Award className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-sm">{item}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t.about.testimonials.title}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className={cn("p-6", accentCardClass)}>
                <p className="text-white mb-4 italic">“{testimonial.quote}”</p>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-white">{testimonial.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30" id="faq">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t.about.faq.title}</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className={cn("p-6", accentCardClass)}>
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-white">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;