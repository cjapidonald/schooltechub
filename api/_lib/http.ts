export interface JsonResponseInit extends ResponseInit {
  headers?: HeadersInit;
}

const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
};

export function jsonResponse(
  body: unknown,
  status = 200,
  init: JsonResponseInit = {}
): Response {
  const headers = new Headers(DEFAULT_HEADERS);
  if (init.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => headers.set(key, value));
  }

  return new Response(JSON.stringify(body), {
    ...init,
    status,
    headers,
  });
}

export function errorResponse(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}

export async function parseJsonBody<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function methodNotAllowed(allowed: string[]): Response {
  return new Response(null, {
    status: 405,
    headers: {
      Allow: allowed.join(", "),
    },
  });
}

export function normalizeMethod(method: string | undefined | null): string {
  return (method ?? "GET").toUpperCase();
}
