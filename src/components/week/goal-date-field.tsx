"use client";

import { useState } from "react";
import { useActionForm } from "@/components/action-form";
import { Input } from "@/components/ui/input";
import { goalDue, maxTargetDate, targetDateError } from "@/lib/goals";
import { addDays } from "@/lib/week";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "2 weeks", days: 14 },
  { label: "4 weeks", days: 28 },
  { label: "3 months", days: 91 },
] as const;

/** Marks only the field an error is about; the cap message marks neither. */
export function goalErrorField(error: string): string | null {
  if (error.startsWith("Pick ")) return "targetDate";
  if (error.includes("goal first") || error.includes("under 120")) {
    return "title";
  }
  return null;
}

/**
 * "By when?": a native date input (the phone's own picker) with one-tap
 * presets and a live "Dec 11 · 4 weeks left" line. Submits as `targetDate`.
 */
export function GoalDateField({
  id,
  today,
  defaultValue,
  label = "By when?",
  autoFocus = false,
}: {
  id: string;
  today: string;
  defaultValue: string;
  label?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const valid = !targetDateError(value, today);
  const due = valid ? goalDue(value, today) : null;
  const hintId = `${id}-hint`;
  const { error, errorId, errorField } = useActionForm();
  const aboutThis =
    Boolean(error) && (errorField === "all" || errorField === "targetDate");
  const describedBy =
    [aboutThis ? errorId : null, due ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="group"
        aria-label="Quick picks"
      >
        {PRESETS.map((preset) => {
          const date = addDays(today, preset.days);
          const selected = value === date;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={selected}
              onClick={() => setValue(date)}
              className={cn(
                "inline-flex h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                selected
                  ? "border-forest-700 bg-forest-700 text-cream"
                  : "border-line bg-white/70 text-forest-700 hover:border-moss-400",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <Input
        id={id}
        name="targetDate"
        type="date"
        required
        min={today}
        max={maxTargetDate(today)}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        // iOS centers the value and sizes the control by its content.
        className="mt-2 block appearance-none text-left [&::-webkit-date-and-time-value]:text-left"
      />
      {due ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {`${due.dateLabel} · ${due.label}`}
        </p>
      ) : null}
    </div>
  );
}
