import type { Metadata } from "next";
import { updatePasswordAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { requireViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "New password" };

export default async function UpdatePasswordPage() {
  await requireViewer();
  return (
    <AuthShell title="Choose a new password">
      <AuthForm mode="update" action={updatePasswordAction} next="/app" />
    </AuthShell>
  );
}
