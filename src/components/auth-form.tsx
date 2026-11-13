"use client";

import Link from "next/link";
import { useState } from "react";
import type { AuthState } from "@/app/auth/actions";
import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Mode = "login" | "signup" | "reset" | "update";

const SUBMIT: Record<Mode, [string, string]> = {
  login: ["Log in", "Logging in"],
  signup: ["Create account", "Creating account"],
  reset: ["Send reset link", "Sending"],
  update: ["Save password", "Saving"],
};

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: Mode;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next?: string;
}) {
  const [label, pendingLabel] = SUBMIT[mode];
  const [sent, setSent] = useState(false);
  const needsEmail = mode !== "update";
  const needsPassword = mode !== "reset";

  return (
    <>
      <ActionForm
        action={async (state: AuthState, formData: FormData) => {
          const result = await action(state, formData);
          setSent(Boolean(result.message));
          return result;
        }}
        errorInline
        className="space-y-4"
      >
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {needsEmail && !sent ? (
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </div>
        ) : null}
        {needsPassword && !sent ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">
                {mode === "update" ? "New password" : "Password"}
              </Label>
              {mode === "login" ? (
                <Link
                  href="/auth/reset"
                  className="-my-3 inline-flex min-h-11 items-center rounded px-1 text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  Forgot it?
                </Link>
              ) : null}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "login" ? undefined : 8}
              required
            />
            {mode === "signup" || mode === "update" ? (
              <p className="text-sm text-muted">At least 8 characters.</p>
            ) : null}
          </div>
        ) : null}
        <FieldError className="mt-0" />
        {sent ? null : (
          <SubmitButton
            size="lg"
            className="w-full"
            pendingLabel={pendingLabel}
          >
            {label}
          </SubmitButton>
        )}
      </ActionForm>
      {sent && mode === "update" ? (
        <Button asChild size="lg" className="mt-4 w-full">
          <Link href="/app">Go to this week</Link>
        </Button>
      ) : null}
    </>
  );
}
