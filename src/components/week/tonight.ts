import { goalDue } from "@/lib/goals";
import { phaseOf } from "@/lib/week";

export type TonightItem = {
  key: "takeaway" | "goals";
  label: string;
  /** In-page link to the section that finishes this item. */
  href: string;
  done: boolean;
  /** "1 of 3" for goals, while there is something to check in on. */
  progress?: string;
};

/** The id on the Goals section, for in-page links. */
export const GOALS_SECTION_ID = "goals";

/**
 * What is left for me on Friday and Saturday. Empty on other days, and only
 * items that apply: "Write what stuck" once I picked a topic (and its form is
 * on the page), "Check in on your goals" when I have active goals.
 */
export function tonightItems({
  today,
  week,
  goals,
}: {
  today: string;
  week: { id: string; takeaway: string; revealed: boolean } | null;
  goals: Array<{ checkin: string | null; targetDate: string }>;
}): TonightItem[] {
  const phase = phaseOf(today);
  if (phase !== "interview" && phase !== "wrap") return [];

  const items: TonightItem[] = [];
  if (week?.revealed) {
    items.push({
      key: "takeaway",
      label: "Write what stuck",
      href: `#takeaway-${week.id}`,
      done: week.takeaway.trim().length > 0,
    });
  }
  if (goals.length > 0) {
    const checkedIn = goals.filter((goal) => goal.checkin?.trim()).length;
    // Overdue goals hide their check-in box until the owner decides, so when
    // all of them are overdue the next step is that decision.
    const allOverdue = goals.every(
      (goal) => goalDue(goal.targetDate, today).overdue,
    );
    if (allOverdue) {
      items.push({
        key: "goals",
        label: "Decide on your overdue goals",
        href: `#${GOALS_SECTION_ID}`,
        done: false,
      });
      return items;
    }
    items.push({
      key: "goals",
      label: "Check in on your goals",
      href: `#${GOALS_SECTION_ID}`,
      done: checkedIn === goals.length,
      progress: `${checkedIn} of ${goals.length}`,
    });
  }
  return items;
}
