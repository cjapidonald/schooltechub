import { errorResponse, methodNotAllowed, normalizeMethod } from "../../../_lib/http";
import { getSupabaseClient } from "../../../_lib/supabase";

interface ResearchDocumentRecord {
  id: string;
  project_id: string;
  storage_path: string | null;
  status: string | null;
}

interface ParticipantRecord {
  id: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const documentId = extractDocumentId(request);
  if (!documentId) {
    return errorResponse(400, "A document id is required");
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(401, "Authentication required");
  }

  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !authData?.user) {
    return errorResponse(401, "Authentication required");
  }

  const userId = authData.user.id;

  const { data: document, error: documentError } = await supabase
    .from<ResearchDocumentRecord>("research_documents")
    .select("id, project_id, storage_path, status")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    return errorResponse(500, "Failed to load document");
  }

  if (!document || !document.storage_path) {
    return errorResponse(404, "Document not found");
  }

  const requiresParticipantAccess = document.status !== "public";

  if (requiresParticipantAccess) {
    const { data: participant, error: participantError } = await supabase
      .from<ParticipantRecord>("research_participants")
      .select("id")
      .eq("project_id", document.project_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      return errorResponse(500, "Failed to verify access");
    }

    if (!participant) {
      return errorResponse(403, "You do not have access to this document");
    }
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from("research")
    .createSignedUrl(document.storage_path, 60 * 10);

  if (signedError || !signedData?.signedUrl) {
    return errorResponse(500, "Failed to create download link");
  }

  return redirectResponse(signedData.signedUrl);
}

function extractDocumentId(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const downloadIndex = segments.lastIndexOf("download");
    if (downloadIndex <= 0) {
      return null;
    }
    const id = segments[downloadIndex - 1];
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
