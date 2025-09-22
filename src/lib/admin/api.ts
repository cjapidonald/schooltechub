import { supabase } from "@/integrations/supabase/client";

export class AdminApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.details = details;
  }
}

async function requireAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new AdminApiError("Unable to verify authentication state.", 401, error);
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new AdminApiError("You must be signed in to access the admin console.", 401);
  }

  return token;
}

export interface AdminRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  json?: unknown;
}

export async function adminRequest<TResponse>(
  path: string,
  options: AdminRequestOptions = {},
): Promise<TResponse> {
  const { json, ...rest } = options;
  const accessToken = await requireAccessToken();

  const headers = new Headers(rest.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  let body = rest.body ?? null;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...rest,
      headers,
      body,
    });
  } catch (error) {
    throw new AdminApiError("Network request failed.", 500, error);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload &&
        typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : null) ?? `Request failed with status ${response.status}`;
    throw new AdminApiError(message, response.status, payload);
  }

  return (payload as TResponse) ?? ({} as TResponse);
}
