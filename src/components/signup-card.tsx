"use client";

import { useState, type ReactNode } from "react";
import { signUpAction, type AuthState } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthHeading } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

/** Signup form that turns into a single "check your email" card once sent. */
export function SignupCard({
  title,
  subtitle,
  next,
  google,
}: {
  title: string;
  subtitle: string;
  next: string;
  google: ReactNode;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  async function signUp(state: AuthState, formData: FormData) {
    const result = await signUpAction(state, formData);
    if (result.message && !result.error) {
      setSentTo(String(formData.get("email") ?? ""));
    }
    return result;
  }

  if (sentTo !== null) {
    return (
      <div role="status">
        <AuthHeading title="Check your email" />
        <p className="mt-3 text-[16px] leading-relaxed text-ink">
          We sent a link to{" "}
          <strong className="font-semibold break-all text-forest-900">
            {sentTo}
          </strong>
          . Open the link to finish signing up.
        </p>
        <Button
          variant="secondary"
          size="lg"
          className="mt-7 w-full"
          onClick={() => {
            setSentTo(null);
            setAttempt((value) => value + 1);
          }}
        >
          Wrong address? Start over
        </Button>
      </div>
    );
  }

  return (
    <>
      <AuthHeading title={title} subtitle={subtitle} />
      <div className="mt-7">
        {google}
        <AuthForm key={attempt} mode="signup" action={signUp} next={next} />
      </div>
    </>
  );
}
