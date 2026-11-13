import type { Metadata } from "next";
import { requestPasswordResetAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthLink, AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={<AuthLink href="/auth/login">Back to log in</AuthLink>}
    >
      <AuthForm mode="reset" action={requestPasswordResetAction} />
    </AuthShell>
  );
}
