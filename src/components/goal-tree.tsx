"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleDotDashed,
  GitBranch,
  List,
  PackageOpen,
  TreePine,
  UsersRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { richTextToPlainText } from "@/lib/rich-text";
import { cn, formatDate } from "@/lib/utils";
import type { Goalpost } from "@/types/domain";

function StatusIcon({ status }: { status: Goalpost["status"] }) {
  return status === "done" ? (
    <CheckCircle2 className="size-4" />
  ) : status === "waiting" ? (
    <PackageOpen className="size-4" />
  ) : (
    <CircleDotDashed className="size-4" />
  );
}

function TreeGoalCard({
  goal,
  parent,
  side,
  listMode,
}: {
  goal: Goalpost;
  parent?: Goalpost;
  side: "left" | "right";
  listMode?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative z-10 p-5 transition hover:-translate-y-0.5 hover:border-[var(--moss-400)] hover:shadow-[var(--shadow-soft)]",
        !listMode && "md:w-[calc(50%-3.5rem)]",
        !listMode && side === "right" && "md:ml-auto",
        goal.status === "done" && "border-amber-200 bg-amber-50/40",
      )}
    >
      {!listMode ? (
        <span
          className={cn(
            "absolute top-8 hidden h-px w-14 bg-[var(--moss-400)] md:block",
            side === "left" ? "-right-14" : "-left-14",
          )}
        />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <Badge
          className={cn(
            goal.status === "done" && "bg-amber-100 text-amber-800",
            goal.status === "waiting" &&
              "bg-[var(--clay-200)] text-[var(--clay-600)]",
          )}
        >
          <StatusIcon status={goal.status} />
          <span className="ml-1">{goal.status}</span>
        </Badge>
        <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
          <CalendarClock className="size-3.5" />
          {formatDate(goal.startedOn)}
        </span>
      </div>
      {parent ? (
        <p className="mt-3 flex items-center gap-1 text-xs font-bold text-[var(--moss-600)]">
          <GitBranch className="size-3.5" />
          Branch of {parent.title}
        </p>
      ) : null}
      <h3 className="font-display mt-3 text-2xl leading-tight font-semibold">
        <Link href={`/g/${goal.publicId}`} className="focus-ring rounded">
          {goal.title}
        </Link>
      </h3>
      {richTextToPlainText(goal.content) ? (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
          {richTextToPlainText(goal.content)}
        </p>
      ) : null}
      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <div className="flex -space-x-2">
          {goal.collaborators.slice(0, 4).map((person) => (
            <Avatar
              key={person.userId}
              name={person.displayName}
              className="size-7 text-[9px]"
            />
          ))}
        </div>
        <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
          {goal.taskTotal ? (
            <>
              {goal.taskDone}/{goal.taskTotal} tasks
            </>
          ) : goal.collaborators.length > 1 ? (
            <>
              <UsersRound className="size-3.5" />
              {goal.collaborators.length}
            </>
          ) : (
            "Solo goal"
          )}
        </span>
      </div>
    </Card>
  );
}

export function GoalTree({ goals }: { goals: Goalpost[] }) {
  const [mode, setMode] = useState<"tree" | "list">("tree");
  const sorted = useMemo(
    () =>
      [...goals].sort(
        (a, b) =>
          new Date(b.startedOn).getTime() - new Date(a.startedOn).getTime(),
      ),
    [goals],
  );
  const byId = useMemo(
    () => new Map(goals.map((goal) => [goal.id, goal])),
    [goals],
  );
  return (
    <div>
      <div className="mb-5 flex justify-end gap-1 rounded-full bg-[var(--cream-100)] p-1 sm:ml-auto sm:w-fit">
        <Button
          type="button"
          variant={mode === "tree" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMode("tree")}
        >
          <TreePine className="size-4" />
          Tree
        </Button>
        <Button
          type="button"
          variant={mode === "list" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMode("list")}
        >
          <List className="size-4" />
          Chronological list
        </Button>
      </div>
      {mode === "tree" ? (
        <div className="relative mx-auto max-w-5xl space-y-6 py-8 md:space-y-10 md:px-5">
          <div
            className="absolute top-0 bottom-0 left-5 w-1 rounded-full bg-gradient-to-b from-[var(--moss-200)] via-[var(--moss-400)] to-[var(--forest-800)] md:left-1/2 md:-translate-x-1/2"
            aria-hidden
          />
          {sorted.map((goal, index) => (
            <div key={goal.id} className="relative pl-12 md:pl-0">
              <span
                className="absolute top-6 left-[13px] z-20 size-4 rounded-full border-4 border-[var(--cream-50)] bg-[var(--forest-700)] md:left-1/2 md:-translate-x-1/2"
                aria-hidden
              />
              <TreeGoalCard
                goal={goal}
                parent={
                  goal.parentGoalpostId
                    ? byId.get(goal.parentGoalpostId)
                    : undefined
                }
                side={index % 2 ? "right" : "left"}
              />
            </div>
          ))}
          <div className="relative z-10 ml-1 flex size-9 items-center justify-center rounded-full bg-[var(--forest-900)] text-white md:mx-auto">
            <TreePine className="size-4" />
          </div>
        </div>
      ) : (
        <ol className="space-y-4">
          {[...sorted].reverse().map((goal) => (
            <li key={goal.id}>
              <TreeGoalCard
                goal={goal}
                parent={
                  goal.parentGoalpostId
                    ? byId.get(goal.parentGoalpostId)
                    : undefined
                }
                side="left"
                listMode
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
