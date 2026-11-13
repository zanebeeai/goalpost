import type { Metadata } from "next";
import { ChevronDown, CircleCheck } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { LinkifiedText } from "@/components/linkified-text";
import { TakeawayForm } from "@/components/takeaway-form";
import { requireMember } from "@/lib/auth";
import { getHistory, type HistoryWeek } from "@/lib/data";
import { formatWeekRange, todayIn, weekStartOf } from "@/lib/week";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "History" };

type Column = HistoryWeek["columns"][number];

export default async function HistoryPage() {
  const member = await requireMember();
  const weekStart = weekStartOf(todayIn(member.space.timezone));
  const weeks = await getHistory(weekStart);

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-[1.75rem] leading-tight font-semibold tracking-tight text-forest-900 sm:text-4xl">
          History
        </h1>
      </header>

      {weeks.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-muted">
          Your past weeks will collect here.
        </p>
      ) : (
        <div className="space-y-12">
          {weeks.map((week) => (
            <section
              key={week.weekStart}
              aria-labelledby={`week-${week.weekStart}`}
            >
              <h2
                id={`week-${week.weekStart}`}
                className="flex items-center gap-3 text-sm font-bold tracking-[0.12em] text-forest-500 uppercase"
              >
                {formatWeekRange(week.weekStart)}
                <span aria-hidden className="h-px flex-1 bg-line" />
              </h2>
              <div
                className={cn(
                  "mt-4 grid gap-4 [&>*]:min-w-0",
                  week.columns.length > 1 && "md:grid-cols-2",
                  week.columns.length > 2 && "lg:grid-cols-3",
                )}
              >
                {week.columns.map((column) => (
                  <HistoryColumn key={column.member.id} column={column} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function HistoryColumn({ column }: { column: Column }) {
  const { member, week, checkins, finishedGoals } = column;
  const hasDetails = Boolean(
    week && (week.notes.trim() || week.questions.length),
  );

  return (
    <article className="rounded-3xl border border-line bg-card p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-muted">
        <Avatar
          name={member.displayName}
          me={member.isMe}
          className="size-7 text-[11px]"
        />
        <span className="min-w-0 wrap-anywhere">
          {member.isMe ? "You" : member.displayName}
        </span>
      </p>

      {week ? (
        <h3 className="mt-3 font-display text-xl leading-snug font-semibold wrap-anywhere text-forest-900">
          {week.topic}
        </h3>
      ) : (
        <p className="mt-3 text-[15px] text-muted">No topic this week.</p>
      )}

      {week?.takeaway.trim() ? (
        <div className="mt-3">
          <p className="text-xs font-bold tracking-[0.12em] text-forest-500 uppercase">
            What stuck
          </p>
          <LinkifiedText
            text={week.takeaway}
            className="mt-1 text-[16px] leading-relaxed"
          />
        </div>
      ) : week && member.isMe ? (
        <div className="mt-4">
          <TakeawayForm weekId={week.id} takeaway="" compact />
        </div>
      ) : null}

      {checkins.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-line pt-4">
          {checkins.map((checkin) => (
            <li
              key={checkin.goalTitle}
              className="text-[15px] leading-snug wrap-anywhere"
            >
              <span className="font-semibold text-ink">
                {checkin.goalTitle}
              </span>
              <span className="text-muted"> · </span>
              <span className="text-forest-700">{checkin.body}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {finishedGoals.length > 0 ? (
        <ul
          className={cn(
            "mt-4 space-y-1.5",
            checkins.length === 0 && "border-t border-line pt-4",
          )}
        >
          {finishedGoals.map((title, index) => (
            <li
              key={`${title}-${index}`}
              className="flex items-start gap-2 text-[15px] leading-snug text-forest-900"
            >
              <CircleCheck
                aria-hidden
                className="mt-px size-[18px] shrink-0 text-forest-500"
              />
              <span className="min-w-0 wrap-anywhere">
                <span className="font-semibold">Finished:</span> {title}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {week && hasDetails ? (
        <details className="group mt-4 border-t border-line pt-1">
          <summary className="-mx-2 flex min-h-11 items-center justify-between rounded-lg px-2 text-sm font-semibold text-forest-700 hover:bg-moss-100/40">
            Notes and questions
            <ChevronDown
              aria-hidden
              className="size-4 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="pb-1">
            {week.notes.trim() ? (
              <LinkifiedText
                text={week.notes}
                className="mt-2 text-[15px] leading-relaxed"
              />
            ) : null}
            {week.questions.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {week.questions.map((question) => (
                  <li
                    key={question.id}
                    className="rounded-xl bg-moss-100/45 px-3.5 py-2.5 text-[15px]"
                  >
                    <p className="wrap-anywhere text-ink">{question.body}</p>
                    <p className="mt-0.5 text-sm wrap-anywhere text-muted">
                      {question.authorName}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}
