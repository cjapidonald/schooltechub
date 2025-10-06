import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

type TranslationDictionary = typeof import("@/translations/en").en;

type RouteLink = {
  title: string;
  url: string;
};

type RouteBadge = keyof TranslationDictionary["sitemap"]["badges"];

type DetailedRouteLink = RouteLink & {
  description: string;
  badges?: RouteBadge[];
};

type DetailedSection = {
  title: string;
  description?: string;
  links: DetailedRouteLink[];
};

type DynamicLink = RouteLink & {
  updatedAt?: string | null;
};

const createDetailedSections = (dictionary: TranslationDictionary): DetailedSection[] => {
  const { sitemap, nav } = dictionary;

  return [
    {
      title: sitemap.sections.publicPages,
      description: sitemap.descriptions.publicPages,
      links: [
        { title: nav.home, url: "/", description: sitemap.details.home },
        { title: nav.about, url: "/about", description: sitemap.details.about },
        { title: nav.services, url: "/services", description: sitemap.details.services },
        { title: nav.blog, url: "/blog", description: sitemap.details.blog },
        { title: nav.events, url: "/events", description: sitemap.details.events },
        { title: nav.contact, url: "/contact", description: sitemap.details.contact },
        { title: nav.faq, url: "/faq", description: sitemap.details.faq },
        {
          title: sitemap.links.sitemap,
          url: "/sitemap",
          description: sitemap.details.sitemap,
        },
      ],
    },
    {
      title: sitemap.sections.lessonPlanning,
      description: sitemap.descriptions.lessonPlanning,
      links: [
        {
          title: sitemap.linkTitles.lessonBuilder,
          url: "/lesson-builder",
          description: sitemap.details.lessonBuilder,
          badges: ["requiresAuth"],
        },
      ],
    },
    {
      title: sitemap.sections.teacherWorkspace,
      description: sitemap.descriptions.teacherWorkspace,
      links: [
        {
          title: sitemap.linkTitles.teacherDashboard,
          url: "/teacher",
          description: sitemap.details.teacherDashboard,
          badges: ["requiresAuth"],
        },
        {
          title: sitemap.linkTitles.teacherStudentDashboard,
          url: "/teacher/students/:id",
          description: sitemap.details.teacherStudentDashboard,
          badges: ["requiresAuth", "dynamic"],
        },
      ],
    },
    {
      title: sitemap.sections.studentExperience,
      description: sitemap.descriptions.studentExperience,
      links: [
        {
          title: sitemap.linkTitles.studentExperience,
          url: "/student",
          description: sitemap.details.studentExperience,
        },
      ],
    },
    {
      title: sitemap.sections.accountManagement,
      description: sitemap.descriptions.accountManagement,
      links: [
        {
          title: sitemap.links.authPortal,
          url: "/auth",
          description: sitemap.details.authPortal,
        },
        {
          title: dictionary.nav.my_profile ?? dictionary.nav.profile ?? sitemap.linkTitles.accountResources,
          url: "/my-profile",
          description: sitemap.details.myProfile,
          badges: ["requiresAuth"],
        },
        {
          title: sitemap.linkTitles.accountResources,
          url: "/account/resources",
          description: sitemap.details.accountResources,
          badges: ["requiresAuth"],
        },
        {
          title: sitemap.linkTitles.accountResourceNew,
          url: "/account/resources/new",
          description: sitemap.details.accountResourceNew,
          badges: ["requiresAuth"],
        },
        {
          title: sitemap.linkTitles.accountResourceDetail,
          url: "/account/resources/:id",
          description: sitemap.details.accountResourceDetail,
          badges: ["requiresAuth", "dynamic"],
        },
      ],
    },
    {
      title: sitemap.sections.admin,
      description: sitemap.descriptions.admin,
      links: [
        {
          title: sitemap.linkTitles.adminLogin,
          url: "/admin/login",
          description: sitemap.details.adminLogin,
          badges: ["prototype"],
        },
        {
          title: sitemap.linkTitles.adminDashboard,
          url: "/admin",
          description: sitemap.details.adminDashboard,
          badges: ["prototype", "requiresAuth"],
        },
        {
          title: sitemap.linkTitles.adminNestedSegment,
          url: "/admin/:segment",
          description: sitemap.details.adminNested,
          badges: ["prototype", "requiresAuth", "dynamic"],
        },
        {
          title: sitemap.linkTitles.adminNestedSubSegment,
          url: "/admin/:segment/:subSegment",
          description: sitemap.details.adminNested,
          badges: ["prototype", "requiresAuth", "dynamic"],
        },
        {
          title: sitemap.linkTitles.adminNestedChild,
          url: "/admin/:segment/:subSegment/:child",
          description: sitemap.details.adminNested,
          badges: ["prototype", "requiresAuth", "dynamic"],
        },
      ],
    },
    {
      title: sitemap.sections.legacyRedirects,
      description: sitemap.descriptions.legacyRedirects,
      links: [
        {
          title: sitemap.linkTitles.legacyHome,
          url: "/home",
          description: sitemap.details.legacyHome,
          badges: ["redirect"],
        },
        {
          title: sitemap.linkTitles.legacyLessonBuilder,
          url: "/lesson-plans/builder",
          description: sitemap.details.legacyLessonBuilder,
          badges: ["redirect"],
        },
        {
          title: sitemap.linkTitles.legacyLessonBuilderDetail,
          url: "/lesson-plans/builder/:id",
          description: sitemap.details.legacyLessonBuilderDetail,
          badges: ["redirect", "dynamic"],
        },
        {
          title: sitemap.linkTitles.legacyAccount,
          url: "/account",
          description: sitemap.details.legacyAccount,
          badges: ["redirect"],
        },
        {
          title: sitemap.linkTitles.legacyDashboard,
          url: "/dashboard",
          description: sitemap.details.legacyDashboard,
          badges: ["redirect"],
        },
        {
          title: sitemap.linkTitles.legacyDashboardStudent,
          url: "/dashboard/students/:id",
          description: sitemap.details.legacyDashboardStudent,
          badges: ["redirect", "dynamic"],
        },
        {
          title: sitemap.linkTitles.legacyProfile,
          url: "/profile",
          description: sitemap.details.legacyProfile,
          badges: ["redirect"],
        },
        {
          title: sitemap.linkTitles.legacyAccountClass,
          url: "/account/classes/:id",
          description: sitemap.details.legacyAccountClass,
          badges: ["redirect", "dynamic"],
        },
      ],
    },
  ];
};

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

  const detailedSections = createDetailedSections(t);
  const badgeLabels = t.sitemap.badges;

  const dynamicSections: { title: string; links: DynamicLink[] }[] = [
    {
      title: t.sitemap.sections.blogPosts,
      links: blogPosts.map((post) => {
        const anchor = post.slug ? `#post-${post.slug}` : "";

        return {
          title: post.title || post.slug,
          url: `${getLocalizedPath('/blog', 'en')}${anchor}`,
          updatedAt: formatUpdatedAt(post.updated_at ?? post.published_at ?? undefined)
        };
      })
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
            {detailedSections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {section.links.map((link) => (
                      <li key={`${link.url}-${link.title}`} className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={link.url}
                            className="text-primary hover:underline font-medium"
                          >
                            {link.title}
                          </Link>
                          {link.badges?.map((badge) => (
                            <span
                              key={badge}
                              className="whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                            >
                              {badgeLabels[badge]}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>
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
