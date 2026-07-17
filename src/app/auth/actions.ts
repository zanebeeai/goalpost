"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { emailSchema, firstIssue, passwordSchema } from "@/lib/validation";
import { safeRedirectPath } from "@/lib/utils";

export type AuthState = { error?: string; message?: string };

const signUpSchema = z.object({ email: emailSchema, password: passwordSchema });

export async function signUpAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const headerStore = await headers();
  const verified = await verifyTurnstile(
    formData.get("cf-turnstile-response")?.toString() ?? null,
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim(),
  );
  if (!verified) return { error: "Please complete the security check." };

  const env = getPublicEnv();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };
  const authHost = new URL(env.supabaseUrl).hostname;
  if (authHost === "127.0.0.1" || authHost === "localhost") {
    return {
      message:
        "Verification email captured locally. Open Mailpit at http://127.0.0.1:54324, then click Confirm email address.",
    };
  }
  return {
    message:
      "Check your email to verify your account, then finish setting up your profile.",
  };
}

export async function signInAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({
      email: emailSchema,
      password: z.string().min(1, "Enter your password"),
    })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email or password was not recognized." };
  const nextPath = safeRedirectPath(formData.get("next")?.toString(), "/app");
  redirect(nextPath);
}

export async function signInWithGoogleAction(formData: FormData) {
  const nextPath = safeRedirectPath(formData.get("next")?.toString(), "/app");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getPublicEnv().siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error || !data.url) redirect("/auth/login?error=oauth");
  redirect(data.url);
}

export async function requestPasswordResetAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${getPublicEnv().siteUrl}/auth/callback?next=/auth/update-password`,
  });
  return {
    message: "If that account exists, a password-reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };
  return { message: "Password updated. You can return to Goalpost." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
