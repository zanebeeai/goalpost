"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addGoalAction } from "@/app/actions/goals";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** A one-line "Add a goal" link that opens into the input. */
export function AddGoal() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        variant="ghost"
        className="-ml-3 text-forest-700"
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden />
        Add a goal
      </Button>
    );
  }

  return (
    <ActionForm
      action={addGoalAction}
      onSuccess={() => setOpen(false)}
      className="rounded-2xl border border-dashed border-moss-400/80 px-4 py-3.5"
    >
      <label
        htmlFor="new-goal"
        className="block text-sm font-semibold text-ink"
      >
        Something longer-running?
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id="new-goal"
          name="title"
          required
          maxLength={120}
          autoComplete="off"
          autoFocus
          placeholder="Run a half marathon"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        />
        <SubmitButton variant="secondary" size="lg">
          Add
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
