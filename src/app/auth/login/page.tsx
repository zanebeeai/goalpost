import type { Metadata } from "next";
import { signInWithGoogleAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next, "/app");
  return (
    <AuthShell
      title="Welcome back"
      description="Pick up where the work last left you."
    >
      <AuthForm
        mode="login"
        next={next}
        googleAction={signInWithGoogleAction}
      />
    </AuthShell>
  );
}
