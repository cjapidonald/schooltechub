import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { format } from "date-fns";

type RouteLink = {
  title: string;
  url: string;
};

type DynamicLink = RouteLink & {
  updatedAt?: string | null;
  language?: string | null;
};

const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "sq", label: "Albanian" },
  { code: "vi", label: "Vietnamese" },
] as const;

const englishRoutes: RouteLink[] = [
  { title: "Home", url: "/" },
  { title: "About", url: "/about" },
  { title: "Services", url: "/services" },
  { title: "Blog", url: "/blog" },
  { title: "Events", url: "/events" },
  { title: "Edutech Hub", url: "/edutech" },
  { title: "Teacher Diary", url: "/teacher-diary" },
  { title: "Contact", url: "/contact" },
  { title: "FAQ", url: "/faq" },
  { title: "Auth Portal", url: "/auth" },
  { title: "Sitemap", url: "/sitemap" },
];

const languageLabels = supportedLanguages.reduce<Record<string, string>>((acc, lang) => {
  acc[lang.code] = lang.label;
  return acc;
}, {});

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
  const { data: blogPosts = [] } = useQuery({
    queryKey: ["sitemap-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_master")
        .select("slug, title, updated_at, published_at, language")
        .eq("page", "research_blog")
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
        .from("content_master")
        .select("slug, title, updated_at, start_datetime, language")
        .eq("page", "events")
        .eq("is_published", true)
        .order("start_datetime", { ascending: false });

      if (error) throw error;
      return data ?? [];
    }
  });

  const { data: diaryEntries = [] } = useQuery({
    queryKey: ["sitemap-teacher-diary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_master")
        .select("slug, title, updated_at, published_at, language")
        .eq("page", "teacher_diary")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    }
  });

  const staticSections = [
    {
      title: "English Pages",
      links: englishRoutes
    },
    ...supportedLanguages
      .filter((lang) => lang.code !== "en")
      .map((lang) => ({
        title: `${lang.label} Pages`,
        links: englishRoutes.map((route) => ({
          title: route.title,
          url: route.url === "/" ? `/${lang.code}` : `/${lang.code}${route.url}`
        }))
      }))
  ];

  const dynamicSections: { title: string; links: DynamicLink[] }[] = [
    {
      title: "Blog Posts",
      links: blogPosts.map((post) => ({
        title: post.title || post.slug,
        url: getLocalizedPath(`/blog/${post.slug}`, post.language || "en"),
        updatedAt: formatUpdatedAt(post.updated_at ?? post.published_at ?? undefined),
        language: post.language || "en"
      }))
    },
    {
      title: "Events",
      links: events.map((event) => ({
        title: event.title || event.slug,
        url: getLocalizedPath(`/events/${event.slug}`, event.language || "en"),
        updatedAt: formatUpdatedAt(event.updated_at ?? event.start_datetime ?? undefined),
        language: event.language || "en"
      }))
    },
    {
      title: "Teacher Diary Entries",
      links: diaryEntries.map((entry) => ({
        title: entry.title || entry.slug,
        url: getLocalizedPath(`/teacher-diary/${entry.slug}`, entry.language || "en"),
        updatedAt: formatUpdatedAt(entry.updated_at ?? entry.published_at ?? undefined),
        language: entry.language || "en"
      }))
    }
  ].map((section) => ({
    ...section,
    links: section.links.filter((link) => Boolean(link?.url && link?.title))
  })).filter((section) => section.links.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Sitemap - School Tech Hub"
        description="Navigate through all pages and resources available on School Tech Hub"
        keywords="sitemap, navigation, school tech hub pages"
      />
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-2">Sitemap</h1>
          <p className="text-muted-foreground mb-8">
            Find all pages and resources available on School Tech Hub
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
              <h2 className="text-2xl font-semibold">Fresh content</h2>
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
              <CardTitle>XML Sitemap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For search engines and automated tools, access our XML sitemap:
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
