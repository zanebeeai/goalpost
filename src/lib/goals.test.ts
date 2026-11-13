import { describe, expect, it } from "vitest";
import {
  defaultTargetDate,
  goalDue,
  MAX_ACTIVE_GOALS,
  maxTargetDate,
  targetDateError,
} from "./goals";

// 2026-11-13 is a Friday.
const TODAY = "2026-11-13";

describe("limits", () => {
  it("allows three active goals", () => {
    expect(MAX_ACTIVE_GOALS).toBe(3);
  });

  it("defaults to four weeks out and allows up to a year", () => {
    expect(defaultTargetDate(TODAY)).toBe("2026-12-11");
    expect(maxTargetDate(TODAY)).toBe("2027-11-13");
    expect(maxTargetDate("2028-02-29")).toBe("2029-02-28");
  });
});

describe("targetDateError", () => {
  it("accepts today through a year from today", () => {
    expect(targetDateError(TODAY, TODAY)).toBeNull();
    expect(targetDateError("2026-12-11", TODAY)).toBeNull();
    expect(targetDateError("2027-11-13", TODAY)).toBeNull();
    expect(targetDateError(" 2026-12-11 ", TODAY)).toBeNull();
  });

  it("asks for a date when it is missing or malformed", () => {
    for (const value of ["", "   ", "tomorrow", "2026-2-1", "2026-02-30"]) {
      expect(targetDateError(value, TODAY)).toBe("Pick a date for this goal.");
    }
  });

  it("refuses past dates and dates more than a year out", () => {
    expect(targetDateError("2026-11-12", TODAY)).toBe(
      "Pick today or a later date.",
    );
    expect(targetDateError("2027-11-14", TODAY)).toBe(
      "Pick a date within a year.",
    );
  });
});

describe("goalDue", () => {
  const label = (target: string) => goalDue(target, TODAY).label;

  it("counts days over when overdue", () => {
    expect(goalDue("2026-11-12", TODAY)).toMatchObject({
      daysLeft: -1,
      overdue: true,
      label: "1 day over",
    });
    expect(label("2026-11-03")).toBe("10 days over");
  });

  it("names today, tomorrow, and weekdays within the week", () => {
    expect(goalDue(TODAY, TODAY)).toMatchObject({
      daysLeft: 0,
      overdue: false,
      label: "Due today",
    });
    expect(label("2026-11-14")).toBe("Due tomorrow");
    expect(label("2026-11-15")).toBe("Due Sunday");
    expect(label("2026-11-19")).toBe("Due Thursday");
  });

  it("counts days, then weeks, then months", () => {
    expect(label("2026-11-20")).toBe("7 days left");
    expect(label("2026-11-26")).toBe("13 days left");
    expect(label("2026-11-27")).toBe("2 weeks left");
    expect(label("2026-12-11")).toBe("4 weeks left");
    // 59 days
    expect(label("2027-01-11")).toBe("8 weeks left");
    // 60 days
    expect(label("2027-01-12")).toBe("2 months left");
    // 91 days
    expect(label("2027-02-12")).toBe("3 months left");
    expect(goalDue("2027-11-13", TODAY)).toMatchObject({
      daysLeft: 365,
      label: "12 months left",
    });
  });

  it("formats the date, adding the year only when it differs", () => {
    expect(goalDue("2026-12-11", TODAY).dateLabel).toBe("Dec 11");
    expect(goalDue("2027-01-09", TODAY).dateLabel).toBe("Jan 9, 2027");
    expect(goalDue("2025-12-30", "2026-01-02").dateLabel).toBe("Dec 30, 2025");
  });

  it("is unaffected by daylight saving changes", () => {
    // US clocks change on 2026-03-08 and 2026-11-01.
    expect(goalDue("2026-03-15", "2026-03-01").daysLeft).toBe(14);
    expect(goalDue("2026-11-08", "2026-10-25").daysLeft).toBe(14);
  });

  it("falls back quietly on a date it cannot read", () => {
    for (const bad of ["infinity", "20000-01-01", "soon", "2026-02-30", ""]) {
      expect(goalDue(bad, TODAY)).toEqual({
        daysLeft: 0,
        overdue: false,
        label: "",
        dateLabel: bad,
      });
    }
  });
});
