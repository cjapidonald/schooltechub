export interface OpenGraphMetadata {
  title: string | null;
  description: string | null;
  siteName: string | null;
  image: string | null;
  url: string;
  providerName: string | null;
  embedHtml: string | null;
}

export interface OpenGraphResult {
  metadata: OpenGraphMetadata;
  embedSrc: string | null;
  hadOEmbedHtml: boolean;
}

const DEFAULT_ACCEPT_HEADER = "text/html,application/xhtml+xml";

export function normalizeInputUrl(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return new URL(trimmed).toString();
    }
    if (/^\/\//.test(trimmed)) {
      return new URL(`https:${trimmed}`).toString();
    }
    const sanitized = trimmed.replace(/^\/+/, "");
    return new URL(`https://${sanitized}`).toString();
  } catch {
    return null;
  }
}

export function stripTrackingParameters(url: URL): URL {
  const next = new URL(url.toString());
  const params = Array.from(next.searchParams.keys());
  for (const key of params) {
    if (/^utm_/i.test(key) || /^fbclid$/i.test(key) || /^gclid$/i.test(key)) {
      next.searchParams.delete(key);
    }
  }
  next.hash = "";
  return next;
}

export async function loadOpenGraphMetadata(url: string): Promise<OpenGraphResult> {
  const html = await fetchHtml(url);
  const metadata = extractOgMetadata(html, url);
  const oEmbedUrl = extractOEmbedUrl(html);
  let hadOEmbedHtml = false;

  if (oEmbedUrl) {
    const oEmbed = await fetchOEmbed(oEmbedUrl);
    if (typeof oEmbed.html === "string" && oEmbed.html.length > 0) {
      hadOEmbedHtml = true;
    }
    if (oEmbed.title && !metadata.title) {
      metadata.title = oEmbed.title;
    }
    if (oEmbed.provider_name && !metadata.providerName) {
      metadata.providerName = oEmbed.provider_name;
    }
    if (oEmbed.thumbnail_url && !metadata.image) {
      metadata.image = oEmbed.thumbnail_url;
    }
    if (oEmbed.html) {
      metadata.embedHtml = sanitizeEmbed(oEmbed.html);
    }
  }

  const embedSrc = metadata.embedHtml ? tryParseUrlSrc(metadata.embedHtml) : null;
  return { metadata, embedSrc, hadOEmbedHtml };
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Accept: DEFAULT_ACCEPT_HEADER },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch page metadata");
  }

  return await response.text();
}

function extractOgMetadata(html: string, url: string): OpenGraphMetadata {
  const meta = createMetaLookup(html);
  return {
    title: meta("og:title") ?? meta("twitter:title") ?? extractTitle(html),
    description:
      meta("og:description") ??
      meta("description") ??
      meta("twitter:description") ??
      null,
    siteName: meta("og:site_name") ?? null,
    image: meta("og:image") ?? meta("twitter:image") ?? null,
    url,
    providerName: meta("og:site_name") ?? null,
    embedHtml: null,
  };
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractOEmbedUrl(html: string): string | null {
  const linkRegex = /<link[^>]+rel=["']alternate["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html))) {
    const tag = match[0];
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);
    if (!typeMatch || !/json\+oembed/i.test(typeMatch[1])) {
      continue;
    }
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      try {
        return new URL(hrefMatch[1]).toString();
      } catch {
        continue;
      }
    }
  }
  return null;
}

async function fetchOEmbed(url: string): Promise<Record<string, any>> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch oEmbed metadata");
  }
  return (await response.json()) as Record<string, any>;
}

export function sanitizeEmbed(html: string): string | null {
  const stripped = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/on[a-z]+="[^"]*"/gi, "");
  if (!/(<iframe|<blockquote)/i.test(stripped)) {
    return null;
  }
  return stripped.trim();
}

export function tryParseUrlSrc(html: string): string | null {
  const srcMatch = html.match(/src=["']([^"']+)["']/i);
  if (!srcMatch) {
    return null;
  }
  try {
    return new URL(srcMatch[1]).toString();
  } catch {
    return null;
  }
}

function createMetaLookup(html: string): (name: string) => string | null {
  const metaRegex = /<meta[^>]+>/gi;
  const entries: Record<string, string> = {};
  let match: RegExpExecArray | null;

  while ((match = metaRegex.exec(html))) {
    const tag = match[0];
    const key =
      matchAttribute(tag, "property") ||
      matchAttribute(tag, "name") ||
      matchAttribute(tag, "itemprop");
    if (!key) continue;
    const content = matchAttribute(tag, "content");
    if (!content) continue;
    entries[key.toLowerCase()] = content.trim();
  }

  return (name: string) => entries[name.toLowerCase()] ?? null;
}

function matchAttribute(tag: string, attribute: string): string | null {
  const regex = new RegExp(`${attribute}=["']([^"']+)["']`, "i");
  const match = tag.match(regex);
  return match ? match[1].trim() : null;
}

