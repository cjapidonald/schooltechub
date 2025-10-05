import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { en } from "@/translations/en";

type RouteLink = {
  title: string;
  url: string;
};

type DynamicLink = RouteLink & {
  updatedAt?: string | null;
};

type TranslationDictionary = typeof en;

const createStaticRoutes = (dictionary: TranslationDictionary): RouteLink[] => [
  {
    title: dictionary.nav.my_profile ?? dictionary.nav.profile ?? dictionary.nav.dashboard,
    url: "/account"
  },
  { title: dictionary.nav.home, url: "/home" },
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

  const staticSections = [
    {
      title: t.sitemap.sections.englishPages,
      links: createStaticRoutes(en)
    }
  ];

  const dynamicSections: { title: string; links: DynamicLink[] }[] = [
    {
      title: t.sitemap.sections.blogPosts,
      links: blogPosts.map((post) => ({
        title: post.title || post.slug,
        url: getLocalizedPath(`/blog/${post.slug}`, 'en'),
        updatedAt: formatUpdatedAt(post.updated_at ?? post.published_at ?? undefined)
      }))
    },
    {
      title: t.sitemap.sections.events,
      links: events.map((event) => ({
        title: event.title || event.slug,
        url: getLocalizedPath(`/events/${event.slug}`, 'en'),
        updatedAt: formatUpdatedAt(event.updated_at ?? event.start_datetime ?? undefined)
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
      <div className="flex-1">
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
                            {link.updatedAt && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Updated {link.updatedAt}
                              </div>
                            )}
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
      </div>

    </div>
  );
};

export default Sitemap;
