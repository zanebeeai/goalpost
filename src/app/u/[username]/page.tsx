import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Sprout, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { GoalTree } from "@/components/goal-tree";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGoalsForUser, getProfileByUsername } from "@/lib/data";
import { getSignedMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return {};
  return {
    title: `${profile.displayName} (@${profile.username})`,
    description:
      profile.bio ??
      `Follow ${profile.displayName}'s public history of goals on Goalpost.`,
    alternates: { canonical: `/u/${profile.username}` },
    openGraph: {
      title: `${profile.displayName}'s goalpost tree`,
      description: profile.bio ?? "A public history of goals and progress.",
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();
  const [goals, avatarUrl] = await Promise.all([
    getGoalsForUser(profile.id),
    getSignedMediaUrl(profile.avatarPath, 86400),
  ]);
  const collaboratorCount = new Set(
    goals
      .flatMap((goal) => goal.collaborators.map((person) => person.userId))
      .filter((id) => id !== profile.id),
  ).size;
  return (
    <main>
      <SiteHeader />
      <section className="border-b bg-[var(--white)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:px-8 sm:py-16">
          <Avatar
            name={profile.displayName}
            src={avatarUrl}
            className="size-24 text-2xl ring-4 ring-[var(--cream-100)]"
          />
          <div className="min-w-0 flex-1">
            <Badge>Public goalpost tree</Badge>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {profile.displayName}
            </h1>
            <p className="mt-1 text-sm font-semibold text-[var(--moss-600)]">
              @{profile.username}
            </p>
            {profile.bio ? (
              <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
                {profile.bio}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Joined {formatDate(profile.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Sprout className="size-3.5" />
                {goals.length} goals
              </span>
              <span className="flex items-center gap-1">
                <UsersRound className="size-3.5" />
                {collaboratorCount} collaborators
              </span>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/app/friends?add=${profile.username}`}>Connect</Link>
          </Button>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {goals.length ? (
          <GoalTree goals={goals} />
        ) : (
          <Card className="border-dashed p-12 text-center">
            <Sprout className="mx-auto size-8 text-[var(--moss-600)]" />
            <h2 className="font-display mt-3 text-2xl font-semibold">
              Nothing planted yet
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This public tree will grow when the first goalpost is created.
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
