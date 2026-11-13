import { X } from "lucide-react";
import {
  addQuestionAction,
  deleteQuestionAction,
} from "@/app/actions/questions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { formatReveal } from "@/components/reveal";
import { Input } from "@/components/ui/input";
import type { WeekEntry } from "@/lib/data";

export function QuestionsFor({
  week,
  name,
  timezone,
}: {
  week: WeekEntry;
  name: string;
  timezone: string;
}) {
  const inputId = `question-${week.id}`;
  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="mt-6 border-t border-line pt-5"
    >
      <h3
        id={`${inputId}-heading`}
        className="font-display text-lg font-semibold wrap-anywhere text-forest-900"
      >
        {week.revealed ? `Questions for ${name}` : "Your questions for Friday"}
      </h3>

      {week.questions.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {week.questions.map((question) => (
            <li
              key={question.id}
              className="flex items-start gap-1 rounded-2xl bg-moss-100/45 py-1 pr-1 pl-4"
            >
              <div className="min-w-0 flex-1 py-2">
                <p className="text-[16px] leading-6 wrap-anywhere text-ink">
                  {question.body}
                </p>
                {question.mine ? null : (
                  <p className="mt-0.5 text-sm wrap-anywhere text-muted">
                    {question.authorName}
                  </p>
                )}
              </div>
              {/* Once the interview has started, questions stay put. */}
              {question.mine && !week.revealed ? (
                <ActionForm action={deleteQuestionAction}>
                  <input type="hidden" name="questionId" value={question.id} />
                  <SubmitButton
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete question: ${question.body}`}
                  >
                    <X aria-hidden />
                  </SubmitButton>
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ActionForm action={addQuestionAction} resetOnSuccess className="mt-3">
        <input type="hidden" name="weekId" value={week.id} />
        <label htmlFor={inputId} className="sr-only">
          {`Ask ${name} a question`}
        </label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            name="body"
            required
            maxLength={500}
            autoComplete="off"
            placeholder={`Ask ${name} something`}
          />
          <SubmitButton variant="secondary" size="lg">
            Add
          </SubmitButton>
        </div>
      </ActionForm>
      <p className="mt-2 text-sm wrap-anywhere text-muted">
        {week.revealed
          ? `${name} can see these now.`
          : `${name} can't see these until ${formatReveal(week.revealsAt, timezone)}.`}
      </p>
    </section>
  );
}
