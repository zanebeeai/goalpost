import type { Metadata } from "next";
import { X } from "lucide-react";
import { addTopicAction, removeTopicAction } from "@/app/actions/topics";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PickForWeek } from "@/components/pick-for-week";
import { Input } from "@/components/ui/input";
import { requireMember } from "@/lib/auth";
import { getBoard, getUpNext } from "@/lib/data";
import { todayIn, weekStartOf } from "@/lib/week";

export const metadata: Metadata = { title: "Up next" };

export default async function UpNextPage() {
  const member = await requireMember();
  const weekStart = weekStartOf(todayIn(member.space.timezone));
  const [topics, board] = await Promise.all([getUpNext(), getBoard(weekStart)]);
  const canPick = !board[0]?.week;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="font-display text-[1.75rem] leading-tight font-semibold tracking-tight text-forest-900 sm:text-4xl">
          Up next
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Things you want to learn someday. Shared with your space.
        </p>
      </header>

      <ActionForm action={addTopicAction} resetOnSuccess>
        <label htmlFor="new-topic" className="sr-only">
          Add a topic
        </label>
        <div className="flex gap-2">
          <Input
            id="new-topic"
            name="title"
            required
            maxLength={120}
            autoComplete="off"
            placeholder="Add a topic"
          />
          <SubmitButton size="lg">Add</SubmitButton>
        </div>
      </ActionForm>

      {topics.length === 0 ? (
        <p className="mt-10 text-center text-[15px] text-muted">
          Nothing here yet. Add the next thing you&apos;re curious about.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
          {topics.map((topic) => (
            <li
              key={topic.id}
              className="flex items-start gap-2 py-3 pr-2 pl-5"
            >
              <div className="min-w-0 flex-1 pt-2">
                <p className="text-[16px] leading-snug font-semibold wrap-anywhere text-ink">
                  {topic.title}
                </p>
                {topic.addedByName ? (
                  <p className="mt-0.5 text-sm wrap-anywhere text-muted">
                    Added by {topic.addedByName}
                  </p>
                ) : null}
                {canPick ? (
                  <div className="mt-3 mb-1">
                    <PickForWeek topicId={topic.id} />
                  </div>
                ) : null}
              </div>
              <ActionForm action={removeTopicAction}>
                <input type="hidden" name="topicId" value={topic.id} />
                <SubmitButton
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${topic.title}`}
                >
                  <X aria-hidden />
                </SubmitButton>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
