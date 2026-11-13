import { redirect } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  id: string;
  email: string | null;
  displayName: string;
  emailNudges: boolean;
  space: { id: string; timezone: string; inviteCode: string };
};

export type Viewer = { id: string; email: string | null };

/** Signed-in user or null. Never throws when Supabase is unconfigured. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return null;
    const email = data.claims.email;
    return {
      id: data.claims.sub,
      email: typeof email === "string" && email ? email : null,
    };
  } catch {
    return null;
  }
});

/** Redirects to /auth/login when signed out. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/login");
  return viewer;
}

/** Member or null (signed in but not onboarded yet). Does not redirect. */
export const getMember = cache(async (): Promise<Member | null> => {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, email_nudges, space:spaces(id, timezone, invite_code)",
    )
    .eq("id", viewer.id)
    .maybeSingle();
  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  if (!data || !data.space) return null;
  return {
    id: data.id,
    email: viewer.email,
    displayName: data.display_name,
    emailNudges: data.email_nudges,
    space: {
      id: data.space.id,
      timezone: data.space.timezone,
      inviteCode: data.space.invite_code,
    },
  };
});

/** Redirects to /auth/login when signed out, /onboarding when no profile. */
export async function requireMember(): Promise<Member> {
  await requireViewer();
  const member = await getMember();
  if (!member) redirect("/onboarding");
  return member;
}
