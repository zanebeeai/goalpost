import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { OnboardingForm } from "@/components/onboarding-form";
import { Card } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Set up your profile",
  robots: { index: false },
};

export default async function OnboardingPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", viewer.id)
    .maybeSingle();
  if (profile) redirect("/app");
  const suggested = viewer.email?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "";
  return (
    <main className="paper-grid min-h-screen px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Brand />
        <Card className="mt-10 p-6 sm:p-9">
          <p className="text-xs font-bold tracking-[.2em] text-[var(--clay-600)] uppercase">
            One last step
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold">
            Name your growing space.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            We will create a private Inbox list and reserve your public profile
            address.
          </p>
          <div className="mt-8">
            <OnboardingForm suggestedName={suggested} />
          </div>
        </Card>
      </div>
    </main>
  );
}
