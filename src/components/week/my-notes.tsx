"use client";

import { useState, type ReactNode } from "react";
import { Check, Pencil } from "lucide-react";
import { saveNotesAction } from "@/app/actions/week";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { CollapsibleText } from "@/components/collapsible-text";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";

/** My notes: read-only with links by default, a textarea only while editing. */
export function MyNotes({
  weekId,
  notes,
  trailing,
}: {
  weekId: string;
  notes: string;
  trailing?: ReactNode;
}) {
  const hasNotes = notes.trim().length > 0;
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  if (editing || !hasNotes) {
    return (
      <ActionForm
        action={saveNotesAction}
        onSuccess={() => {
          setEditing(false);
          setJustSaved(true);
        }}
      >
        <input type="hidden" name="weekId" value={weekId} />
        <Label htmlFor="notes" className="sr-only">
          Notes
        </Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={notes}
          maxLength={20000}
          autoFocus={editing}
          onKeyDown={(event) => {
            if (event.key === "Escape" && hasNotes) setEditing(false);
          }}
          className="max-h-[50dvh] overflow-y-auto"
          placeholder="Notes, links, anything"
        />
        <div className="mt-3 flex items-center gap-2">
          <SubmitButton variant="secondary" pendingLabel="Saving">
            Save notes
          </SubmitButton>
          {hasNotes ? (
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          ) : null}
          {trailing ? <div className="ml-auto">{trailing}</div> : null}
        </div>
      </ActionForm>
    );
  }

  return (
    <div>
      <CollapsibleText text={notes} />
      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(true);
            setJustSaved(false);
          }}
        >
          <Pencil aria-hidden />
          Edit notes
        </Button>
        <span
          role="status"
          className="inline-flex items-center gap-1 text-sm font-medium text-forest-500"
        >
          {justSaved ? (
            <>
              <Check className="size-4" aria-hidden />
              Saved
            </>
          ) : null}
        </span>
        {trailing ? <div className="ml-auto">{trailing}</div> : null}
      </div>
    </div>
  );
}
