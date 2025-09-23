import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://ruybexkjupmannggnstn.supabase.co";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL ?? FALLBACK_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    const hint =
      "Missing SUPABASE_SERVICE_ROLE_KEY. Generate a service role key from Supabase project settings, expose it only to server environments, and see SUPABASE_SETUP.md for details.";
    console.error(`[supabase] ${hint}`);
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
