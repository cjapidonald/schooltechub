import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://ruybexkjupmannggnstn.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eWJleGtqdXBtYW5uZ2duc3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTk3MTYsImV4cCI6MjA3MjgzNTcxNn0.n2MlQf65ggrUVW1nSXKMvoSsyBe9cxY_ElOHvMD5Das";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL ?? FALLBACK_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    FALLBACK_KEY;

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
