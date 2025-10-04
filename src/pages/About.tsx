import { Card } from "@/components/ui/card";
import { Target, Heart, Lightbulb } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const About = () => {
  const { t } = useLanguage();

  const missionIcons = [Target, Heart, Lightbulb];
  const mission = (t.about.values.items ?? []).map((item, index) => ({
    ...item,
    icon: missionIcons[index] ?? Target,
  }));
  const storyParagraphs = t.about.story.paragraphs ?? [];

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
    </div>
  );
};

export default About;