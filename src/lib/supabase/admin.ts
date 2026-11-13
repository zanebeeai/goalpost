import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database.generated";

/** Service-role client. Bypasses RLS: server-only, never per-user reads. */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !isSupabaseConfigured()) {
    throw new Error("SUPABASE_SECRET_KEY is not configured");
  }
  return createClient<Database>(getPublicEnv().supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
