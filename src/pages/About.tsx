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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <SEO
        title={t.about.seo.title}
        description={t.about.seo.description}
        keywords={t.about.seo.keywords}
        canonicalUrl={t.about.seo.canonical}
      />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-[28rem] w-[28rem] rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-[-8rem] h-[18rem] w-[18rem] rounded-full bg-emerald-500/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-24 md:px-8">
        {/* Story Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-10 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl md:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-80" />
          <div className="relative z-10 space-y-10">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t.about.story.title}</h1>
              <div className="space-y-4 text-lg text-white/75">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white/75 md:grid-cols-[auto,1fr] md:items-center">
              <img
                src="/lovable-uploads/96483919-4154-4163-b949-8ebebd6fb820.png"
                alt="Donald Cjapi - CEO message"
                className="mx-auto h-40 w-40 rounded-2xl border border-white/20 object-cover shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] md:h-48 md:w-48"
              />
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">{t.about.story.ceo.title}</h2>
                <p className="leading-relaxed">{t.about.story.ceo.message}</p>
                {t.about.story.ceo.signature && (
                  <p className="font-medium text-white/90">{t.about.story.ceo.signature}</p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white/75">
              <h2 className="text-2xl font-semibold text-white">{t.about.story.mission.title}</h2>
              <p className="mt-3 leading-relaxed">{t.about.story.mission.description}</p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="rounded-[2rem] border border-white/10 bg-white/10 p-10 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-white">{t.about.values.title}</h2>
            {t.about.values.subtitle && <p className="mt-3 text-base text-white/70">{t.about.values.subtitle}</p>}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {mission.map((item, index) => (
              <Card key={index} className={cn("space-y-4 p-6 text-center", accentCardClass)}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <item.icon className="h-6 w-6 text-emerald-200" />
                </div>
                <h3 className="text-lg font-medium text-white">{item.title}</h3>
                <p className="text-sm text-white/70">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;