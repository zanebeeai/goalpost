import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { getSignedMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const avatarUrl = await getSignedMediaUrl(profile.avatar_path);
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);
  return (
    <AppShell profile={profile} avatarUrl={avatarUrl} unread={count ?? 0}>
      {children}
    </AppShell>
  );
}
