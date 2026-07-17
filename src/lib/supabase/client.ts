"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database.generated";

export function createClient() {
  const env = getPublicEnv();
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseKey);
}
