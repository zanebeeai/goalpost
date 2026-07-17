import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  PackageOpen,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProfile } from "@/lib/auth";
import { getCalendarData, getGoalsForUser } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function CalendarPage() {
  const profile = await requireProfile();
  const [calendar, goals] = await Promise.all([
    getCalendarData(profile.id),
    getGoalsForUser(profile.id),
  ]);
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]));
  const entries = [
    ...calendar.events.map((event) => ({
      id: `event-${event.id}`,
      at: event.startsAt,
      title: event.title,
      kind: event.eventType,
      goalpostId: event.goalpostId,
      completed: false,
    })),
    ...calendar.tasks.map((task) => ({
      id: `task-${task.id}`,
      at: task.dueAt ?? "",
      title: task.title,
      kind: "task",
      goalpostId: task.goalpostId,
      completed: Boolean(task.completedAt),
    })),
  ]
    .filter((entry) => entry.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const grouped = Map.groupBy(entries, (entry) => entry.at.slice(0, 10));
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={profile.timezone}
        title="Calendar"
        description="Public goal events and task dates, organized in your local timezone. Reminder delivery remains private."
      />
      {entries.length ? (
        <div className="space-y-8">
          {[...grouped.entries()].map(([date, items]) => (
            <section key={date}>
              <h2 className="font-display mb-3 text-xl font-semibold">
                {formatDate(date)}
              </h2>
              <div className="space-y-2">
                {items.map((item) => {
                  const goal = goalMap.get(item.goalpostId);
                  const Icon = item.completed
                    ? CheckCircle2
                    : item.kind === "delivery"
                      ? PackageOpen
                      : CircleDot;
                  return (
                    <Card key={item.id} className="flex items-center gap-4 p-4">
                      <span
                        className={`flex size-9 items-center justify-center rounded-xl ${item.completed ? "bg-emerald-100 text-emerald-800" : "bg-[var(--cream-100)] text-[var(--forest-700)]"}`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-bold ${item.completed ? "text-[var(--muted)] line-through" : ""}`}
                        >
                          {item.title}
                        </p>
                        {goal ? (
                          <Link
                            href={`/g/${goal.publicId}`}
                            className="text-xs text-[var(--moss-600)]"
                          >
                            {goal.title}
                          </Link>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">
                          {formatDate(item.at, true).split(" at ")[1]}
                        </p>
                        <Badge className="mt-1">{item.kind}</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Your calendar is clear"
          description="Dated tasks and timeline events from your goalposts will appear here."
        />
      )}
    </div>
  );
}
