import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
} from "../../_lib/http";
import { requireAdmin } from "../../_lib/auth";

const MAX_PER_PAGE = 200;
const DEFAULT_PER_PAGE = 25;

type DirectoryStatus = "enabled" | "disabled";

function clampPerPage(value: number): number {
  return Math.max(1, Math.min(MAX_PER_PAGE, value));
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const { supabase } = context;
  const url = new URL(request.url);
  const page = parsePositiveInteger(url.searchParams.get("page"), 1);
  const perPage = clampPerPage(parsePositiveInteger(url.searchParams.get("perPage"), DEFAULT_PER_PAGE));

  const listResult = await supabase.auth.admin.listUsers({ page, perPage });
  if (listResult.error) {
    return errorResponse(500, "Failed to load users");
  }

  const adminResult = await supabase.from("app_admins").select("user_id");
  if (adminResult.error) {
    return errorResponse(500, "Failed to load admin assignments");
  }

  const adminIds = new Set((adminResult.data ?? []).map(record => record.user_id as string));

  const users = listResult.data.users.map(user => ({
    id: user.id,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    status: (user.banned_until ? "disabled" : "enabled") as DirectoryStatus,
    isAdmin: adminIds.has(user.id),
  }));

  const total = typeof listResult.data.total === "number" && listResult.data.total > 0
    ? listResult.data.total
    : users.length;
  const lastPage = typeof listResult.data.lastPage === "number" && listResult.data.lastPage > 0
    ? listResult.data.lastPage
    : Math.max(1, Math.ceil(total / perPage));
  const nextPage = typeof listResult.data.nextPage === "number" ? listResult.data.nextPage : null;

  return jsonResponse({
    users,
    page,
    perPage,
    total,
    lastPage,
    nextPage: nextPage && nextPage > page ? nextPage : page < lastPage ? page + 1 : null,
  });
}
