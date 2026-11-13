import { addDays } from "@/lib/week";

export const MAX_ACTIVE_GOALS = 3;
export const MAX_GOAL_DAYS_AHEAD = 365;
export const DEFAULT_GOAL_DAYS_AHEAD = 28;

export type GoalDue = {
  /** Negative when overdue. */
  daysLeft: number;
  overdue: boolean;
  /** "3 weeks left", "Due Friday", "2 days over". */
  label: string;
  /** "Dec 11", or "Jan 9, 2027" when the year differs from today's. */
  dateLabel: string;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC midnight for a real "YYYY-MM-DD" date, or null. */
function parseDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  const value = new Date(Date.UTC(year, month - 1, day));
  // Reject dates that roll over, such as 2026-02-30.
  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    return null;
  }
  return value;
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

export function defaultTargetDate(today: string): string {
  return addDays(today, DEFAULT_GOAL_DAYS_AHEAD);
}

export function maxTargetDate(today: string): string {
  return addDays(today, MAX_GOAL_DAYS_AHEAD);
}

/** null when valid, otherwise a sentence to show the user. */
export function targetDateError(
  targetDate: string,
  today: string,
): string | null {
  if (!parseDate(targetDate.trim())) return "Pick a date for this goal.";
  const value = targetDate.trim();
  // ISO dates compare correctly as strings.
  if (value < today) return "Pick today or a later date.";
  if (value > maxTargetDate(today)) return "Pick a date within a year.";
  return null;
}

function dueLabel(daysLeft: number, target: Date): string {
  if (daysLeft < 0) return `${plural(-daysLeft, "day")} over`;
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "Due tomorrow";
  if (daysLeft < 7) return `Due ${WEEKDAYS[target.getUTCDay()]}`;
  if (daysLeft < 14) return `${plural(daysLeft, "day")} left`;
  if (daysLeft < 60) return `${plural(Math.floor(daysLeft / 7), "week")} left`;
  return `${plural(Math.round(daysLeft / 30.44), "month")} left`;
}

/**
 * How far away a goal's date is. Never throws: a stored value it cannot read
 * comes back as not overdue, with no label and the raw value as the date.
 */
export function goalDue(targetDate: string, today: string): GoalDue {
  const target = parseDate(targetDate);
  const now = parseDate(today);
  if (!target || !now) {
    return { daysLeft: 0, overdue: false, label: "", dateLabel: targetDate };
  }
  const daysLeft = Math.round((target.getTime() - now.getTime()) / DAY_MS);
  const label = dueLabel(daysLeft, target);

  const month = MONTHS[target.getUTCMonth()];
  const sameYear = target.getUTCFullYear() === now.getUTCFullYear();
  const dateLabel = sameYear
    ? `${month} ${target.getUTCDate()}`
    : `${month} ${target.getUTCDate()}, ${target.getUTCFullYear()}`;

  return { daysLeft, overdue: daysLeft < 0, label, dateLabel };
}
