import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  canonicalUrl?: string;
  lang?: "en";
}

const SUPPORTED_LANGS = ["en"] as const;
const LOCALIZED_PREFIXES = new Set<typeof SUPPORTED_LANGS[number]>();

const normalizePathname = (path: string | undefined | null) => {
  if (!path) {
    return "/";
  }

  if (path !== "/" && path.endsWith("/")) {
    const trimmed = path.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  }

  return path;
};

const buildAbsoluteUrl = (origin: string, path: string) => {
  if (!origin) {
    return path;
  }

  return `${origin}${path}`;
};

export function SEO({
  title,
  description,
  keywords = "AI education, EdTech, virtual reality learning, gamification, teacher management software, student tracking, curriculum development, educational technology, classroom management, online learning platform",
  image = "/og-image.jpg",
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  canonicalUrl,
  lang = "en",
}: SEOProps) {
  const siteName = "SchoolTech Hub";
  const fullTitle = `${title} | ${siteName} - AI Education Solutions`;
  const langLabel = "English";
  const ogLocale = "en_US";

  let origin = "";
  let pathname = "/";

  if (typeof window !== "undefined" && window.location) {
    origin = window.location.origin;
    pathname = window.location.pathname || "/";
  } else {
    const fallback = canonicalUrl || url;

    if (fallback) {
      try {
        if (fallback.startsWith("http")) {
          const parsed = new URL(fallback);
          origin = parsed.origin;
          pathname = parsed.pathname;
        } else {
          const parsed = new URL(fallback, "http://placeholder.local");
          pathname = parsed.pathname;
        }
      } catch (error) {
        // Ignore parsing errors and fall back to defaults.
      }
    }
  }

  const rawPathname = normalizePathname(pathname);

  const pathSegments = rawPathname.split("/");
  const potentialLang = pathSegments[1];
  const hasLocalePrefix = potentialLang ? LOCALIZED_PREFIXES.has(potentialLang as typeof SUPPORTED_LANGS[number]) : false;

  const basePathSegments = hasLocalePrefix ? pathSegments.slice(2) : pathSegments.slice(1);
  const basePath = normalizePathname(`/${basePathSegments.filter(Boolean).join("/")}`);
  const normalizedBasePath = basePath === "" ? "/" : basePath;

  const englishPath = normalizedBasePath;

  const canonicalPath = rawPathname || "/";
  const canonical =
    canonicalUrl ||
    (origin ? `${origin}${canonicalPath}` : (url ? url.split(/[?#]/)[0] : ""));

  const alternateLinks = {
    en: buildAbsoluteUrl(origin, englishPath),
  };

  const ogUrl = canonical || url;

  return (
    <Helmet htmlAttributes={{ lang }}>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author || "SchoolTech Hub"} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content={langLabel} />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      {/* Alternate locales */}
      <link rel="alternate" hrefLang="en" href={alternateLinks.en} />
      <link rel="alternate" hrefLang="x-default" href={alternateLinks.en} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={ogLocale} />
      
      {/* Article specific tags */}
      {type === "article" && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.length > 0 && tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:site" content="@SchoolTechHub" />
      <meta property="twitter:creator" content="@SchoolTechHub" />
      
      {/* Additional SEO tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="theme-color" content="#9333ea" />
      <link rel="manifest" href="/manifest.json" />
    </Helmet>
  );
}