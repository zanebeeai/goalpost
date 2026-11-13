import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { joinSpaceAction } from "@/app/actions/space";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { AuthShell } from "@/components/auth-shell";
import { joinNames } from "@/components/names";
import { Button } from "@/components/ui/button";
import { getMember, requireViewer } from "@/lib/auth";
import { getInvitePreview, getMembers } from "@/lib/data";

export const metadata: Metadata = { title: "Invite" };

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.trim();
  await requireViewer();
  const member = await getMember();
  if (!member) redirect(`/onboarding?invite=${encodeURIComponent(code)}`);
  if (member.space.inviteCode === code) redirect("/app");

  const names = await getInvitePreview(code);
  if (!names || names.length === 0) {
    return (
      <AuthShell
        title="This invite link is no longer valid"
        subtitle="Ask your friend to send you a fresh one from their settings."
      >
        <Button asChild size="lg" className="w-full">
          <Link href="/app">Go to your week</Link>
        </Button>
      </AuthShell>
    );
  }

  const currentPartners = (await getMembers())
    .filter((person) => !person.isMe)
    .map((person) => person.displayName);
  const leaving = currentPartners.length > 0;

  return (
    <AuthShell
      title={`Join ${joinNames(names)}?`}
      subtitle={
        leaving ? (
          <>
            {`You'll leave your space with ${joinNames(currentPartners)}. They won't see your weeks anymore.`}
            <br />
            Your own weeks and goals come with you.
          </>
        ) : (
          "Your own weeks and goals come with you."
        )
      }
    >
      <ActionForm action={joinSpaceAction}>
        <input type="hidden" name="invite" value={code} />
        <SubmitButton size="lg" className="w-full" pendingLabel="Joining">
          {leaving ? "Leave and join" : "Join"}
        </SubmitButton>
      </ActionForm>
      <Button asChild variant="ghost" size="lg" className="mt-2 w-full">
        <Link href="/app">Not now</Link>
      </Button>
    </AuthShell>
  );
}
