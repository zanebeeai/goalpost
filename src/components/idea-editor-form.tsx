"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { updateIdeaAction } from "@/app/actions/ideas";
import { ActionMessage } from "@/components/action-message";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Json } from "@/types/domain";

type Row = Record<string, unknown>;

export function IdeaEditorForm({
  idea,
  listId,
  canEdit,
}: {
  idea: Row;
  listId: string;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(updateIdeaAction, {});
  if (!canEdit)
    return (
      <div>
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(idea.tags) ? idea.tags : []).map((tag) => (
            <span
              key={String(tag)}
              className="rounded-full bg-[var(--cream-100)] px-2.5 py-1 text-xs font-bold"
            >
              {String(tag)}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">
          This card is shared with you as view-only.
        </p>
      </div>
    );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={String(idea.id)} />
      <input type="hidden" name="listId" value={listId} />
      <label className="block text-sm font-semibold">
        Title
        <Input
          name="title"
          className="mt-1.5"
          defaultValue={String(idea.title)}
          required
          maxLength={180}
        />
      </label>
      <label className="block text-sm font-semibold">
        Tags
        <Input
          name="tags"
          className="mt-1.5"
          defaultValue={(Array.isArray(idea.tags) ? idea.tags : []).join(", ")}
          placeholder="design, someday"
        />
      </label>
      <div>
        <span className="mb-1.5 block text-sm font-semibold">Description</span>
        <RichTextEditor initialContent={idea.content as Json} />
      </div>
      <ActionMessage state={state} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Save
        card
      </Button>
    </form>
  );
}
