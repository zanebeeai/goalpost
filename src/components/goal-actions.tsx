import {
  BellRing,
  CalendarPlus,
  CheckCircle2,
  CircleDotDashed,
  PackageOpen,
  Plus,
  UserPlus,
} from "lucide-react";
import {
  addGoalEventAction,
  addGoalTaskAction,
  addReminderAction,
  transitionGoalAction,
} from "@/app/actions/goals";
import { inviteToGoalAction } from "@/app/actions/social";
import { AddUpdateButton } from "@/components/create-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { Goalpost } from "@/types/domain";

function ActionPanel({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Plus;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className="list-none">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="w-full justify-start"
        >
          <span>
            <Icon className="size-4" />
            {label}
          </span>
        </Button>
      </summary>
      <Card className="mt-2 p-4">{children}</Card>
    </details>
  );
}

export function GoalActions({
  goal,
  isAdmin,
}: {
  goal: Goalpost;
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-2">
      <AddUpdateButton goalpostId={goal.id} publicId={goal.publicId} />
      <ActionPanel label="Add task" icon={CheckCircle2}>
        <form action={addGoalTaskAction} className="space-y-3">
          <input type="hidden" name="goalpostId" value={goal.id} />
          <input type="hidden" name="publicId" value={goal.publicId} />
          <Input
            name="title"
            placeholder="What needs doing?"
            required
            maxLength={240}
          />
          <select
            name="assignee"
            className="focus-ring min-h-10 w-full rounded-xl border bg-white px-3 text-sm"
          >
            <option value="">Unassigned</option>
            {goal.collaborators.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.displayName}
              </option>
            ))}
          </select>
          <Input name="dueAt" type="datetime-local" />
          <Button type="submit" size="sm">
            Add task
          </Button>
        </form>
      </ActionPanel>
      <ActionPanel label="Add timeline event" icon={CalendarPlus}>
        <form action={addGoalEventAction} className="space-y-3">
          <input type="hidden" name="goalpostId" value={goal.id} />
          <input type="hidden" name="publicId" value={goal.publicId} />
          <Input
            name="title"
            placeholder="Parts arrive"
            required
            maxLength={180}
          />
          <select
            name="eventType"
            className="focus-ring min-h-10 w-full rounded-xl border bg-white px-3 text-sm"
          >
            <option value="delivery">Delivery</option>
            <option value="deadline">Deadline</option>
            <option value="milestone">Milestone</option>
            <option value="resume">Resume work</option>
            <option value="custom">Custom</option>
          </select>
          <Input name="startsAt" type="datetime-local" required />
          <Textarea
            name="description"
            placeholder="Optional public note"
            maxLength={2000}
          />
          <Button type="submit" size="sm">
            Add event
          </Button>
        </form>
      </ActionPanel>
      <ActionPanel label="Set private reminder" icon={BellRing}>
        <form action={addReminderAction} className="space-y-3">
          <input type="hidden" name="goalpostId" value={goal.id} />
          <input type="hidden" name="publicId" value={goal.publicId} />
          <Input name="remindAt" type="datetime-local" required />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              name="sendEmail"
              defaultChecked
              className="accent-[var(--forest-800)]"
            />
            Also send email
          </label>
          <p className="text-xs leading-5 text-[var(--muted)]">
            Only you can see this reminder. It will not change the goal’s
            status.
          </p>
          <Button type="submit" size="sm">
            Schedule
          </Button>
        </form>
      </ActionPanel>
      {isAdmin ? (
        <ActionPanel label="Invite collaborator" icon={UserPlus}>
          <form action={inviteToGoalAction} className="space-y-3">
            <input type="hidden" name="goalpostId" value={goal.id} />
            <input type="hidden" name="publicId" value={goal.publicId} />
            <Input name="username" placeholder="Username" required />
            <p className="text-xs leading-5 text-[var(--muted)]">
              After accepting, the same goal will appear on their public tree
              and they can edit it.
            </p>
            <Button type="submit" size="sm">
              Send invitation
            </Button>
          </form>
        </ActionPanel>
      ) : null}
      <div className="pt-2">
        <p className="mb-2 text-xs font-bold tracking-wider text-[var(--muted)] uppercase">
          Status
        </p>
        <div className="grid grid-cols-3 gap-1">
          {(["active", "waiting", "done"] as const).map((status) => {
            const Icon =
              status === "active"
                ? CircleDotDashed
                : status === "waiting"
                  ? PackageOpen
                  : CheckCircle2;
            return (
              <form action={transitionGoalAction} key={status}>
                <input type="hidden" name="goalpostId" value={goal.id} />
                <input type="hidden" name="publicId" value={goal.publicId} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  disabled={goal.status === status}
                  className="focus-ring flex w-full flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-bold capitalize hover:bg-[var(--cream-100)] disabled:border-[var(--moss-400)] disabled:bg-[var(--moss-200)]"
                >
                  <Icon className="size-4" />
                  {status}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
