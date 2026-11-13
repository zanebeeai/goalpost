import { describe, expect, it } from "vitest";
import {
  buildInterviewEmail,
  buildPickEmail,
  currentWeekStarts,
  decideNudge,
  escapeHtml,
  planNudges,
  type NudgeProfile,
} from "./nudge";

const SITE = "https://goalpost.example";
// 2026-11-08 is a Sunday; 2026-11-13 is a Friday.
const SUNDAY_EVENING_NY = new Date("2026-11-08T22:00:00Z");
const FRIDAY_EVENING_NY = new Date("2026-11-13T22:00:00Z");

function profile(overrides: Partial<NudgeProfile> = {}): NudgeProfile {
  return {
    id: "u1",
    email: "u1@example.com",
    displayName: "Tony",
    emailNudges: true,
    lastNudgedOn: null,
    spaceId: "s1",
    timezone: "America/New_York",
    ...overrides,
  };
}

describe("decideNudge", () => {
  const base = {
    emailNudges: true,
    hasEmail: true,
    lastNudgedOn: null,
    myTopic: null,
    mates: [{ displayName: "Sam", topic: null }],
  };

  it("nudges on Sunday only when no topic is picked", () => {
    expect(decideNudge({ ...base, today: "2026-11-08" })).toBe("pick");
    expect(
      decideNudge({ ...base, today: "2026-11-08", myTopic: "Rust" }),
    ).toBeNull();
  });

  it("nudges on Friday for the interview", () => {
    expect(decideNudge({ ...base, today: "2026-11-13" })).toBe("interview");
  });

  it("skips Friday for a solo member who picked nothing", () => {
    expect(decideNudge({ ...base, today: "2026-11-13", mates: [] })).toBeNull();
    expect(
      decideNudge({ ...base, today: "2026-11-13", mates: [], myTopic: "Go" }),
    ).toBe("interview");
  });

  it("is quiet on other days", () => {
    for (const day of ["2026-11-09", "2026-11-10", "2026-11-14"]) {
      expect(decideNudge({ ...base, today: day })).toBeNull();
    }
  });

  it("respects opt-out, missing email, and already-nudged today", () => {
    const today = "2026-11-08";
    expect(decideNudge({ ...base, today, emailNudges: false })).toBeNull();
    expect(decideNudge({ ...base, today, hasEmail: false })).toBeNull();
    expect(decideNudge({ ...base, today, lastNudgedOn: today })).toBeNull();
    expect(decideNudge({ ...base, today, lastNudgedOn: "2026-11-01" })).toBe(
      "pick",
    );
  });
});

describe("planNudges", () => {
  it("sends a pick nudge on the member's local Sunday", () => {
    const [nudge, ...rest] = planNudges({
      profiles: [profile()],
      weeks: [],
      now: SUNDAY_EVENING_NY,
      siteUrl: SITE,
    });
    expect(rest).toHaveLength(0);
    expect(nudge).toMatchObject({
      userId: "u1",
      email: "u1@example.com",
      kind: "pick",
      localDate: "2026-11-08",
      idempotencyKey: "nudge-u1-2026-11-08-pick",
      subject: "Pick your topic",
    });
    expect(nudge?.text).toContain(`${SITE}/app`);
  });

  it("uses each space's timezone to decide the local day", () => {
    // 22:00 UTC Sunday is already Monday in Tokyo.
    const nudges = planNudges({
      profiles: [profile({ timezone: "Asia/Tokyo" })],
      weeks: [],
      now: SUNDAY_EVENING_NY,
      siteUrl: SITE,
    });
    expect(nudges).toHaveLength(0);
  });

  it("does not nudge someone who already picked this week", () => {
    const nudges = planNudges({
      profiles: [profile()],
      weeks: [{ userId: "u1", weekStart: "2026-11-08", topic: "Rust" }],
      now: SUNDAY_EVENING_NY,
      siteUrl: SITE,
    });
    expect(nudges).toHaveLength(0);
  });

  it("ignores a topic from a previous week", () => {
    const nudges = planNudges({
      profiles: [profile()],
      weeks: [{ userId: "u1", weekStart: "2026-11-01", topic: "Rust" }],
      now: SUNDAY_EVENING_NY,
      siteUrl: SITE,
    });
    expect(nudges.map((n) => n.kind)).toEqual(["pick"]);
  });

  it("lists only space mates' topics on Friday", () => {
    const nudges = planNudges({
      profiles: [
        profile(),
        profile({ id: "u2", email: "u2@example.com", displayName: "Sam" }),
        profile({
          id: "u3",
          email: "u3@example.com",
          displayName: "Outsider",
          spaceId: "s2",
        }),
      ],
      weeks: [
        { userId: "u2", weekStart: "2026-11-08", topic: "Sourdough" },
        { userId: "u3", weekStart: "2026-11-08", topic: "Secret" },
      ],
      now: FRIDAY_EVENING_NY,
      siteUrl: SITE,
    });
    const forTony = nudges.find((n) => n.userId === "u1");
    expect(forTony?.kind).toBe("interview");
    expect(forTony?.idempotencyKey).toBe("nudge-u1-2026-11-13-interview");
    expect(forTony?.text).toContain("Sam learned about: Sourdough");
    expect(forTony?.text).not.toContain("Secret");
    expect(forTony?.text).not.toContain("Outsider");

    const forSam = nudges.find((n) => n.userId === "u2");
    expect(forSam?.text).toContain("Tony didn't pick a topic this week.");
    expect(forSam?.text).toContain("You're up too: Sourdough");

    // u3 is alone in s2 but picked a topic, so still gets the Friday email.
    expect(nudges.find((n) => n.userId === "u3")?.kind).toBe("interview");
  });

  it("still lists members who turned nudges off", () => {
    const nudges = planNudges({
      profiles: [
        profile(),
        profile({ id: "u2", displayName: "Sam", emailNudges: false }),
      ],
      weeks: [{ userId: "u2", weekStart: "2026-11-08", topic: "Chess" }],
      now: FRIDAY_EVENING_NY,
      siteUrl: SITE,
    });
    expect(nudges.map((n) => n.userId)).toEqual(["u1"]);
    expect(nudges[0]?.text).toContain("Sam learned about: Chess");
  });

  it("skips members already nudged today and members without email", () => {
    const nudges = planNudges({
      profiles: [
        profile({ lastNudgedOn: "2026-11-08" }),
        profile({ id: "u2", email: null }),
      ],
      weeks: [],
      now: SUNDAY_EVENING_NY,
      siteUrl: SITE,
    });
    expect(nudges).toHaveLength(0);
  });
});

describe("emails", () => {
  it("escapes names and topics in HTML", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
    const email = buildInterviewEmail({
      displayName: "<b>Tony</b>",
      myTopic: null,
      mates: [{ displayName: "Sam", topic: "<script>alert(1)</script>" }],
      siteUrl: SITE,
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<b>Tony</b>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.text).toContain("<script>alert(1)</script>");
  });

  it("links to the app and to settings", () => {
    const email = buildPickEmail({ displayName: "Tony", siteUrl: SITE });
    expect(email.html).toContain(`href="${SITE}/app"`);
    expect(email.html).toContain(`href="${SITE}/app/settings"`);
    expect(email.text).toContain(`${SITE}/app/settings`);
  });

  it("asks for questions only when a mate picked a topic", () => {
    const none = buildInterviewEmail({
      displayName: "Tony",
      myTopic: "Rust",
      mates: [{ displayName: "Sam", topic: null }],
      siteUrl: SITE,
    });
    expect(none.text).not.toContain("Add your questions");
    expect(none.text).toContain("Open Goalpost");
  });
});

describe("currentWeekStarts", () => {
  it("returns the distinct Sundays across timezones", () => {
    // Saturday 23:30 UTC is already Sunday in Tokyo.
    const now = new Date("2026-11-14T23:30:00Z");
    expect(currentWeekStarts(["UTC", "Asia/Tokyo", "UTC"], now)).toEqual([
      "2026-11-08",
      "2026-11-15",
    ]);
  });
});
