import type { ReactNode } from "react";
import {
  addDays,
  daysUntilInterview,
  formatWeekRange,
  phaseOf,
} from "@/lib/week";
import { cn } from "@/lib/utils";

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function phaseLine(today: string): string {
  switch (phaseOf(today)) {
    case "pick":
      return "It's Sunday. Pick what you're learning this week.";
    case "learn": {
      const days = daysUntilInterview(today);
      return `Interview is Friday. ${days} ${days === 1 ? "day" : "days"} to go.`;
    }
    case "interview":
      return "Interview night.";
    case "wrap":
      return "Week's done. Write down what stuck.";
  }
}

export function WeekHeader({
  weekStart,
  today,
  children,
}: {
  weekStart: string;
  today: string;
  /** Shown under the phase line, such as Friday's checklist. */
  children?: ReactNode;
}) {
  const days = LETTERS.map((letter, index) => {
    const date = addDays(weekStart, index);
    return { letter, date, day: Number(date.slice(8)) };
  });

  return (
    <header className="mb-6 sm:mb-8">
      <p className="text-sm font-semibold tracking-wide text-muted">
        {formatWeekRange(weekStart)}
      </p>
      <h1 className="mt-1 font-display text-[1.75rem] leading-tight font-semibold tracking-tight text-balance text-forest-900 sm:text-4xl">
        {phaseLine(today)}
      </h1>
      {children}
      <ol aria-hidden className="mt-5 grid max-w-sm grid-cols-7 gap-1">
        {days.map(({ letter, date, day }, index) => {
          const isToday = date === today;
          const isPast = date < today;
          const isFriday = index === 5;
          return (
            <li key={date} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "text-[11px] font-bold tracking-wider",
                  isFriday ? "text-clay-ink" : "text-muted",
                )}
              >
                {letter}
              </span>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                  isToday
                    ? "bg-forest-900 text-cream"
                    : isFriday
                      ? "border border-clay/50 text-clay-ink"
                      : isPast
                        ? "text-muted"
                        : "text-ink",
                )}
              >
                {day}
              </span>
            </li>
          );
        })}
      </ol>
    </header>
  );
}
