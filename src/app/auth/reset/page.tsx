import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
};

export default function ResetPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="We will send a secure reset link if the email is registered."
    >
      <AuthForm mode="reset" />
    </AuthShell>
  );
}
