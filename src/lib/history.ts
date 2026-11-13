import type { HistoryWeek, MemberSummary, WeekEntry } from "@/lib/data";
import { weekStartAt } from "@/lib/week";

export type MemberWithJoin = MemberSummary & {
  /** profiles.created_at: account setup, not the date of a later space move. */
  joinedAt: string;
};

export type GoalRow = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  finishedAt: string | null;
};

export type CheckinRow = { goalId: string; weekStart: string; body: string };

/** Titles of `userId`'s goals finished during `weekStart` in `timezone`. */
export function finishedInWeek(
  goals: GoalRow[],
  userId: string,
  weekStart: string,
  timezone: string,
): string[] {
  return goals
    .filter(
      (goal): goal is GoalRow & { finishedAt: string } =>
        goal.userId === userId &&
        goal.finishedAt !== null &&
        weekStartAt(goal.finishedAt, timezone) === weekStart,
    )
    .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    .map((goal) => goal.title);
}

/**
 * Weeks before `beforeWeekStart` with any entry, check-in, or finished goal,
 * newest first, at most `limit`.
 */
export function historyWeekStarts(input: {
  weekStarts: string[];
  checkinStarts: string[];
  goals: GoalRow[];
  timezone: string;
  beforeWeekStart: string;
  limit: number;
}): string[] {
  const finishedStarts = input.goals.flatMap((goal) =>
    goal.finishedAt ? [weekStartAt(goal.finishedAt, input.timezone)] : [],
  );
  return [
    ...new Set([
      ...input.weekStarts,
      ...input.checkinStarts,
      ...finishedStarts,
    ]),
  ]
    .filter((start) => start < input.beforeWeekStart)
    .sort()
    .reverse()
    .slice(0, Math.max(0, input.limit));
}

export function assembleHistory(input: {
  starts: string[];
  members: MemberWithJoin[];
  weeks: WeekEntry[];
  goals: GoalRow[];
  checkins: CheckinRow[];
  timezone: string;
}): HistoryWeek[] {
  const goals = new Map(input.goals.map((goal) => [goal.id, goal]));
  return input.starts.map((weekStart) => ({
    weekStart,
    columns: input.members.flatMap(({ joinedAt, ...member }) => {
      const week =
        input.weeks.find(
          (entry) =>
            entry.weekStart === weekStart && entry.userId === member.id,
        ) ?? null;
      const checkins = input.checkins
        .filter((checkin) => checkin.weekStart === weekStart)
        .flatMap((checkin) => {
          const goal = goals.get(checkin.goalId);
          return goal?.userId === member.id ? [{ checkin, goal }] : [];
        })
        .sort((a, b) => a.goal.createdAt.localeCompare(b.goal.createdAt))
        .map(({ checkin, goal }) => ({
          goalTitle: goal.title,
          body: checkin.body,
        }));
      const finishedGoals = finishedInWeek(
        input.goals,
        member.id,
        weekStart,
        input.timezone,
      );
      const active =
        week !== null || checkins.length > 0 || finishedGoals.length > 0;
      // Skip members for weeks that ended before they joined, unless they
      // brought entries for that week with them.
      if (!active && weekStartAt(joinedAt, input.timezone) > weekStart) {
        return [];
      }
      return [{ member, week, checkins, finishedGoals }];
    }),
  }));
}
