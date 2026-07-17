import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const getViewer = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return null;
  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
});

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/login");
  return viewer;
}

export async function requireProfile() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, timezone")
    .eq("id", viewer.id)
    .maybeSingle();
  if (!data) redirect("/onboarding");
  return data;
}
