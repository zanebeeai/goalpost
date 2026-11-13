import { Avatar } from "@/components/avatar";
import { CollapsibleText } from "@/components/collapsible-text";
import { LinkifiedText } from "@/components/linkified-text";
import { ShareButton } from "@/components/share-button";
import { Card } from "@/components/ui/card";
import type { BoardColumn } from "@/lib/data";
import { QuestionsFor } from "./questions";

export function PartnerCard({
  column,
  siteUrl,
  timezone,
}: {
  column: BoardColumn;
  siteUrl: string;
  timezone: string;
}) {
  const { member, week } = column;
  const name = member.displayName;

  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <Avatar name={name} className="size-8 text-xs" />
        <p className="min-w-0 text-sm font-semibold wrap-anywhere text-muted">
          {week ? `${name} is learning` : name}
        </p>
      </div>

      {week ? (
        <>
          <h2 className="mt-3 font-display text-[1.75rem] leading-[1.15] font-semibold tracking-tight wrap-anywhere text-forest-900">
            {week.topic}
          </h2>
          {week.notes.trim() ? (
            <CollapsibleText text={week.notes} className="mt-4" />
          ) : (
            <p className="mt-3 text-[15px] text-muted">No notes yet.</p>
          )}
          {week.revealed && week.takeaway.trim() ? (
            <figure className="mt-5 rounded-2xl border-l-4 border-moss-400 bg-moss-100/40 py-3 pr-4 pl-4">
              <figcaption className="text-xs font-bold tracking-[0.12em] text-forest-500 uppercase">
                What stuck
              </figcaption>
              <LinkifiedText
                text={week.takeaway}
                className="mt-1 text-[16px] leading-relaxed text-ink"
              />
            </figure>
          ) : null}
          <QuestionsFor week={week} name={name} timezone={timezone} />
        </>
      ) : (
        <>
          <p className="mt-5 font-display text-2xl leading-snug font-semibold wrap-anywhere text-forest-900">
            {`${name} hasn't picked yet.`}
          </p>
          <ShareButton
            className="mt-4"
            label={`Nudge ${name}`}
            text="Pick your topic for this week"
            url={`${siteUrl}/app`}
          />
        </>
      )}
    </Card>
  );
}
