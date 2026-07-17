import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = {
  title: "Update password",
  robots: { index: false },
};

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least ten characters with uppercase, lowercase, and a number."
    >
      <AuthForm mode="update" />
    </AuthShell>
  );
}
