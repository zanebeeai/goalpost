"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function RealtimeRefresh({ topics }: { topics: string[] }) {
  const router = useRouter();
  useEffect(() => {
    if (!isSupabaseConfigured() || topics.length === 0) return;
    const supabase = createClient();
    const channels = topics.map((topic) =>
      supabase
        .channel(topic, { config: { private: true } })
        .on("broadcast", { event: "*" }, () => router.refresh())
        .subscribe(),
    );
    return () => {
      channels.forEach((channel) => void supabase.removeChannel(channel));
    };
  }, [router, topics]);
  return null;
}
