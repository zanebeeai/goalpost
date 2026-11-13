"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { renameTopicAction } from "@/app/actions/week";
import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopicTitle({
  weekId,
  topic,
}: {
  weekId: string;
  topic: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-2">
        <h2 className="min-w-0 flex-1 pt-1 font-display text-[1.75rem] leading-[1.15] font-semibold tracking-tight wrap-anywhere text-forest-900">
          {topic}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="-mt-1 -mr-2"
          aria-label="Rename topic"
          onClick={() => setEditing(true)}
        >
          <Pencil aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <ActionForm
      action={renameTopicAction}
      onSuccess={() => setEditing(false)}
      errorInline
      className="pt-1"
    >
      <input type="hidden" name="weekId" value={weekId} />
      <label htmlFor="rename-topic" className="sr-only">
        Topic
      </label>
      <Input
        id="rename-topic"
        name="topic"
        defaultValue={topic}
        required
        maxLength={120}
        autoFocus
        autoComplete="off"
        onKeyDown={(event) => {
          if (event.key === "Escape") setEditing(false);
        }}
      />
      <FieldError />
      <div className="mt-2 flex gap-2">
        <SubmitButton size="sm">Save</SubmitButton>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </ActionForm>
  );
}
