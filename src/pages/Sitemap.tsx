import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { en } from "@/translations/en";

type RouteLink = {
  title: string;
  url: string;
};

type TranslationDictionary = typeof en;

const createStaticRoutes = (dictionary: TranslationDictionary): RouteLink[] => [
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

const Sitemap = () => {
  const { t } = useLanguage();

  const staticSections = [
    {
      title: t.sitemap.sections.englishPages,
      links: createStaticRoutes(en)
    }
  ];

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
