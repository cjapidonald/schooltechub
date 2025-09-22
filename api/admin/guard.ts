import { jsonResponse, methodNotAllowed, normalizeMethod } from "../_lib/http";
import { requireAdmin } from "../_lib/auth";

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  return jsonResponse({ ok: true });
}
