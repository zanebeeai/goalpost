import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthLink, AuthShell } from "@/components/auth-shell";
import { FormError } from "@/components/action-form";
import { GoogleButton, OrDivider } from "@/components/google-button";
import { getViewer } from "@/lib/auth";
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
  const failure =
    params.error === "oauth"
      ? "Google sign-in didn't go through. Try again."
      : params.error === "confirm"
        ? "That email link expired or was already used. Try logging in, or ask for a new link."
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
      <GoogleButton next={next} />
      <OrDivider />
      <AuthForm mode="login" action={signInAction} next={next} />
    </AuthShell>
  );
}
