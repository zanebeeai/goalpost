import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getSignedMediaUrl(
  path: string | null | undefined,
  expiresIn = 3600,
) {
  if (!path || !isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("goalpost-media")
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function getSignedMediaUrls(paths: string[], expiresIn = 3600) {
  if (!paths.length || !isSupabaseConfigured())
    return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("goalpost-media")
    .createSignedUrls(paths, expiresIn);
  const result = new Map<string, string>();
  data?.forEach((item, index) => {
    const path = paths[index];
    if (path && item.signedUrl) result.set(path, item.signedUrl);
  });
  return result;
}
