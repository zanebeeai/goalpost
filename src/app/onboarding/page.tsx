import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { completeOnboardingAction } from "@/app/actions/space";
import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { AuthShell } from "@/components/auth-shell";
import { joinNames } from "@/components/names";
import { TimezoneInput } from "@/components/timezone-input";
import { Input } from "@/components/ui/input";
import { getMember, requireViewer } from "@/lib/auth";
import { getInvitePreview } from "@/lib/data";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireViewer();
  const params = await searchParams;
  const code = typeof params.invite === "string" ? params.invite.trim() : "";
  if (await getMember()) {
    redirect(code ? `/join/${encodeURIComponent(code)}` : "/app");
  }

  const names = code ? await getInvitePreview(code) : null;
  const invite = names && names.length > 0 ? code : "";

  return (
    <AuthShell
      title="What should we call you?"
      subtitle={
        invite ? (
          <>
            You&apos;re joining{" "}
            <strong className="font-semibold text-forest-900">
              {joinNames(names ?? [])}
            </strong>
            .
          </>
        ) : code ? (
          "That invite link is no longer valid, so you'll start your own space. You can invite a friend once you're in."
        ) : (
          "Your friends will see this name."
        )
      }
    >
      <ActionForm
        action={completeOnboardingAction}
        errorInline
        className="space-y-4"
      >
        <TimezoneInput />
        <input type="hidden" name="invite" value={invite} />
        <label htmlFor="displayName" className="sr-only">
          Your name
        </label>
        <Input
          id="displayName"
          name="displayName"
          required
          maxLength={40}
          autoComplete="given-name"
          autoFocus
          placeholder="Your first name"
        />
        <FieldError className="mt-0" />
        <SubmitButton size="lg" className="w-full" pendingLabel="Setting up">
          {invite ? "Join" : "Start"}
        </SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
