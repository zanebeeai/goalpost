"use client";

import { useActionState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { addGoalUpdateAction, createGoalAction } from "@/app/actions/goals";
import { ActionMessage } from "@/components/action-message";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewGoalForm({
  parents = [],
}: {
  parents?: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(createGoalAction, {});
  return (
    <form action={action} className="space-y-4">
      <div className="flex gap-2 rounded-xl border border-[var(--clay-200)] bg-orange-50 p-3 text-xs leading-5 text-[var(--clay-600)]">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        Everything in this goal—including tasks, events, files, and collaborator
        names—will be public.
      </div>
      <label className="block text-sm font-semibold">
        Goal title
        <Input name="title" className="mt-1.5" maxLength={180} required />
      </label>
      <label className="block text-sm font-semibold">
        Started on
        <Input
          name="startedOn"
          type="date"
          className="mt-1.5"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </label>
      {parents.length ? (
        <label className="block text-sm font-semibold">
          Parent goal{" "}
          <span className="font-normal text-[var(--muted)]">optional</span>
          <select
            name="parentGoalpostId"
            className="focus-ring mt-1.5 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"
          >
            <option value="">No parent</option>
            {parents.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-sm font-semibold">
        Tags{" "}
        <span className="font-normal text-[var(--muted)]">comma-separated</span>
        <Input name="tags" className="mt-1.5" placeholder="hardware, home" />
      </label>
      <div>
        <span className="mb-1.5 block text-sm font-semibold">
          What are you setting out to do?
        </span>
        <RichTextEditor />
      </div>
      <ActionMessage state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Publish goalpost
      </Button>
    </form>
  );
}

export function GoalUpdateForm({
  goalpostId,
  publicId,
}: {
  goalpostId: string;
  publicId: string;
}) {
  const [state, action, pending] = useActionState(addGoalUpdateAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="goalpostId" value={goalpostId} />
      <input type="hidden" name="publicId" value={publicId} />
      <RichTextEditor compact placeholder="What changed? What did you learn?" />
      <ActionMessage state={state} success="Update published" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Publish update
      </Button>
    </form>
  );
}
