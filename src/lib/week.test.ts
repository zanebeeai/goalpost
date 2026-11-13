import { describe, expect, it } from "vitest";
import {
  addDays,
  daysUntilInterview,
  formatWeekRange,
  phaseOf,
  questionsRevealed,
  todayIn,
  weekStartAt,
  weekStartOf,
} from "./week";

describe("todayIn", () => {
  const instant = new Date("2026-11-14T03:30:00Z");

  it("uses the calendar date in the given timezone", () => {
    expect(todayIn("UTC", instant)).toBe("2026-11-14");
    expect(todayIn("America/New_York", instant)).toBe("2026-11-13");
    expect(todayIn("Asia/Tokyo", instant)).toBe("2026-11-14");
    expect(
      todayIn("Pacific/Kiritimati", new Date("2026-11-13T10:00:00Z")),
    ).toBe("2026-11-14");
  });

  it("falls back to UTC for an unknown timezone", () => {
    expect(todayIn("Not/AZone", instant)).toBe("2026-11-14");
  });

  it("defaults to now", () => {
    expect(todayIn("UTC")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-11-29", 6)).toBe("2026-12-05");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("is not affected by daylight saving changes", () => {
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
  });

  it("rejects malformed dates", () => {
    expect(() => addDays("2026-1-1", 1)).toThrow();
  });
});

describe("weekStartOf", () => {
  it("returns the Sunday on or before the date", () => {
    expect(weekStartOf("2026-11-08")).toBe("2026-11-08");
    expect(weekStartOf("2026-11-13")).toBe("2026-11-08");
    expect(weekStartOf("2026-11-14")).toBe("2026-11-08");
    expect(weekStartOf("2027-01-01")).toBe("2026-12-27");
  });
});

describe("phaseOf", () => {
  it.each([
    ["2026-11-08", "pick"],
    ["2026-11-09", "learn"],
    ["2026-11-12", "learn"],
    ["2026-11-13", "interview"],
    ["2026-11-14", "wrap"],
  ] as const)("%s is %s", (date, phase) => {
    expect(phaseOf(date)).toBe(phase);
  });
});

describe("daysUntilInterview", () => {
  it.each([
    ["2026-11-08", 5],
    ["2026-11-09", 4],
    ["2026-11-12", 1],
    ["2026-11-13", 0],
    ["2026-11-14", 0],
  ] as const)("%s has %i days to go", (date, days) => {
    expect(daysUntilInterview(date)).toBe(days);
  });
});

describe("questionsRevealed", () => {
  it("reveals from Friday of the week onward", () => {
    expect(questionsRevealed("2026-11-08", "2026-11-12")).toBe(false);
    expect(questionsRevealed("2026-11-08", "2026-11-13")).toBe(true);
    expect(questionsRevealed("2026-11-08", "2026-11-14")).toBe(true);
    expect(questionsRevealed("2026-11-01", "2026-11-08")).toBe(true);
    expect(questionsRevealed("2026-11-15", "2026-11-13")).toBe(false);
  });
});

describe("formatWeekRange", () => {
  it("shows one month when the week fits in it", () => {
    expect(formatWeekRange("2026-11-08")).toBe("Nov 8 – 14");
  });

  it("shows both months when the week spans two", () => {
    expect(formatWeekRange("2026-11-29")).toBe("Nov 29 – Dec 5");
    expect(formatWeekRange("2026-12-27")).toBe("Dec 27 – Jan 2");
  });
});

describe("weekStartAt", () => {
  it("uses the local date of the instant", () => {
    // Saturday night in New York is already Sunday in UTC.
    const instant = "2026-11-15T02:00:00Z";
    expect(weekStartAt(instant, "America/New_York")).toBe("2026-11-08");
    expect(weekStartAt(instant, "UTC")).toBe("2026-11-15");
  });
});
