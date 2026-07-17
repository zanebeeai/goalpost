import type { Metadata } from "next";
import { signInWithGoogleAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Start your Goalpost"
      description="Your idea lists begin private. Anything promoted to your goal tree becomes public on the open web."
    >
      <AuthForm
        mode="signup"
        next="/onboarding"
        googleAction={signInWithGoogleAction}
      />
    </AuthShell>
  );
}
