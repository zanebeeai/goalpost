import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleDotDashed,
  Lightbulb,
  Sprout,
  UsersRound,
} from "lucide-react";
import { QuickCaptureForm } from "@/components/idea-forms";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import {
  getCalendarData,
  getGoalsForUser,
  getIdeas,
  getLists,
} from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [lists, ideas, goals, calendar] = await Promise.all([
    getLists(profile.id),
    getIdeas({ status: "active", limit: 6 }),
    getGoalsForUser(profile.id),
    getCalendarData(profile.id),
  ]);
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const nextEvent = calendar.events.find(
    (event) => new Date(event.startsAt) >= new Date(),
  );
  return (
    <div className="space-y-9">
      <PageHeader
        eyebrow="Your growing space"
        title={`Good to see you, ${profile.display_name.split(" ")[0]}.`}
        description="Catch what is on your mind, then keep the active work moving."
        actions={
          <Button asChild variant="secondary">
            <Link href={`/u/${profile.username}`}>
              View public profile <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <Card className="border-[var(--moss-200)] bg-gradient-to-r from-white to-[var(--cream-100)] p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--forest-800)]">
          <Lightbulb className="size-4" />
          Quick capture
        </div>
        {lists.some((list) => list.role !== "viewer") ? (
          <QuickCaptureForm
            lists={lists}
            defaultListId={lists.find((list) => list.title === "Inbox")?.id}
          />
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Create or join an editable list to capture ideas.
          </p>
        )}
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">
            Loose ideas
          </p>
          <p className="font-display mt-2 text-4xl font-semibold">
            {ideas.length}
          </p>
          <Link
            href="/app/ideas"
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--forest-700)]"
          >
            Open lists <ArrowRight className="size-3" />
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">
            Active goals
          </p>
          <p className="font-display mt-2 text-4xl font-semibold">
            {activeGoals.length}
          </p>
          <Link
            href="/app/tree"
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--forest-700)]"
          >
            Visit tree <ArrowRight className="size-3" />
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Completed</p>
          <p className="font-display mt-2 text-4xl font-semibold">
            {goals.filter((goal) => goal.status === "done").length}
          </p>
          <span className="mt-4 inline-flex text-xs font-bold text-[var(--gold-500)]">
            Permanent achievements
          </span>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">
            Next on the calendar
          </p>
          {nextEvent ? (
            <>
              <p className="font-display mt-2 line-clamp-1 text-xl font-semibold">
                {nextEvent.title}
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs text-[var(--muted)]">
                <CalendarClock className="size-3.5" />
                {formatDate(nextEvent.startsAt, true)}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Nothing scheduled yet.
            </p>
          )}
        </Card>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Growing now</h2>
          <Link
            href="/app/tree"
            className="text-sm font-bold text-[var(--forest-700)]"
          >
            See full tree
          </Link>
        </div>
        {activeGoals.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeGoals.slice(0, 4).map((goal) => (
              <Card key={goal.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge>
                      <CircleDotDashed className="mr-1 size-3" />
                      active
                    </Badge>
                    <h3 className="font-display mt-3 text-2xl font-semibold">
                      <Link href={`/g/${goal.publicId}`}>{goal.title}</Link>
                    </h3>
                  </div>
                  <div className="flex -space-x-2">
                    {goal.collaborators.slice(0, 3).map((person) => (
                      <Avatar key={person.userId} name={person.displayName} />
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <Sprout className="size-3.5" />
                    Started {formatDate(goal.startedOn)}
                  </span>
                  {goal.collaborators.length > 1 ? (
                    <span className="flex items-center gap-1">
                      <UsersRound className="size-3.5" />
                      {goal.collaborators.length} collaborators
                    </span>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed p-8 text-center">
            <Sprout className="mx-auto size-7 text-[var(--moss-600)]" />
            <h3 className="font-display mt-3 text-xl font-semibold">
              No active goals yet
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Promote an idea when you are ready to start making it real.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
