import Link from "next/link";
import {
  AlertTriangle,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Upload,
} from "lucide-react";
import {
  deleteAccountAction,
  updateProfileAction,
  uploadAvatarAction,
} from "@/app/actions/settings";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { requireProfile, requireViewer } from "@/lib/auth";
import { getSignedMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const [profile, viewer] = await Promise.all([
    requireProfile(),
    requireViewer(),
  ]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("bio,email_reminders_enabled")
    .eq("id", profile.id)
    .single();
  const avatarUrl = await getSignedMediaUrl(profile.avatar_path);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account and privacy"
        title="Settings"
        description="Your profile and goal content are public. Account credentials, ideas, reminders, and notifications remain private."
        actions={
          <Button asChild variant="secondary">
            <Link href={`/u/${profile.username}`}>
              View profile <ExternalLink className="size-4" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-2xl font-semibold">
              Public profile
            </h2>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row">
              <div>
                <Avatar
                  name={profile.display_name}
                  src={avatarUrl}
                  className="size-24 text-xl"
                />
                <form action={uploadAvatarAction} className="mt-3 space-y-2">
                  <Input
                    type="file"
                    name="avatar"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="max-w-64 text-xs"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    <Upload className="size-3.5" />
                    Upload avatar
                  </Button>
                </form>
              </div>
              <form action={updateProfileAction} className="flex-1 space-y-4">
                <label className="block text-sm font-semibold">
                  Display name
                  <Input
                    name="displayName"
                    className="mt-1.5"
                    defaultValue={profile.display_name}
                    maxLength={80}
                    required
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Username
                  <Input
                    className="mt-1.5"
                    value={profile.username}
                    readOnly
                    disabled
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Bio
                  <Textarea
                    name="bio"
                    className="mt-1.5"
                    defaultValue={data?.bio ?? ""}
                    maxLength={500}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Timezone
                  <Input
                    name="timezone"
                    className="mt-1.5"
                    defaultValue={profile.timezone}
                    required
                  />
                </label>
                <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                  <input
                    type="checkbox"
                    name="emailReminders"
                    defaultChecked={data?.email_reminders_enabled ?? true}
                    className="size-4 accent-[var(--forest-800)]"
                  />
                  Send email for scheduled reminders
                </label>
                <Button type="submit">Save profile</Button>
              </form>
            </div>
          </Card>
          <Card className="border-red-200 p-6">
            <h2 className="font-display text-2xl font-semibold text-red-900">
              Delete account
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Shared lists and goals transfer to the longest-standing eligible
              collaborator. Sole-owned work is deleted, and retained shared
              contributions become attributed to “Deleted user.” Backups expire
              within 30 days.
            </p>
            <form
              action={deleteAccountAction}
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <Input
                name="confirmation"
                placeholder="Type DELETE MY ACCOUNT"
                pattern="DELETE MY ACCOUNT"
                required
              />
              <Button type="submit" variant="danger">
                Delete permanently
              </Button>
            </form>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            <Globe2 className="size-5 text-[var(--clay-600)]" />
            <h2 className="font-display mt-3 text-xl font-semibold">
              Always public
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Your name, username, avatar, bio, goal tree, goal details,
              collaborators, public comments, and goal attachments.
            </p>
          </Card>
          <Card className="p-5">
            <LockKeyhole className="size-5 text-[var(--forest-700)]" />
            <h2 className="font-display mt-3 text-xl font-semibold">
              Always private
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Your email ({viewer.email}), idea lists, reminder settings,
              notifications, blocks, and reports.
            </p>
          </Card>
          <div className="flex gap-2 rounded-xl border border-[var(--clay-200)] bg-orange-50 p-4 text-xs leading-5 text-[var(--clay-600)]">
            <AlertTriangle className="size-4 shrink-0" />
            Blocking prevents interaction but cannot hide a public profile or
            goal from anonymous visitors.
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>
              <Link href="/legal/privacy">Privacy</Link>
            </Badge>
            <Badge>
              <Link href="/legal/terms">Terms</Link>
            </Badge>
            <Badge>
              <Link href="/legal/community">Community</Link>
            </Badge>
          </div>
        </aside>
      </div>
    </div>
  );
}
