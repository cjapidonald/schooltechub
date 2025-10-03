import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { en } from "@/translations/en";
import { sq } from "@/translations/sq";
import { vi } from "@/translations/vi";

type RouteLink = {
  title: string;
  url: string;
};

type DynamicLink = RouteLink & {
  updatedAt?: string | null;
  language?: string | null;
};

type TranslationDictionary = typeof en;

const supportedLanguages = [
  { code: "en", dictionary: en },
  { code: "sq", dictionary: sq },
  { code: "vi", dictionary: vi },
] as const;

const createStaticRoutes = (dictionary: TranslationDictionary): RouteLink[] => [
  { title: dictionary.nav.home, url: "/" },
  { title: dictionary.nav.about, url: "/about" },
  { title: dictionary.nav.services, url: "/services" },
  { title: dictionary.nav.blog, url: "/blog" },
  { title: dictionary.nav.events, url: "/events" },
  { title: dictionary.nav.contact, url: "/contact" },
  { title: dictionary.nav.faq, url: "/faq" },
  { title: dictionary.sitemap.links.authPortal, url: "/auth" },
  { title: dictionary.sitemap.links.sitemap, url: "/sitemap" },
];

const formatUpdatedAt = (value?: string | null) => {
  if (!value) return null;
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date", error);
    return null;
  }
};

const Sitemap = () => {
  const { t } = useLanguage();

  const languageLabels = supportedLanguages.reduce<Record<string, string>>((acc, lang) => {
    const label = t.sitemap.languages?.[lang.code];
    acc[lang.code] = label || lang.code.toUpperCase();
    return acc;
  }, {});

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["sitemap-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("slug, title, updated_at, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    }
  });

  const { data: events = [] } = useQuery({
    queryKey: ["sitemap-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("slug, title, updated_at, start_datetime")
        .eq("is_published", true)
        .order("start_datetime", { ascending: false });

      if (error) throw error;
      return data ?? [];
    }
  });

  const staticSections = supportedLanguages.map((lang) => {
    const links = createStaticRoutes(lang.dictionary).map((route) => ({
      title: route.title,
      url:
        lang.code === "en"
          ? route.url
          : route.url === "/"
            ? `/${lang.code}`
            : `/${lang.code}${route.url}`
    }));

    const title =
      lang.code === "en"
        ? t.sitemap.sections.englishPages
        : t.sitemap.sections.localizedPages.replace(
            "{{language}}",
            languageLabels[lang.code] || lang.code.toUpperCase()
          );

    return {
      title,
      links
    };
  });

  const dynamicSections: { title: string; links: DynamicLink[] }[] = [
    {
      title: t.sitemap.sections.blogPosts,
      links: blogPosts.map((post) => ({
        title: post.title || post.slug,
        url: getLocalizedPath(`/blog/${post.slug}`, post.language || "en"),
        updatedAt: formatUpdatedAt(post.updated_at ?? post.published_at ?? undefined),
        language: post.language || "en"
      }))
    },
    {
      title: t.sitemap.sections.events,
      links: events.map((event) => ({
        title: event.title || event.slug,
        url: getLocalizedPath(`/events/${event.slug}`, event.language || "en"),
        updatedAt: formatUpdatedAt(event.updated_at ?? event.start_datetime ?? undefined),
        language: event.language || "en"
      }))
    }
  ].map((section) => ({
    ...section,
    links: section.links.filter((link) => Boolean(link?.url && link?.title))
  })).filter((section) => section.links.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${t.sitemap.title} - School Tech Hub`}
        description={t.sitemap.description}
        keywords="sitemap, navigation, school tech hub pages"
      />
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-2">{t.sitemap.title}</h1>
          <p className="text-muted-foreground mb-8">
            {t.sitemap.description}
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {staticSections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.url}>
                        <Link
                          to={link.url}
                          className="text-primary hover:underline"
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {dynamicSections.length > 0 && (
            <div className="mt-10 space-y-6">
              <h2 className="text-2xl font-semibold">{t.sitemap.sections.freshContent}</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {dynamicSections.map((section) => (
                  <Card key={section.title}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {section.links.map((link) => (
                          <li key={link.url}>
                            <Link
                              to={link.url}
                              className="text-primary hover:underline"
                            >
                              {link.title}
                            </Link>
                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                              {link.language && (
                                <span className="uppercase">
                                  {languageLabels[link.language] || link.language.toUpperCase()}
                                </span>
                              )}
                              {link.updatedAt && (
                                <span>Updated {link.updatedAt}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{t.sitemap.sections.xmlTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t.sitemap.sections.xmlDescription}
              </p>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://schooltechub.com/sitemap.xml
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

    </div>
  );
};

export default Sitemap;
