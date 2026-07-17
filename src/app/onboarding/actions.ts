"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstIssue, usernameSchema } from "@/lib/validation";

export type OnboardingState = { error?: string };

export async function completeOnboardingAction(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  await requireViewer();
  const parsed = z
    .object({
      username: usernameSchema,
      displayName: z.string().trim().min(1, "Enter a display name").max(80),
      timezone: z.string().trim().min(1).max(64),
      publicAcknowledgement: z.literal("on", {
        error: "Acknowledge that goal content is public",
      }),
    })
    .safeParse({
      username: formData.get("username"),
      displayName: formData.get("displayName"),
      timezone: formData.get("timezone"),
      publicAcknowledgement: formData.get("publicAcknowledgement"),
    });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_username: parsed.data.username,
    p_display_name: parsed.data.displayName,
    p_timezone: parsed.data.timezone,
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "That username is already taken."
          : error.message,
    };
  redirect("/app");
}
