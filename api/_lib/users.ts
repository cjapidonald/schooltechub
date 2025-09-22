import type { SupabaseClient, User } from "@supabase/supabase-js";

const DEFAULT_PAGE_SIZE = 100;
const MAX_ITERATIONS = 100;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<User | null> {
  const normalised = normaliseEmail(email);
  if (!normalised) {
    return null;
  }

  let page = 1;
  const perPage = DEFAULT_PAGE_SIZE;

  for (let attempt = 0; attempt < MAX_ITERATIONS; attempt += 1) {
    const response = await supabase.auth.admin.listUsers({ page, perPage });

    if (response.error) {
      throw response.error;
    }

    const { data } = response;
    const match = data.users.find(user => normaliseEmail(user.email ?? "") === normalised);
    if (match) {
      return match;
    }

    const next = typeof data.nextPage === "number" ? data.nextPage : null;
    const last = typeof data.lastPage === "number" ? data.lastPage : null;

    if (next && next !== page) {
      page = next;
      continue;
    }

    if (last && page < last) {
      page += 1;
      continue;
    }

    break;
  }

  return null;
}
