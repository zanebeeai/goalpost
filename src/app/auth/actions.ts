"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";
import {
  emailSchema,
  fields,
  firstIssue,
  passwordSchema,
} from "@/lib/validation";

export type AuthState = { error?: string; message?: string };

const NOT_CONFIGURED: AuthState = {
  error: "Sign-in is not available right now.",
};

const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

function nextPath(formData: FormData): string {
  const value = formData.get("next");
  return safeRedirectPath(typeof value === "string" ? value : null, "/app");
}

/** OAuth returns here with a PKCE code (same browser by design). */
function callbackUrl(next: string): string {
  return `${getPublicEnv().siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}

/**
 * Email templates link to /auth/confirm with `next={{ .RedirectTo }}`, so the
 * redirect URL is simply where the user should land afterwards.
 */
function emailRedirectUrl(next: string): string {
  return `${getPublicEnv().siteUrl}${next}`;
}

function isLocalAuth(): boolean {
  const host = new URL(getPublicEnv().supabaseUrl).hostname;
  return host === "127.0.0.1" || host === "localhost";
}

export async function signUpAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = credentialsSchema.safeParse(
    fields(formData, "email", "password"),
  );
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const next = nextPath(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: emailRedirectUrl(next) },
  });
  if (error) {
    if (
      error.code === "user_already_exists" ||
      error.message === "User already registered"
    ) {
      return { error: "That email already has an account. Log in instead." };
    }
    return { error: error.message };
  }
  // Email confirmation disabled: the user is signed in right away.
  if (data.session) redirect(next);

  return {
    message: isLocalAuth()
      ? "Check your email. Locally, it's in the mail catcher at http://127.0.0.1:54324."
      : "Check your email for a link to finish signing up.",
  };
}

export async function signInAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z
    .object({
      email: emailSchema,
      password: z.string("Enter your password.").min(1, "Enter your password."),
    })
    .safeParse(fields(formData, "email", "password"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirm your email first. Check your inbox." };
    }
    return { error: "That email and password don't match." };
  }
  redirect(nextPath(formData));
}

export async function signInWithGoogleAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/login?error=oauth");
  const next = nextPath(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next) },
  });
  if (error || !data.url) {
    redirect(`/auth/login?error=oauth&next=${encodeURIComponent(next)}`);
  }
  redirect(data.url);
}

export async function requestPasswordResetAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: emailRedirectUrl("/auth/update-password"),
  });
  return { message: "If that account exists, a reset link is on its way." };
}

export async function updatePasswordAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { error: "That reset link expired. Request a new one." };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    if (error.code === "same_password") {
      return {
        error: "That is your current password. Choose a different one.",
      };
    }
    if (error.code === "weak_password") return { error: error.message };
    return { error: "Could not update your password. Try again." };
  }
  return { message: "Password updated." };
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
