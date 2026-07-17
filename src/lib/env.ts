const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function isSupabaseConfigured() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);
}

export function getPublicEnv() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return {
    supabaseUrl: publicEnv.supabaseUrl,
    supabaseKey: publicEnv.supabaseKey,
    siteUrl: publicEnv.siteUrl,
  };
}
