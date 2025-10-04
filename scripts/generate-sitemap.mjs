import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const siteUrl = "https://schooltechhub.com";
const outputPath = resolve(__dirname, "../public/sitemap.xml");
const today = new Date().toISOString().split("T")[0];

const basePages = [
  { path: "", changefreq: "weekly", priority: "1.0" },
  { path: "about", changefreq: "monthly", priority: "0.8" },
  { path: "services", changefreq: "monthly", priority: "0.8" },
  { path: "blog", changefreq: "weekly", priority: "0.7" },
  { path: "events", changefreq: "weekly", priority: "0.7" },
  { path: "contact", changefreq: "monthly", priority: "0.5" },
  { path: "faq", changefreq: "monthly", priority: "0.5" },
  { path: "auth", changefreq: "monthly", priority: "0.4" },
  { path: "sitemap", changefreq: "monthly", priority: "0.4" },
];

const urls = basePages
  .map(page => {
    const loc = page.path ? `${siteUrl}/${page.path}` : `${siteUrl}/`;
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${page.changefreq}</changefreq>`,
      `    <priority>${page.priority}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n  http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n  <!-- Core English pages -->\n${urls}\n\n</urlset>\n`;

await writeFile(outputPath, xml, "utf8");

console.log(`Sitemap updated at ${outputPath}`);
