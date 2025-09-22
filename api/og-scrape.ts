import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "./_lib/http";
import {
  loadOpenGraphMetadata,
  normalizeInputUrl,
  sanitizeEmbed,
  tryParseUrlSrc,
} from "./_lib/open-graph";

interface OgScrapePayload {
  url?: string;
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

  const normalizedUrl = normalizeInputUrl(payload.url);
  if (!normalizedUrl) {
    return errorResponse(400, "The provided URL is invalid");
  }

  try {
    const { metadata, embedSrc, hadOEmbedHtml } = await loadOpenGraphMetadata(normalizedUrl);

    if (hadOEmbedHtml && !metadata.embedHtml) {
      return errorResponse(422, "The embed markup is not supported");
    }

    if (metadata.embedHtml) {
      if (!sanitizeEmbed(metadata.embedHtml)) {
        return errorResponse(422, "The embed markup is not supported");
      }
      const host = embedSrc ?? tryParseUrlSrc(metadata.embedHtml);
      if (!host) {
        return errorResponse(422, "Unable to validate embed source");
      }
      if (!ALLOWED_EMBED_PATTERNS.some((pattern) => pattern.test(host))) {
        return errorResponse(422, "Embeds from this host are not allowed");
      }
    }

    return jsonResponse({
      url: metadata.url,
      metadata,
    });
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Failed to load metadata");
  }
}
