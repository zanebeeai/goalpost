"use client";

import { useActionState, useRef } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { createIdeaAction, createListAction } from "@/app/actions/ideas";
import { ActionMessage } from "@/components/action-message";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function QuickCaptureForm({
  lists,
  defaultListId,
}: {
  lists: { id: string; title: string; role: string }[];
  defaultListId?: string;
}) {
  const [state, action, pending] = useActionState(createIdeaAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (data) => {
        await action(data);
      }}
      className="space-y-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="title"
          placeholder="Capture a loose idea…"
          maxLength={180}
          required
          className="flex-1"
        />
        <select
          name="listId"
          defaultValue={defaultListId ?? lists[0]?.id}
          className="focus-ring min-h-11 rounded-xl border bg-white px-3 text-sm font-semibold"
          required
        >
          {lists
            .filter((list) => list.role !== "viewer")
            .map((list) => (
              <option key={list.id} value={list.id}>
                {list.title}
              </option>
            ))}
        </select>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Capture
        </Button>
      </div>
      <ActionMessage state={state} success="Idea captured" />
    </form>
  );
}

export function NewListForm() {
  const [state, action, pending] = useActionState(createListAction, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-semibold">
        Name
        <Input
          name="title"
          className="mt-1.5"
          placeholder="Weekend projects"
          maxLength={120}
          required
        />
      </label>
      <label className="block text-sm font-semibold">
        Description{" "}
        <span className="font-normal text-[var(--muted)]">optional</span>
        <Textarea
          name="description"
          className="mt-1.5"
          placeholder="What belongs in this list?"
          maxLength={1000}
        />
      </label>
      <ActionMessage state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Create private list
      </Button>
    </form>
  );
}
