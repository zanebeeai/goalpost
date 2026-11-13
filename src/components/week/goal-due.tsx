import { CalendarDays } from "lucide-react";
import type { GoalDue as Due } from "@/lib/goals";
import { cn } from "@/lib/utils";

/** "Dec 11 · 3 weeks left", in clay when the date has passed. */
export function GoalDue({ due, className }: { due: Due; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm",
        due.overdue ? "font-semibold text-clay-ink" : "text-muted",
        className,
      )}
    >
      <CalendarDays aria-hidden className="size-3.5 shrink-0" />
      <span className="min-w-0 wrap-anywhere">
        {due.dateLabel}
        {due.label ? (
          <>
            <span aria-hidden> · </span>
            <span className="sr-only">, </span>
            {due.label}
          </>
        ) : null}
      </span>
    </p>
  );
}
