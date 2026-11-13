import { describe, expect, it } from "vitest";
import { tonightItems } from "./tonight";

// Week of Nov 8 – 14, 2026.
const THURSDAY = "2026-11-12";
const FRIDAY = "2026-11-13";
const SATURDAY = "2026-11-14";
const SUNDAY = "2026-11-15";

const week = { id: "w1", takeaway: "", revealed: true };
const LATER = "2026-12-11";
const PAST = "2026-11-10";

describe("tonightItems", () => {
  it("is empty Sunday through Thursday", () => {
    for (const today of [SUNDAY, THURSDAY]) {
      expect(
        tonightItems({
          today,
          week,
          goals: [{ checkin: null, targetDate: LATER }],
        }),
      ).toEqual([]);
    }
  });

  it("lists what stuck and the goal check-in on Friday and Saturday", () => {
    for (const today of [FRIDAY, SATURDAY]) {
      expect(
        tonightItems({
          today,
          week,
          goals: [
            { checkin: "Ran twice", targetDate: LATER },
            { checkin: null, targetDate: LATER },
            { checkin: null, targetDate: LATER },
          ],
        }),
      ).toEqual([
        {
          key: "takeaway",
          label: "Write what stuck",
          href: "#takeaway-w1",
          done: false,
        },
        {
          key: "goals",
          label: "Check in on your goals",
          href: "#goals",
          done: false,
          progress: "1 of 3",
        },
      ]);
    }
  });

  it("ticks items once they are done", () => {
    const items = tonightItems({
      today: FRIDAY,
      week: { ...week, takeaway: "Rye is livelier" },
      goals: [
        { checkin: "Ran twice", targetDate: LATER },
        { checkin: "Shipped", targetDate: LATER },
      ],
    });
    expect(items.map((item) => item.done)).toEqual([true, true]);
    expect(items[1]?.progress).toBe("2 of 2");
  });

  it("does not count blank check-ins or takeaways", () => {
    const items = tonightItems({
      today: FRIDAY,
      week: { ...week, takeaway: "   " },
      goals: [{ checkin: "  ", targetDate: LATER }],
    });
    expect(items.map((item) => item.done)).toEqual([false, false]);
  });

  it("leaves out what does not apply", () => {
    expect(tonightItems({ today: FRIDAY, week: null, goals: [] })).toEqual([]);
    expect(
      tonightItems({
        today: FRIDAY,
        week: null,
        goals: [{ checkin: null, targetDate: LATER }],
      }),
    ).toHaveLength(1);
    expect(
      tonightItems({ today: FRIDAY, week, goals: [] }).map((item) => item.key),
    ).toEqual(["takeaway"]);
  });

  it("skips what stuck while the takeaway form is not shown yet", () => {
    expect(
      tonightItems({
        today: FRIDAY,
        week: { ...week, revealed: false },
        goals: [],
      }),
    ).toEqual([]);
  });

  it("asks for the decision when every goal is overdue", () => {
    const items = tonightItems({
      today: FRIDAY,
      week: null,
      goals: [
        { checkin: null, targetDate: PAST },
        { checkin: "Ran twice", targetDate: PAST },
      ],
    });
    expect(items).toEqual([
      {
        key: "goals",
        label: "Decide on your overdue goals",
        href: "#goals",
        done: false,
      },
    ]);
  });

  it("keeps counting check-ins when only some goals are overdue", () => {
    const items = tonightItems({
      today: FRIDAY,
      week: null,
      goals: [
        { checkin: "Ran twice", targetDate: LATER },
        { checkin: null, targetDate: PAST },
      ],
    });
    expect(items[0]).toMatchObject({
      label: "Check in on your goals",
      progress: "1 of 2",
      done: false,
    });
  });
});
