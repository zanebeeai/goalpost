import { CircleCheck } from "lucide-react";
import { saveCheckinAction } from "@/app/actions/goals";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { Input } from "@/components/ui/input";
import type { BoardColumn, Goal } from "@/lib/data";
import { goalDue, MAX_ACTIVE_GOALS } from "@/lib/goals";
import { cn } from "@/lib/utils";
import { phaseOf } from "@/lib/week";
import { AddGoal } from "./add-goal";
import { GoalHeader } from "./goal-actions";
import { goalTitleId } from "./goal-ids";
import { GoalDue } from "./goal-due";
import { GOALS_SECTION_ID } from "./tonight";

export function GoalsSection({
  columns,
  today,
}: {
  columns: BoardColumn[];
  today: string;
}) {
  const [mine, ...others] = columns;
  if (!mine) return null;
  const phase = phaseOf(today);
  // Friday and Saturday fold my goals into the interview ritual.
  const checkinTime =
    (phase === "interview" || phase === "wrap") && mine.goals.length > 0;
  // Overdue cards show no check-in box, so there is no line to add yet.
  const allOverdue =
    mine.goals.length > 0 &&
    mine.goals.every((goal) => goalDue(goal.targetDate, today).overdue);
  const othersWithGoals = others.filter(
    (column) => column.goals.length > 0 || column.finishedThisWeek.length > 0,
  );

  return (
    <section
      id={GOALS_SECTION_ID}
      aria-labelledby="goals-heading"
      className="mt-12 scroll-mt-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2
          id="goals-heading"
          tabIndex={-1}
          className="font-display text-2xl font-semibold tracking-tight text-forest-900"
        >
          {checkinTime ? "Goal check-in" : "Goals"}
        </h2>
        <p className="text-sm text-muted">Up to three at a time</p>
      </div>
      {checkinTime ? (
        <p className="mt-1.5 text-[15px] text-muted">
          {allOverdue
            ? "Decide on your overdue goals first."
            : phase === "interview"
              ? "Add a line on each goal before you talk tonight."
              : "Add a line on each goal before the week ends."}
        </p>
      ) : null}

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-8 [&>*]:min-w-0">
        <div className="space-y-3">
          {mine.goals.map((goal) => (
            <MyGoal
              key={goal.id}
              goal={goal}
              today={today}
              waiting={checkinTime && !goal.checkin?.trim()}
            />
          ))}
          <Finished titles={mine.finishedThisWeek} />
          <AddGoal
            today={today}
            goalIds={mine.goals.map((goal) => goal.id)}
            atCap={mine.goals.length >= MAX_ACTIVE_GOALS}
          />
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
            {column.goals.map((goal) => {
              const due = goalDue(goal.targetDate, today);
              return (
                <div
                  key={goal.id}
                  className={cn(
                    "rounded-2xl border bg-card/70 px-4 py-3.5",
                    due.overdue ? "border-clay/50" : "border-line",
                  )}
                >
                  <p className="font-semibold wrap-anywhere text-ink">
                    {goal.title}
                  </p>
                  <GoalDue due={due} className="mt-0.5" />
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
              );
            })}
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

function MyGoal({
  goal,
  today,
  waiting,
}: {
  goal: Goal;
  today: string;
  /** Friday or Saturday and no check-in yet this week. */
  waiting: boolean;
}) {
  const inputId = `checkin-${goal.id}`;
  // An overdue goal only asks for the decision; the check-in comes back
  // once it is extended.
  const overdue = goalDue(goal.targetDate, today).overdue;
  return (
    <div
      role="group"
      aria-labelledby={goalTitleId(goal.id)}
      className={cn(
        "rounded-2xl border bg-card/70 px-4 pt-1.5 pb-4",
        overdue
          ? "border-clay/50 pb-3"
          : waiting
            ? "border-moss-400"
            : "border-line",
      )}
    >
      <GoalHeader
        goalId={goal.id}
        title={goal.title}
        targetDate={goal.targetDate}
        today={today}
      />
      {overdue ? null : (
        <ActionForm action={saveCheckinAction} className="mt-2">
          <input type="hidden" name="goalId" value={goal.id} />
          <div className="mb-1.5 flex items-center gap-2">
            {waiting ? (
              <span className="shrink-0 rounded-full bg-moss-100 px-2 py-0.5 text-xs font-bold text-forest-700">
                To do
                <span className="sr-only">: no check-in yet this week.</span>
              </span>
            ) : null}
            <label htmlFor={inputId} className="min-w-0 text-sm text-muted">
              One line: how did it go this week?
            </label>
          </div>
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
      )}
    </div>
  );
}
