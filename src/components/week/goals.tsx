import { CircleCheck } from "lucide-react";
import { saveCheckinAction } from "@/app/actions/goals";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { Input } from "@/components/ui/input";
import type { BoardColumn, Goal } from "@/lib/data";
import { AddGoal } from "./add-goal";
import { GoalHeader } from "./goal-actions";

export function GoalsSection({ columns }: { columns: BoardColumn[] }) {
  const [mine, ...others] = columns;
  if (!mine) return null;
  const othersWithGoals = others.filter(
    (column) => column.goals.length > 0 || column.finishedThisWeek.length > 0,
  );

  return (
    <section aria-labelledby="goals-heading" className="mt-12">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="goals-heading"
          className="font-display text-2xl font-semibold tracking-tight text-forest-900"
        >
          Goals
        </h2>
        <p className="text-sm text-muted">Up to two at a time</p>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-8 [&>*]:min-w-0">
        <div className="space-y-3">
          {mine.goals.map((goal) => (
            <MyGoal key={goal.id} goal={goal} />
          ))}
          <Finished titles={mine.finishedThisWeek} />
          {mine.goals.length < 2 ? <AddGoal /> : null}
        </div>

        {othersWithGoals.map((column) => (
          <div key={column.member.id} className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Avatar
                name={column.member.displayName}
                className="size-7 text-[11px]"
              />
              <span className="min-w-0 wrap-anywhere">{`${column.member.displayName}'s goals`}</span>
            </p>
            {column.goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-2xl border border-line bg-card/70 px-4 py-3.5"
              >
                <p className="font-semibold wrap-anywhere text-ink">
                  {goal.title}
                </p>
                <p
                  className={
                    goal.checkin
                      ? "mt-1 text-[15px] wrap-anywhere text-forest-700"
                      : "mt-1 text-[15px] text-muted"
                  }
                >
                  {goal.checkin ?? "No check-in yet this week."}
                </p>
              </div>
            ))}
            <Finished titles={column.finishedThisWeek} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Finished({ titles }: { titles: string[] }) {
  if (titles.length === 0) return null;
  return (
    <ul className="space-y-2">
      {titles.map((title, index) => (
        <li
          key={`${title}-${index}`}
          className="flex items-start gap-2.5 rounded-2xl bg-moss-100/50 px-4 py-3 text-[15px] text-forest-900"
        >
          <CircleCheck
            aria-hidden
            className="mt-0.5 size-[18px] shrink-0 text-forest-500"
          />
          <span className="min-w-0 wrap-anywhere">
            <span className="font-semibold">Finished this week:</span> {title}
          </span>
        </li>
      ))}
    </ul>
  );
}

function MyGoal({ goal }: { goal: Goal }) {
  const inputId = `checkin-${goal.id}`;
  return (
    <div className="rounded-2xl border border-line bg-card/70 px-4 pt-1.5 pb-4">
      <GoalHeader goalId={goal.id} title={goal.title} />
      <ActionForm action={saveCheckinAction} className="mt-1">
        <input type="hidden" name="goalId" value={goal.id} />
        <label htmlFor={inputId} className="mb-1.5 block text-sm text-muted">
          One line: how did it go this week?
        </label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            name="body"
            defaultValue={goal.checkin ?? ""}
            maxLength={280}
            autoComplete="off"
          />
          <SubmitButton variant="secondary" size="lg" savedLabel="Saved">
            Save
          </SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
