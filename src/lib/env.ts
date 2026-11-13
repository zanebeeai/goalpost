function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * Never throws, so public pages can render without Supabase env (CI builds).
 * Supabase values are empty strings when unconfigured; check
 * `isSupabaseConfigured()` before creating a client.
 */
export function getPublicEnv(): {
  supabaseUrl: string;
  supabaseKey: string;
  siteUrl: string;
} {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    siteUrl: trimTrailingSlash(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
  };
}
