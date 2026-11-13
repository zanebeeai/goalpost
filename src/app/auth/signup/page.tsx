import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLink, AuthShell } from "@/components/auth-shell";
import { GoogleButton, OrDivider } from "@/components/google-button";
import { SignupCard } from "@/components/signup-card";
import { getViewer } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(
    typeof params.next === "string" ? params.next : null,
  );
  if (await getViewer()) redirect(next);
  const loginHref =
    next === "/app"
      ? "/auth/login"
      : `/auth/login?next=${encodeURIComponent(next)}`;
  const invited = next.startsWith("/join/");

  return (
    <AuthShell
      footer={
        <>
          {invited ? "Already have an account? " : "Have an account? "}
          <AuthLink href={loginHref}>Log in</AuthLink>
        </>
      }
    >
      <SignupCard
        title={invited ? "You're invited" : "Start your week"}
        subtitle={
          invited
            ? "Make an account to join. It takes a minute."
            : "Make an account. You can invite a friend once you're in."
        }
        next={next}
        google={
          <>
            <GoogleButton next={next} />
            <OrDivider />
          </>
        }
      />
    </AuthShell>
  );
}
