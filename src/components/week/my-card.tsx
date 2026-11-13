import { ChevronDown, Lock } from "lucide-react";
import { formatReveal } from "@/components/reveal";
import { ShareButton } from "@/components/share-button";
import { TakeawayForm } from "@/components/takeaway-form";
import { Card, Eyebrow } from "@/components/ui/card";
import type { WeekEntry } from "@/lib/data";
import { MyNotes } from "./my-notes";
import { TopicTitle } from "./topic-title";

export function MyCard({
  week,
  hasPartners,
  siteUrl,
  timezone,
}: {
  week: WeekEntry;
  hasPartners: boolean;
  siteUrl: string;
  timezone: string;
}) {
  const share = (
    <ShareButton
      variant="ghost"
      label="Text it"
      text={`This week I'm learning: ${week.topic}`}
      url={`${siteUrl}/app`}
    />
  );
  const notes = (
    <MyNotes weekId={week.id} notes={week.notes} trailing={share} />
  );

  return (
    <Card className="border-forest-500/30">
      <Eyebrow>You&apos;re learning</Eyebrow>
      <div className="mt-1">
        <TopicTitle key={week.topic} weekId={week.id} topic={week.topic} />
      </div>

      {week.revealed ? (
        // Interview and wrap days: what you need tonight comes first.
        <>
          {hasPartners ? <QuestionsForMe week={week} /> : null}
          <div className="mt-6">
            <TakeawayForm weekId={week.id} takeaway={week.takeaway} />
          </div>
          <details className="group mt-6 border-t border-line pt-1">
            <summary className="-mx-2 flex min-h-11 items-center justify-between rounded-lg px-2 text-[15px] font-semibold text-forest-700 hover:bg-moss-100/40">
              Your notes
              <ChevronDown
                aria-hidden
                className="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="pt-2 pb-1">{notes}</div>
          </details>
        </>
      ) : (
        <>
          <div className="mt-4">{notes}</div>
          {hasPartners ? (
            <p className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-sm text-muted">
              <Lock className="size-4 shrink-0" aria-hidden />
              {`Questions are hidden until ${formatReveal(week.revealsAt, timezone)}`}
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}

function QuestionsForMe({ week }: { week: WeekEntry }) {
  return (
    <section aria-labelledby="my-questions" className="mt-5">
      <h3
        id="my-questions"
        className="font-display text-xl font-semibold text-forest-900"
      >
        Your questions
      </h3>
      {week.questions.length === 0 ? (
        <p className="mt-2 text-[15px] text-muted">
          Nobody wrote questions for you this week.
        </p>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {week.questions.map((question, index) => (
            <li
              key={question.id}
              className="flex gap-3 rounded-2xl bg-moss-100/45 px-4 py-3"
            >
              <span className="font-display text-lg leading-6 font-semibold text-forest-500 tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[16px] leading-6 wrap-anywhere text-ink">
                  {question.body}
                </p>
                <p className="mt-0.5 text-sm wrap-anywhere text-muted">
                  {question.authorName}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
