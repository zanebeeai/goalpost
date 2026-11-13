import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";

/** How long the provider list is reused before asking Supabase again. */
export const AUTH_SETTINGS_REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 2000;

/**
 * Server only. True when the Supabase project has Google sign-in turned on,
 * read from the public `/auth/v1/settings` endpoint. Any failure, a timeout
 * or missing env counts as off, so the app never offers a button that leads
 * to a raw Supabase error.
 *
 * The response goes through Next's data cache for five minutes (only 200
 * responses are cached), so failures are retried on the next request.
 */
export async function isGoogleAuthEnabled(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { supabaseUrl, supabaseKey } = getPublicEnv();
  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/settings`,
      {
        headers: { apikey: supabaseKey },
        next: { revalidate: AUTH_SETTINGS_REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!response.ok) return false;
    const settings: unknown = await response.json();
    return (
      typeof settings === "object" &&
      settings !== null &&
      "external" in settings &&
      typeof settings.external === "object" &&
      settings.external !== null &&
      "google" in settings.external &&
      settings.external.google === true
    );
  } catch {
    return false;
  }
}
