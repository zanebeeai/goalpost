export type Phase = "pick" | "learn" | "interview" | "wrap";

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

const FRIDAY = 5;

function parseDate(date: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Expected a YYYY-MM-DD date, got "${date}"`);
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function dayOfWeek(date: string): number {
  return parseDate(date).getUTCDay();
}

/** Calendar date "YYYY-MM-DD" in the given IANA timezone. */
export function todayIn(timezone: string, now: Date = new Date()): string {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return formatDate(now);
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDays(date: string, days: number): string {
  const value = parseDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return formatDate(value);
}

/** The Sunday on or before the given date. */
export function weekStartOf(date: string): string {
  return addDays(date, -dayOfWeek(date));
}

export function phaseOf(date: string): Phase {
  const day = dayOfWeek(date);
  if (day === 0) return "pick";
  if (day < FRIDAY) return "learn";
  if (day === FRIDAY) return "interview";
  return "wrap";
}

/** Days from `date` until that week's Friday. 0 on Friday and Saturday. */
export function daysUntilInterview(date: string): number {
  return Math.max(0, FRIDAY - dayOfWeek(date));
}

/** True from Friday of the given week onward. Mirrors the RLS rule. */
export function questionsRevealed(weekStart: string, today: string): boolean {
  return today >= addDays(weekStart, FRIDAY);
}

/** "Nov 8 – 14" or "Nov 29 – Dec 5". */
export function formatWeekRange(weekStart: string): string {
  const start = parseDate(weekStart);
  const end = parseDate(addDays(weekStart, 6));
  const startMonth = MONTHS[start.getUTCMonth()];
  const endMonth = MONTHS[end.getUTCMonth()];
  const endLabel =
    startMonth === endMonth
      ? `${end.getUTCDate()}`
      : `${endMonth} ${end.getUTCDate()}`;
  return `${startMonth} ${start.getUTCDate()} – ${endLabel}`;
}

/** The Sunday (in `timezone`) of the week containing the given instant. */
export function weekStartAt(instant: string | Date, timezone: string): string {
  return weekStartOf(todayIn(timezone, new Date(instant)));
}
