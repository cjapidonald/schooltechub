import { supabase } from "@/integrations/supabase/client";

function resolveHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers ?? undefined);
  return headers;
}

function resolveBaseUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return "http://localhost";
}

export async function fetchWithAdminAuth(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.access_token) {
    throw new Error("Missing access token");
  }

  const headers = resolveHeaders(init);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function fetchAdminJson<T>(
  path: string,
  init?: RequestInit,
  baseUrl: string = resolveBaseUrl(),
): Promise<T> {
  const target = path.startsWith("http") ? path : new URL(path, baseUrl).toString();
  const response = await fetchWithAdminAuth(target, init);

  if (!response.ok) {
    const message = await safeReadText(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
