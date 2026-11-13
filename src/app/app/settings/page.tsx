import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import {
  deleteAccountAction,
  rotateInviteAction,
  updateSettingsAction,
} from "@/app/actions/space";
import { signOutAction } from "@/app/auth/actions";
import {
  ActionForm,
  FieldError,
  SavedHint,
  SubmitButton,
} from "@/components/action-form";
import { TimezoneSelect } from "@/components/timezone-select";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requireMember } from "@/lib/auth";
import { getMembers } from "@/lib/data";
import { getPublicEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Settings" };

function timezones(current: string): string[] {
  const zones = Intl.supportedValuesOf("timeZone");
  return zones.includes(current) ? zones : [current, ...zones];
}

function Section({
  title,
  children,
  description,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const id = `settings-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className="rounded-3xl border border-line bg-card p-5 sm:p-6"
    >
      <h2
        id={id}
        className="font-display text-xl font-semibold text-forest-900"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const member = await requireMember();
  const members = await getMembers();
  const inviteUrl = `${getPublicEnv().siteUrl}/join/${member.space.inviteCode}`;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="font-display text-[1.75rem] leading-tight font-semibold tracking-tight text-forest-900 sm:text-4xl">
          Settings
        </h1>
        {member.email ? (
          <p className="mt-1 text-[15px] break-all text-muted">
            {member.email}
          </p>
        ) : null}
      </header>

      <div className="space-y-4">
        <Section title="You">
          <ActionForm
            action={updateSettingsAction}
            errorInline
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={member.displayName}
                required
                maxLength={40}
                autoComplete="given-name"
              />
              <FieldError className="mt-1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <TimezoneSelect
                zones={timezones(member.space.timezone)}
                value={member.space.timezone}
              />
              <p className="text-sm text-muted">
                Shared by your space. It decides when Sunday and Friday start.
              </p>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="emailNudges"
                defaultChecked={member.emailNudges}
                className="size-5 shrink-0 cursor-pointer rounded accent-forest-900"
              />
              <span className="text-[16px] text-ink">
                Email me on Sunday and Friday
              </span>
            </label>
            <div className="flex items-center gap-3">
              <SubmitButton pendingLabel="Saving">Save</SubmitButton>
              <SavedHint />
            </div>
          </ActionForm>
        </Section>

        <Section title="Your space">
          <ul className="space-y-2">
            {members.map((person) => (
              <li key={person.id} className="flex items-center gap-3">
                <Avatar name={person.displayName} me={person.isMe} />
                <span className="min-w-0 font-semibold wrap-anywhere text-ink">
                  {person.displayName}
                  {person.isMe ? (
                    <span className="font-normal text-muted"> (you)</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Invite link"
          description="Anyone with this link can join your space."
        >
          <p className="truncate rounded-xl border border-line bg-white/70 px-3.5 py-3 font-mono text-sm text-muted">
            {inviteUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton value={inviteUrl} />
            <ShareButton
              label="Share"
              text="Join me on Goalpost. We each pick something to learn on Sunday and interview each other on Friday."
              url={inviteUrl}
            />
          </div>
          <ActionForm
            action={rotateInviteAction}
            className="mt-5 border-t border-line pt-4"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <SubmitButton variant="secondary" pendingLabel="Resetting">
                Reset link
              </SubmitButton>
              <SavedHint>New link ready</SavedHint>
            </div>
            <p className="mt-2 text-sm text-muted">
              The old link stops working.
            </p>
          </ActionForm>
        </Section>

        <Section title="Account">
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              <LogOut aria-hidden />
              Sign out
            </Button>
          </form>

          <details className="group mt-6 border-t border-line pt-2">
            <summary className="-mx-2 flex min-h-11 items-center justify-between rounded-lg px-2 text-sm font-semibold text-clay-ink hover:bg-clay/10">
              Delete account
              <ChevronDown
                aria-hidden
                className="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <ActionForm action={deleteAccountAction} className="mt-2 space-y-3">
              <p className="text-[15px] leading-relaxed text-ink">
                This removes your account and everything you wrote. It
                can&apos;t be undone.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-delete">
                  Type <span className="font-mono">delete</span> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  name="confirm"
                  required
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  pattern="[Dd][Ee][Ll][Ee][Tt][Ee]"
                />
              </div>
              <SubmitButton variant="danger" pendingLabel="Deleting">
                Delete my account
              </SubmitButton>
            </ActionForm>
          </details>
        </Section>
      </div>
    </div>
  );
}
