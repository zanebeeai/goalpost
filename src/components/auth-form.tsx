"use client";

import Script from "next/script";
import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Chrome, LoaderCircle } from "lucide-react";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  type AuthState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "signup" | "reset" | "update";

const actionByMode = {
  login: signInAction,
  signup: signUpAction,
  reset: requestPasswordResetAction,
  update: updatePasswordAction,
};

function SubmitButton({ mode, pending }: { mode: Mode; pending: boolean }) {
  const label = {
    login: "Log in",
    signup: "Create account",
    reset: "Send reset link",
    update: "Update password",
  }[mode];
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

export function AuthForm({
  mode,
  next = "/app",
  googleAction,
}: {
  mode: Mode;
  next?: string;
  googleAction?: (formData: FormData) => void | Promise<void>;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    actionByMode[mode],
    {},
  );
  const needsEmail = mode !== "update";
  const needsPassword =
    mode === "login" || mode === "signup" || mode === "update";
  const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="space-y-5">
      {(mode === "login" || mode === "signup") && googleAction ? (
        <>
          <form action={googleAction}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" variant="secondary" className="w-full">
              <Chrome className="size-4" />
              Continue with Google
            </Button>
          </form>
          <div className="flex items-center gap-3 text-xs tracking-widest text-[var(--muted)] uppercase">
            <span className="h-px flex-1 bg-[var(--line)]" />
            or
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>
        </>
      ) : null}
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {needsEmail ? (
          <label className="block text-sm font-semibold">
            Email
            <Input
              className="mt-1.5"
              type="email"
              name="email"
              autoComplete="email"
              required
            />
          </label>
        ) : null}
        {needsPassword ? (
          <label className="block text-sm font-semibold">
            {mode === "update" ? "New password" : "Password"}
            <Input
              className="mt-1.5"
              type="password"
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "login" ? 1 : 10}
              required
            />
          </label>
        ) : null}
        {mode === "signup" && turnstileKey ? (
          <>
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="afterInteractive"
            />
            <div
              className="cf-turnstile"
              data-sitekey={turnstileKey}
              data-theme="light"
            />
          </>
        ) : null}
        {state.error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </p>
        ) : null}
        <SubmitButton mode={mode} pending={pending} />
      </form>
      {mode === "login" ? (
        <div className="flex justify-between text-sm">
          <Link
            href="/auth/reset"
            className="font-semibold text-[var(--forest-700)]"
          >
            Forgot password?
          </Link>
          <Link
            href="/auth/signup"
            className="font-semibold text-[var(--forest-700)]"
          >
            Create account
          </Link>
        </div>
      ) : null}
      {mode === "signup" ? (
        <p className="text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[var(--forest-700)]"
          >
            Log in
          </Link>
        </p>
      ) : null}
    </div>
  );
}
