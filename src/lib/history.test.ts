import { describe, expect, it } from "vitest";
import type { WeekEntry } from "./data";
import {
  assembleHistory,
  finishedInWeek,
  historyWeekStarts,
  type GoalRow,
  type MemberWithJoin,
} from "./history";

const TZ = "America/New_York";

function goal(overrides: Partial<GoalRow>): GoalRow {
  return {
    id: "g1",
    userId: "me",
    title: "Run",
    createdAt: "2026-10-01T00:00:00Z",
    finishedAt: null,
    ...overrides,
  };
}

function week(overrides: Partial<WeekEntry>): WeekEntry {
  return {
    id: "w1",
    userId: "me",
    weekStart: "2026-11-01",
    topic: "Rust",
    notes: "",
    takeaway: "",
    revealed: true,
    revealsAt: "2026-11-06T04:00:00.000Z",
    questions: [],
    ...overrides,
  };
}

const me: MemberWithJoin = {
  id: "me",
  displayName: "Tony",
  isMe: true,
  joinedAt: "2026-10-01T12:00:00Z",
};
const late: MemberWithJoin = {
  id: "late",
  displayName: "Chris",
  isMe: false,
  // Wednesday Nov 11 in New York.
  joinedAt: "2026-11-11T15:00:00Z",
};

describe("finishedInWeek", () => {
  it("uses the local week boundary of the space timezone", () => {
    const goals = [
      // Saturday 23:00 in New York, Sunday in UTC: still the Nov 8 week.
      goal({
        id: "a",
        title: "Late Saturday",
        finishedAt: "2026-11-15T04:00:00Z",
      }),
      goal({ id: "b", title: "Monday", finishedAt: "2026-11-09T15:00:00Z" }),
      goal({ id: "c", title: "Next week", finishedAt: "2026-11-15T06:00:00Z" }),
      goal({ id: "d", title: "Active" }),
      goal({
        id: "e",
        title: "Someone else",
        userId: "x",
        finishedAt: "2026-11-09T15:00:00Z",
      }),
    ];
    expect(finishedInWeek(goals, "me", "2026-11-08", TZ)).toEqual([
      "Monday",
      "Late Saturday",
    ]);
  });
});

describe("historyWeekStarts", () => {
  it("counts weeks with only a finished goal and stays before the cutoff", () => {
    expect(
      historyWeekStarts({
        weekStarts: ["2026-10-18"],
        checkinStarts: ["2026-10-25", "2026-10-18"],
        goals: [
          goal({ finishedAt: "2026-11-03T15:00:00Z" }),
          goal({ id: "g2", finishedAt: "2026-11-10T15:00:00Z" }),
        ],
        timezone: TZ,
        beforeWeekStart: "2026-11-08",
        limit: 26,
      }),
    ).toEqual(["2026-11-01", "2026-10-25", "2026-10-18"]);
  });

  it("applies the limit to the newest weeks", () => {
    expect(
      historyWeekStarts({
        weekStarts: ["2026-10-04", "2026-10-11", "2026-10-18"],
        checkinStarts: [],
        goals: [],
        timezone: TZ,
        beforeWeekStart: "2026-11-08",
        limit: 2,
      }),
    ).toEqual(["2026-10-18", "2026-10-11"]);
  });
});

describe("assembleHistory", () => {
  it("adds finished goals and check-ins to the member's column", () => {
    const [result] = assembleHistory({
      starts: ["2026-11-01"],
      members: [me],
      weeks: [],
      goals: [
        goal({ id: "g1", title: "Run", finishedAt: "2026-11-03T15:00:00Z" }),
        goal({ id: "g2", title: "Read", createdAt: "2026-10-02T00:00:00Z" }),
      ],
      checkins: [
        { goalId: "g2", weekStart: "2026-11-01", body: "Two chapters" },
        { goalId: "g1", weekStart: "2026-11-01", body: "Ran 5k" },
      ],
      timezone: TZ,
    });
    expect(result?.columns).toEqual([
      {
        member: { id: "me", displayName: "Tony", isMe: true },
        week: null,
        checkins: [
          { goalTitle: "Run", body: "Ran 5k" },
          { goalTitle: "Read", body: "Two chapters" },
        ],
        finishedGoals: ["Run"],
      },
    ]);
  });

  it("omits members for weeks that ended before they joined", () => {
    const history = assembleHistory({
      starts: ["2026-11-08", "2026-11-01"],
      members: [me, late],
      weeks: [
        week({ weekStart: "2026-11-08" }),
        week({ id: "w2", weekStart: "2026-11-01" }),
      ],
      goals: [],
      checkins: [],
      timezone: TZ,
    });
    expect(history.map((h) => h.columns.map((c) => c.member.id))).toEqual([
      ["me", "late"],
      ["me"],
    ]);
  });

  it("keeps a late joiner's column when they brought an entry for that week", () => {
    const [result] = assembleHistory({
      starts: ["2026-11-01"],
      members: [me, late],
      weeks: [week({ id: "w3", userId: "late", weekStart: "2026-11-01" })],
      goals: [],
      checkins: [],
      timezone: TZ,
    });
    expect(result?.columns.map((c) => c.member.id)).toEqual(["me", "late"]);
  });
});
