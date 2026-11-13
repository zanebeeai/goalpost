"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { addGoalAction } from "@/app/actions/goals";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultTargetDate, targetDateError } from "@/lib/goals";
import { goalErrorField, GoalDateField } from "./goal-date-field";
import { goalTitleId } from "./goal-ids";

/**
 * A one-line "Add a goal" link that opens into the goal and its date. Stays
 * mounted at the cap (showing nothing) so it can move focus to the new goal.
 */
export function AddGoal({
  today,
  goalIds,
  atCap,
}: {
  today: string;
  /** My active goals, to find the one just added. */
  goalIds: string[];
  atCap: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Set after a successful add, until the new goal shows up on the page.
  const [added, setAdded] = useState(false);
  const idsWhenOpened = useRef<string[]>([]);
  const focusAfterClose = useRef<"button" | string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function openForm() {
    idsWhenOpened.current = goalIds;
    setOpen(true);
  }

  function close() {
    focusAfterClose.current = "button";
    setOpen(false);
  }

  // Close only once the new goal is rendered, so focus has somewhere to go:
  // the "Add a goal" button, or the new goal when the cap hides the button.
  useEffect(() => {
    if (!added) return;
    const newId = goalIds.find((id) => !idsWhenOpened.current.includes(id));
    if (!newId) return;
    focusAfterClose.current = atCap ? goalTitleId(newId) : "button";
    setAdded(false);
    setOpen(false);
  }, [added, goalIds, atCap]);

  useEffect(() => {
    if (open || !focusAfterClose.current) return;
    const target = focusAfterClose.current;
    focusAfterClose.current = null;
    if (target === "button") buttonRef.current?.focus();
    else document.getElementById(target)?.focus();
  }, [open]);

  if (!open) {
    if (atCap) return null;
    return (
      <Button
        ref={buttonRef}
        variant="ghost"
        className="-ml-3 text-forest-700"
        onClick={openForm}
      >
        <Plus aria-hidden />
        Add a goal
      </Button>
    );
  }

  return (
    <ActionForm
      action={addGoalAction}
      onSuccess={() => setAdded(true)}
      noValidate
      validate={(formData) =>
        !String(formData.get("title") ?? "").trim()
          ? "Write the goal first."
          : targetDateError(String(formData.get("targetDate") ?? ""), today)
      }
      errorFieldFor={goalErrorField}
      aria-label="New goal"
      className="space-y-4 rounded-2xl border border-dashed border-moss-400/80 px-4 py-4"
    >
      <div>
        <label
          htmlFor="new-goal"
          className="block text-sm font-semibold text-ink"
        >
          What do you want to get done?
        </label>
        <Input
          id="new-goal"
          name="title"
          required
          maxLength={120}
          autoComplete="off"
          autoFocus
          placeholder="Run 5k without stopping"
          className="mt-2"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        />
      </div>
      <GoalDateField
        id="new-goal-date"
        today={today}
        defaultValue={defaultTargetDate(today)}
      />
      <div className="flex gap-2">
        <SubmitButton pendingLabel="Adding">Add goal</SubmitButton>
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
      </div>
    </ActionForm>
  );
}
