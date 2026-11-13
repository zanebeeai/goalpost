"use client";

import { saveTakeawayAction } from "@/app/actions/week";
import {
  ActionForm,
  FieldError,
  SavedHint,
  SubmitButton,
} from "@/components/action-form";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** "What stuck?" for one of my weeks, this week or a past one. */
export function TakeawayForm({
  weekId,
  takeaway,
  compact = false,
}: {
  weekId: string;
  takeaway: string;
  compact?: boolean;
}) {
  const inputId = `takeaway-${weekId}`;
  const hadTakeaway = takeaway.trim().length > 0;
  return (
    <ActionForm
      action={saveTakeawayAction}
      errorInline
      validate={(formData) =>
        !hadTakeaway && !String(formData.get("takeaway") ?? "").trim()
          ? "Write a line or two first."
          : null
      }
    >
      <input type="hidden" name="weekId" value={weekId} />
      <label
        htmlFor={inputId}
        className={cn(
          "block text-forest-900",
          compact
            ? "text-sm font-semibold text-ink"
            : "font-display text-xl font-semibold",
        )}
      >
        What stuck?
      </label>
      <Textarea
        id={inputId}
        name="takeaway"
        defaultValue={takeaway}
        maxLength={2000}
        className={cn(compact ? "mt-2 min-h-20" : "mt-3 min-h-24")}
        placeholder={
          compact ? undefined : "The one or two things you'll remember"
        }
      />
      <FieldError />
      <div className="mt-3 flex items-center gap-3">
        <SubmitButton variant="secondary" pendingLabel="Saving">
          Save
        </SubmitButton>
        <SavedHint />
      </div>
    </ActionForm>
  );
}
