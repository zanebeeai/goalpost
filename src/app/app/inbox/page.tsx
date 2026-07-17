import Link from "next/link";
import { Bell, Check, ListTodo, Sprout, X } from "lucide-react";
import {
  markNotificationReadAction,
  respondInvitationAction,
} from "@/app/actions/social";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProfile } from "@/lib/auth";
import { getNotifications } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { relativeDate } from "@/lib/utils";

type Row = Record<string, unknown>;

export default async function InboxPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [notifications, { data: listInvites }, { data: goalInvites }] =
    await Promise.all([
      getNotifications(profile.id),
      supabase
        .from("list_invitations")
        .select("id,role,created_at,idea_lists(title)")
        .eq("invitee_id", profile.id)
        .eq("status", "pending"),
      supabase
        .from("goal_invitations")
        .select("id,created_at,goalposts(title)")
        .eq("invitee_id", profile.id)
        .eq("status", "pending"),
    ]);
  const invites: {
    id: string;
    kind: "list" | "goal";
    title: string;
    role?: string;
  }[] = [
    ...((listInvites ?? []) as Row[]).map((item) => ({
      id: String(item.id),
      role: String(item.role),
      kind: "list" as const,
      title: String(
        (item.idea_lists as Row | undefined)?.title ?? "Shared list",
      ),
    })),
    ...((goalInvites ?? []) as Row[]).map((item) => ({
      id: String(item.id),
      kind: "goal" as const,
      title: String(
        (item.goalposts as Row | undefined)?.title ?? "Shared goal",
      ),
    })),
  ];
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Collaboration and reminders"
        title="Inbox"
        description="Invitations, friend activity, comments, status changes, and due reminders appear here."
      />
      {invites.length ? (
        <section>
          <h2 className="font-display mb-3 text-xl font-semibold">
            Needs your answer
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {invites.map((invite) => (
              <Card key={String(invite.id)} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--moss-200)]">
                    {invite.kind === "list" ? (
                      <ListTodo className="size-4" />
                    ) : (
                      <Sprout className="size-4" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{invite.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {invite.kind === "list"
                        ? `List invitation · ${String(invite.role)}`
                        : "Joint public goalpost"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {[true, false].map((accept) => (
                    <form action={respondInvitationAction} key={String(accept)}>
                      <input
                        type="hidden"
                        name="id"
                        value={String(invite.id)}
                      />
                      <input type="hidden" name="kind" value={invite.kind} />
                      <input
                        type="hidden"
                        name="accept"
                        value={String(accept)}
                      />
                      <Button
                        type="submit"
                        variant={accept ? "primary" : "secondary"}
                        size="sm"
                      >
                        {accept ? (
                          <Check className="size-3.5" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                        {accept ? "Accept" : "Decline"}
                      </Button>
                    </form>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="font-display mb-3 text-xl font-semibold">
          Recent activity
        </h2>
        {notifications.length ? (
          <div className="space-y-2">
            {notifications.map((item) => (
              <Card
                key={item.id}
                className={`flex items-start gap-4 p-4 ${item.readAt ? "opacity-65" : "border-[var(--moss-400)]"}`}
              >
                <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--clay-500)]" />
                <div className="min-w-0 flex-1">
                  {item.href ? (
                    <Link href={item.href} className="text-sm font-bold">
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-bold">{item.title}</p>
                  )}
                  {item.body ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.body}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {relativeDate(item.createdAt)}
                  </p>
                </div>
                {!item.readAt ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Mark read
                    </Button>
                  </form>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="All quiet"
            description="New collaboration activity and due reminders will arrive here."
          />
        )}
      </section>
    </div>
  );
}
