import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthLink, AuthShell } from "@/components/auth-shell";
import { FormError } from "@/components/action-form";
import { GoogleButton, OrDivider } from "@/components/google-button";
import { getViewer } from "@/lib/auth";
import { isGoogleAuthEnabled } from "@/lib/auth-providers";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(
    typeof params.next === "string" ? params.next : null,
  );
  if (await getViewer()) redirect(next);
  const google = await isGoogleAuthEnabled();
  const failure =
    params.error === "oauth"
      ? google
        ? "Google sign-in didn't go through. Try again, or use your email and password."
        : "Google sign-in isn't available. Log in with your email and password."
      : params.error === "confirm"
        ? "That link expired or was already used. If you already confirmed your email, log in below. If not, sign up again for a new link."
        : params.error === "reset"
          ? 'That reset link expired or was already used. Use "Forgot it?" below to get a new one.'
          : typeof params.error === "string"
            ? "That link didn't work. Try logging in again."
            : null;
  const signupHref =
    next === "/app"
      ? "/auth/signup"
      : `/auth/signup?next=${encodeURIComponent(next)}`;

  return (
    <AuthShell
      title="Welcome back"
      footer={
        <>
          New here? <AuthLink href={signupHref}>Create an account</AuthLink>
        </>
      }
    >
      {failure ? (
        <div className="-mt-2 mb-5">
          <FormError>{failure}</FormError>
        </div>
      ) : null}
      {google ? (
        <>
          <GoogleButton next={next} />
          <OrDivider />
        </>
      ) : null}
      <AuthForm mode="login" action={signInAction} next={next} />
    </AuthShell>
  );
}
