import Link from "next/link";
import { Check, UserPlus, Users, X } from "lucide-react";
import {
  blockMemberAction,
  removeFriendAction,
  respondFriendRequestAction,
  sendFriendRequestAction,
} from "@/app/actions/social";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { requireProfile } from "@/lib/auth";
import { getSocialData } from "@/lib/data";

type Row = Record<string, unknown>;

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const [profile, params] = await Promise.all([requireProfile(), searchParams]);
  const social = await getSocialData(profile.id);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mutual connections"
        title="Friends"
        description="Friends can comment on each other’s public goals. Sharing lists and goals is still handled separately."
        actions={
          <details className="relative">
            <summary className="list-none">
              <Button asChild>
                <span>
                  <UserPlus className="size-4" />
                  Add friend
                </span>
              </Button>
            </summary>
            <Card className="absolute top-13 right-0 z-20 w-80 p-4">
              <form action={sendFriendRequestAction} className="space-y-3">
                <Input
                  name="username"
                  placeholder="Username"
                  defaultValue={params.add}
                  required
                />
                <Button type="submit" size="sm" className="w-full">
                  Send request
                </Button>
              </form>
            </Card>
          </details>
        }
      />
      {social.incoming.length ? (
        <section>
          <h2 className="font-display mb-3 text-xl font-semibold">
            Friend requests
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {social.incoming.map((request) => {
              const person = (request.profiles ?? {}) as Row;
              return (
                <Card
                  key={String(request.id)}
                  className="flex items-center gap-3 p-4"
                >
                  <Avatar name={String(person.display_name ?? "Member")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {String(person.display_name)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      @{String(person.username)}
                    </p>
                  </div>
                  {[true, false].map((accept) => (
                    <form
                      action={respondFriendRequestAction}
                      key={String(accept)}
                    >
                      <input
                        type="hidden"
                        name="requestId"
                        value={String(request.id)}
                      />
                      <input
                        type="hidden"
                        name="accept"
                        value={String(accept)}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        variant={accept ? "primary" : "secondary"}
                        className="size-8"
                        aria-label={accept ? "Accept" : "Decline"}
                      >
                        {accept ? (
                          <Check className="size-3.5" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                      </Button>
                    </form>
                  ))}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="font-display mb-3 text-xl font-semibold">
          Your friends
        </h2>
        {social.friends.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {social.friends.map((friend) => (
              <Card key={friend.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={friend.displayName} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/u/${friend.username}`}
                      className="truncate text-sm font-bold"
                    >
                      {friend.displayName}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">
                      @{friend.username}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <form action={removeFriendAction}>
                    <input type="hidden" name="friendId" value={friend.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Unfriend
                    </Button>
                  </form>
                  <form action={blockMemberAction}>
                    <input type="hidden" name="memberId" value={friend.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-red-700"
                    >
                      Block
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No friends connected yet"
            description="Find someone by username and send a mutual friend request."
          />
        )}
      </section>
      {social.blocks.length ? (
        <section>
          <h2 className="font-display mb-3 text-xl font-semibold">
            Blocked members
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Blocking stops invitations and interaction. It cannot hide content
            that remains public on the open web.
          </p>
        </section>
      ) : null}
    </div>
  );
}
