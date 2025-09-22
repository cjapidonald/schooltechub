import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "./_lib/http";

interface OgScrapePayload {
  url?: string;
}

interface OgMetadata {
  title: string | null;
  description: string | null;
  siteName: string | null;
  image: string | null;
  url: string;
  providerName: string | null;
  embedHtml: string | null;
}

const ALLOWED_EMBED_PATTERNS = [/^https?:\/\//i];

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);
  if (method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const payload = (await parseJsonBody<OgScrapePayload>(request)) ?? {};
  if (!payload.url || payload.url.trim().length === 0) {
    return errorResponse(400, "A URL is required");
  }

  const normalizedUrl = normalizeUrl(payload.url);
  if (!normalizedUrl) {
    return errorResponse(400, "The provided URL is invalid");
  }

  try {
    const html = await fetchHtml(normalizedUrl);
    const og = extractOgMetadata(html, normalizedUrl);
    const oEmbedUrl = extractOEmbedUrl(html);

    if (oEmbedUrl) {
      const oEmbed = await fetchOEmbed(oEmbedUrl);
      if (oEmbed.title && !og.title) {
        og.title = oEmbed.title;
      }
      if (oEmbed.provider_name && !og.providerName) {
        og.providerName = oEmbed.provider_name;
      }
      if (oEmbed.thumbnail_url && !og.image) {
        og.image = oEmbed.thumbnail_url;
      }
      if (oEmbed.html) {
        const sanitized = sanitizeEmbed(oEmbed.html);
        if (!sanitized) {
          return errorResponse(422, "The embed markup is not supported");
        }
        og.embedHtml = sanitized;
      }
    }

    if (og.embedHtml) {
      const host = tryParseUrlSrc(og.embedHtml);
      if (!host) {
        return errorResponse(422, "Unable to validate embed source");
      }
      if (!ALLOWED_EMBED_PATTERNS.some((pattern) => pattern.test(host))) {
        return errorResponse(422, "Embeds from this host are not allowed");
      }
    }

    return jsonResponse({
      url: og.url,
      metadata: og,
    });
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Failed to load metadata");
  }
}

function normalizeUrl(input: string): string | null {
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

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch page metadata");
  }

  return await response.text();
}

function extractOgMetadata(html: string, url: string): OgMetadata {
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
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch oEmbed metadata");
  }
  return (await response.json()) as Record<string, any>;
}

function sanitizeEmbed(html: string): string | null {
  const stripped = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/on[a-z]+="[^"]*"/gi, "");
  if (!/(<iframe|<blockquote)/i.test(stripped)) {
    return null;
  }
  return stripped.trim();
}

function tryParseUrlSrc(html: string): string | null {
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
    entries[key.toLowerCase()] = content;
  }

  return (name: string) => entries[name.toLowerCase()] ?? null;
}

function matchAttribute(tag: string, attribute: string): string | null {
  const regex = new RegExp(`${attribute}=["']([^"']+)["']`, "i");
  const match = tag.match(regex);
  return match ? match[1] : null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}
