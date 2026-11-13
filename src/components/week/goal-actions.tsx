"use client";

import { useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { dropGoalAction, finishGoalAction } from "@/app/actions/goals";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Button } from "@/components/ui/button";

type Mode = "closed" | "menu" | "confirm-drop";

/** Goal title with a small menu for "Mark done" and "Drop" (confirmed). */
export function GoalHeader({
  goalId,
  title,
}: {
  goalId: string;
  title: string;
}) {
  const [mode, setMode] = useState<Mode>("closed");
  const open = mode !== "closed";

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 pt-2.5 font-semibold wrap-anywhere text-ink">
          {title}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2"
          aria-label={open ? "Close options" : `Options for ${title}`}
          aria-expanded={open}
          onClick={() => setMode(open ? "closed" : "menu")}
        >
          {open ? <X aria-hidden /> : <MoreHorizontal aria-hidden />}
        </Button>
      </div>

      {mode === "menu" ? (
        <div className="mt-1 mb-2 flex flex-wrap gap-2">
          <ActionForm action={finishGoalAction}>
            <input type="hidden" name="goalId" value={goalId} />
            <SubmitButton variant="soft" size="sm" pendingLabel="Saving">
              Mark done
            </SubmitButton>
          </ActionForm>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMode("confirm-drop")}
          >
            Drop goal
          </Button>
        </div>
      ) : null}

      {mode === "confirm-drop" ? (
        <ActionForm
          action={dropGoalAction}
          className="mt-1 mb-2 rounded-xl bg-clay/10 p-3"
        >
          <input type="hidden" name="goalId" value={goalId} />
          <p className="text-sm text-ink">
            Drop this goal? Its check-ins go with it.
          </p>
          <div className="mt-2 flex gap-2">
            <SubmitButton variant="danger" size="sm" pendingLabel="Dropping">
              Drop it
            </SubmitButton>
            <Button variant="ghost" size="sm" onClick={() => setMode("closed")}>
              Keep it
            </Button>
          </div>
        </ActionForm>
      ) : null}
    </div>
  );
}
