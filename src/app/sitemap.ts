import type { MetadataRoute } from "next";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/legal/terms`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${base}/legal/privacy`, changeFrequency: "monthly", priority: 0.2 },
    {
      url: `${base}/legal/community`,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
  if (!isSupabaseConfigured()) return staticEntries;
  const supabase = await createClient();
  const [{ data: profiles }, { data: goals }] = await Promise.all([
    supabase.from("profiles").select("username,updated_at").limit(5000),
    supabase
      .from("goalposts")
      .select("public_id,updated_at")
      .eq("moderation_state", "visible")
      .limit(10000),
  ]);
  return [
    ...staticEntries,
    ...(profiles ?? []).map((profile) => ({
      url: `${base}/u/${profile.username}`,
      lastModified: profile.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...(goals ?? []).map((goal) => ({
      url: `${base}/g/${goal.public_id}`,
      lastModified: goal.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
