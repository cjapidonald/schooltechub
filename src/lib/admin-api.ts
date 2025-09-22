import { supabase } from "@/integrations/supabase/client";

async function withAdminToken(init: RequestInit = {}): Promise<RequestInit & { headers: Headers }> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Missing access token");
  }

  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return { ...init, headers };
}

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestInit = await withAdminToken(init);
  return fetch(input, requestInit);
}

export async function adminJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await adminFetch(input, init);
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // Ignore JSON parsing errors and use default message
    }
    throw new Error(message);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to parse server response");
  }
}

export async function adminPost<T, P extends object>(
  input: RequestInfo | URL,
  payload?: P
): Promise<T> {
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  };

  return adminJson<T>(input, init);
}

export async function adminDelete<T>(input: RequestInfo | URL): Promise<T> {
  return adminJson<T>(input, { method: "DELETE" });
}
