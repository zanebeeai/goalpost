"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireMember, requireViewer } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fields,
  canonicalTimezone,
  firstIssue,
  requiredText,
  text,
  timezoneSchema,
} from "@/lib/validation";

const displayName = requiredText(
  40,
  "Tell us what to call you.",
  "Use 40 characters or fewer.",
);

const inviteCode = text(64, "That invite link is no longer valid.");

export async function completeOnboardingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      displayName,
      // A missing or unknown browser timezone should not block setup.
      timezone: z.preprocess(
        (value) =>
          (typeof value === "string" && canonicalTimezone(value)) || "UTC",
        z.string(),
      ),
      invite: inviteCode,
    })
    .safeParse(fields(formData, "displayName", "timezone", "invite"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await requireViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("enter_space", {
    p_display_name: parsed.data.displayName,
    p_timezone: parsed.data.timezone,
    p_invite_code: parsed.data.invite || undefined,
  });
  if (error) {
    if (error.message === "You are already set up.") redirect("/app");
    // 23503: the profile's auth user is gone (account deleted on another
    // device) but this browser still holds its session.
    if (error.code === "23503") {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      redirect("/auth/login");
    }
    return { error: friendlyDbError(error) };
  }
  revalidatePath("/", "layout");
  redirect("/app");
}

export async function joinSpaceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      invite: requiredText(
        64,
        "That invite link is no longer valid.",
        "That invite link is no longer valid.",
      ),
    })
    .safeParse(fields(formData, "invite"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_space", {
    p_invite_code: parsed.data.invite,
  });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/", "layout");
  redirect("/app");
}

export async function rotateInviteAction(): Promise<ActionState>;
export async function rotateInviteAction(
  prev: ActionState,
  formData: FormData,
): Promise<ActionState>;
export async function rotateInviteAction(): Promise<ActionState> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("rotate_invite");
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      displayName,
      timezone: timezoneSchema,
      emailNudges: z.preprocess((value) => value === "on", z.boolean()),
    })
    .safeParse(fields(formData, "displayName", "timezone", "emailNudges"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const member = await requireMember();
  const supabase = await createClient();
  const profile = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      email_nudges: parsed.data.emailNudges,
    })
    .eq("id", member.id);
  if (profile.error) return { error: friendlyDbError(profile.error) };

  if (parsed.data.timezone !== member.space.timezone) {
    const space = await supabase.rpc("set_space_timezone", {
      p_timezone: parsed.data.timezone,
    });
    if (space.error) return { error: friendlyDbError(space.error) };
  }

  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function deleteAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const confirm = formData.get("confirm");
  if (
    typeof confirm !== "string" ||
    confirm.trim().toLowerCase() !== "delete"
  ) {
    return { error: 'Type "delete" to confirm.' };
  }

  const viewer = await requireViewer();
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Account deletion is not available right now." };
  }
  const { error } = await admin.auth.admin.deleteUser(viewer.id);
  if (error) return { error: "Could not delete your account. Try again." };

  const supabase = await createClient();
  // The user no longer exists server-side; this clears the session cookies.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  revalidatePath("/", "layout");
  redirect("/");
}
