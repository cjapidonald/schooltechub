import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const siteUrl = "https://schooltechhub.com";
const outputPath = resolve(__dirname, "../public/sitemap.xml");
const today = new Date().toISOString().split("T")[0];

const basePages = [
  {
    path: "",
    changefreq: "weekly",
    priority: { en: "1.0", default: "0.7" },
  },
  {
    path: "about",
    changefreq: "monthly",
    priority: { en: "0.8", default: "0.6" },
  },
  {
    path: "services",
    changefreq: "monthly",
    priority: { en: "0.8", default: "0.6" },
  },
  {
    path: "blog",
    changefreq: "weekly",
    priority: { en: "0.7", default: "0.6" },
  },
  {
    path: "events",
    changefreq: "weekly",
    priority: { en: "0.7", default: "0.6" },
  },
  {
    path: "contact",
    changefreq: "monthly",
    priority: { en: "0.5", default: "0.4" },
  },
  {
    path: "faq",
    changefreq: "monthly",
    priority: { en: "0.5", default: "0.4" },
  },
  {
    path: "auth",
    changefreq: "monthly",
    priority: { en: "0.4", default: "0.3" },
  },
  {
    path: "sitemap",
    changefreq: "monthly",
    priority: { en: "0.4", default: "0.3" },
  },
];

const locales = [
  { code: "en", label: "Core English pages", prefix: "" },
  { code: "sq", label: "Albanian localized pages", prefix: "sq" },
  { code: "vi", label: "Vietnamese localized pages", prefix: "vi" },
];

const buildUrl = (prefix, path) => {
  const segments = [];
  if (prefix) segments.push(prefix);
  if (path) segments.push(path);
  const joined = segments.filter(Boolean).join("/");
  return joined ? `${siteUrl}/${joined}` : `${siteUrl}/`;
};

const sections = locales
  .map(locale => {
    const urls = basePages.map(page => {
      const loc = buildUrl(locale.prefix, page.path);
      const priority = locale.code === "en" ? page.priority.en : page.priority.default;
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n");
    });

    return [`  <!-- ${locale.label} -->`, urls.join("\n\n")].join("\n");
  })
  .join("\n\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n${sections}\n\n</urlset>\n`;

await writeFile(outputPath, xml, "utf8");

console.log(`Sitemap updated at ${outputPath}`);
