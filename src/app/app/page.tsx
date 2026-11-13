import type { Metadata } from "next";
import { GoalsSection } from "@/components/week/goals";
import { InviteCard } from "@/components/week/invite-card";
import { MyCard } from "@/components/week/my-card";
import { PartnerCard } from "@/components/week/partner-card";
import { PickTopic } from "@/components/week/pick-topic";
import { tonightItems } from "@/components/week/tonight";
import { TonightChecklist } from "@/components/week/tonight-checklist";
import { WeekHeader } from "@/components/week/week-header";
import { requireMember } from "@/lib/auth";
import { getBoard, getUpNext } from "@/lib/data";
import { getPublicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import { todayIn, weekStartOf } from "@/lib/week";

export const metadata: Metadata = { title: "This week" };

export default async function ThisWeekPage() {
  const member = await requireMember();
  const today = todayIn(member.space.timezone);
  const weekStart = weekStartOf(today);
  const { siteUrl } = getPublicEnv();

  const columns = await getBoard(weekStart);
  const [mine, ...others] = columns;
  const upNext = mine?.week ? [] : await getUpNext();
  const picked = Boolean(mine?.week);
  const solo = others.length === 0;

  return (
    <>
      <WeekHeader weekStart={weekStart} today={today}>
        <TonightChecklist
          today={today}
          items={tonightItems({
            today,
            week: mine?.week ?? null,
            goals: mine?.goals ?? [],
          })}
        />
      </WeekHeader>
      <div
        className={cn(
          "grid items-start gap-4 lg:gap-6 [&>*]:min-w-0",
          // Before the first pick, the pick card is the one thing on screen.
          picked || !solo ? "lg:grid-cols-2" : "lg:max-w-2xl",
        )}
      >
        {mine?.week ? (
          <MyCard
            week={mine.week}
            hasPartners={!solo}
            siteUrl={siteUrl}
            timezone={member.space.timezone}
          />
        ) : (
          <PickTopic upNext={upNext} />
        )}
        {solo ? (
          <InviteCard
            inviteUrl={`${siteUrl}/join/${member.space.inviteCode}`}
            quiet={!picked}
          />
        ) : (
          others.map((column) => (
            <PartnerCard
              key={column.member.id}
              column={column}
              siteUrl={siteUrl}
              timezone={member.space.timezone}
            />
          ))
        )}
      </div>
      <GoalsSection columns={columns} today={today} />
    </>
  );
}
