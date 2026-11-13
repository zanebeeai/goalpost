"use client";

import { useRef, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import {
  dropGoalAction,
  finishGoalAction,
  setGoalDateAction,
} from "@/app/actions/goals";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { defaultTargetDate, goalDue, targetDateError } from "@/lib/goals";
import { GoalDue } from "./goal-due";
import { goalTitleId } from "./goal-ids";
import { goalErrorField, GoalDateField } from "./goal-date-field";

type Mode = "closed" | "menu" | "date" | "confirm-drop";

/** Where focus goes once a goal leaves the page (done or dropped). */
function focusGoalsHeading() {
  document.getElementById("goals-heading")?.focus();
}

/**
 * Goal title, its date, and what can be done with it. Active goals keep
 * "Mark done", "Change date" and "Drop" in a small menu. An overdue goal
 * puts its three choices on the card: Mark done, Extend, Drop.
 */
export function GoalHeader({
  goalId,
  title,
  targetDate,
  today,
}: {
  goalId: string;
  title: string;
  targetDate: string;
  today: string;
}) {
  const [mode, setMode] = useState<Mode>("closed");
  const menuButton = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const due = goalDue(targetDate, today);
  const menuOpen = mode !== "closed";

  /**
   * Back to the plain card. Focus moves first, to the "…" button or (on an
   * overdue card, which has none) the title, so it never falls to <body>
   * when the form or button that held it unmounts.
   */
  function close() {
    (menuButton.current ?? titleRef.current)?.focus();
    setMode("closed");
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 pt-2.5">
          <p
            ref={titleRef}
            id={goalTitleId(goalId)}
            tabIndex={-1}
            className="font-semibold wrap-anywhere text-ink"
          >
            {title}
          </p>
          <GoalDue due={due} className="mt-0.5" />
        </div>
        {due.overdue ? null : (
          <Button
            ref={menuButton}
            variant="ghost"
            size="icon"
            className="-mr-2"
            aria-label={menuOpen ? "Close options" : `Options for ${title}`}
            aria-expanded={menuOpen}
            onClick={() => (menuOpen ? close() : setMode("menu"))}
          >
            {menuOpen ? <X aria-hidden /> : <MoreHorizontal aria-hidden />}
          </Button>
        )}
      </div>

      {due.overdue && mode === "closed" ? (
        <div className="mt-3 mb-1 rounded-xl bg-clay/10 p-3">
          <p className="text-sm text-ink">
            {`This was due ${due.dateLabel}. Done, more time, or let it go?`}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <FinishButton goalId={goalId} />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMode("date")}
            >
              Extend
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode("confirm-drop")}
            >
              Drop
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "menu" ? (
        <div className="mt-2 mb-2 flex flex-wrap gap-2">
          <FinishButton goalId={goalId} />
          <Button variant="secondary" size="sm" onClick={() => setMode("date")}>
            Change date
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMode("confirm-drop")}
          >
            Drop goal
          </Button>
        </div>
      ) : null}

      {mode === "date" ? (
        <ActionForm
          action={setGoalDateAction}
          onSuccess={close}
          noValidate
          validate={(formData) =>
            targetDateError(String(formData.get("targetDate") ?? ""), today)
          }
          errorFieldFor={goalErrorField}
          aria-label={`New date for ${title}`}
          className="mt-2 mb-2 space-y-3 rounded-xl border border-line bg-white/50 p-3"
        >
          <input type="hidden" name="goalId" value={goalId} />
          <GoalDateField
            id={`date-${goalId}`}
            today={today}
            label={due.overdue ? "New date" : "Change the date"}
            defaultValue={due.overdue ? defaultTargetDate(today) : targetDate}
            autoFocus
          />
          <div className="flex gap-2">
            <SubmitButton size="sm" pendingLabel="Saving">
              Save date
            </SubmitButton>
            <Button variant="ghost" size="sm" onClick={close}>
              Cancel
            </Button>
          </div>
        </ActionForm>
      ) : null}

      {mode === "confirm-drop" ? (
        <ActionForm
          action={dropGoalAction}
          onSuccess={focusGoalsHeading}
          className="mt-2 mb-2 rounded-xl bg-clay/10 p-3"
        >
          <input type="hidden" name="goalId" value={goalId} />
          <p className="text-sm text-ink">
            Drop this goal? Its check-ins go with it.
          </p>
          <div className="mt-2 flex gap-2">
            <SubmitButton variant="danger" size="sm" pendingLabel="Dropping">
              Drop it
            </SubmitButton>
            <Button variant="ghost" size="sm" onClick={close} autoFocus>
              Keep it
            </Button>
          </div>
        </ActionForm>
      ) : null}
    </div>
  );
}

function FinishButton({ goalId }: { goalId: string }) {
  return (
    <ActionForm action={finishGoalAction} onSuccess={focusGoalsHeading}>
      <input type="hidden" name="goalId" value={goalId} />
      <SubmitButton variant="soft" size="sm" pendingLabel="Saving">
        Mark done
      </SubmitButton>
    </ActionForm>
  );
}
