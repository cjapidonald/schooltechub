import { errorResponse, methodNotAllowed, normalizeMethod } from "../../_lib/http";
import { getSupabaseClient } from "../../_lib/supabase";

interface ResourceDownloadRecord {
  id: string;
  status: string;
  is_active: boolean;
  storage_path: string | null;
  url: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);

  if (method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const resourceId = extractResourceId(request);
  if (!resourceId) {
    return errorResponse(400, "A resource id is required");
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(401, "Authentication required");
  }

  const supabase = getSupabaseClient();
  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !userData?.user) {
    return errorResponse(401, "Authentication required");
  }

  const { data: resource, error: resourceError } = await supabase
    .from<ResourceDownloadRecord>("resources")
    .select("id, status, is_active, storage_path, url")
    .eq("id", resourceId)
    .maybeSingle();

  if (resourceError) {
    return errorResponse(500, "Failed to load resource");
  }

  if (!resource || resource.status !== "approved" || resource.is_active !== true) {
    return errorResponse(404, "Resource not found");
  }

  if (resource.storage_path) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from("resources")
      .createSignedUrl(resource.storage_path, 60 * 10);

    if (signedError || !signedData?.signedUrl) {
      return errorResponse(500, "Failed to create download link");
    }

    return redirectResponse(signedData.signedUrl);
  }

  if (resource.url) {
    return redirectResponse(resource.url);
  }

  return errorResponse(404, "Resource not found");
}

function extractResourceId(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return null;
    }
    const id = segments[segments.length - 2];
    return id ? decodeURIComponent(id) : null;
  } catch {
    return null;
  }
}

function extractAccessToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (header) {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const cookieHeader = request.headers.get("cookie") ?? request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";");
    for (const rawCookie of cookies) {
      const [name, ...rest] = rawCookie.trim().split("=");
      if (name === "sb-access-token") {
        return decodeURIComponent(rest.join("="));
      }
    }
  }

  return null;
}

function redirectResponse(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
    },
  });
}
