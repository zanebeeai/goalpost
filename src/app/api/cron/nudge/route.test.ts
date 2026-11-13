// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updates: Array<{ id: string; last_nudged_on: string }> = [];
const goalQueries: Array<Array<[string, ...unknown[]]>> = [];

const goals = [
  {
    user_id: "u2",
    title: "Run a 10k",
    target_date: "2026-11-11",
    checkins: [],
  },
];

const profiles = [
  {
    id: "u1",
    space_id: "s1",
    display_name: "Tony",
    email_nudges: true,
    last_nudged_on: null,
    space: { timezone: "America/New_York" },
  },
  {
    id: "u2",
    space_id: "s1",
    display_name: "Sam",
    email_nudges: true,
    last_nudged_on: "2026-11-08",
    space: { timezone: "America/New_York" },
  },
];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        listUsers: async () => ({
          data: {
            users: [
              { id: "u1", email: "tony@example.com" },
              { id: "u2", email: "sam@example.com" },
            ],
          },
          error: null,
        }),
      },
    },
    from: (table: string) => {
      if (table === "goals") {
        const calls: Array<[string, ...unknown[]]> = [];
        goalQueries.push(calls);
        const query = {
          select: (...args: unknown[]) => (
            calls.push(["select", ...args]),
            query
          ),
          is: (...args: unknown[]) => (calls.push(["is", ...args]), query),
          in: (...args: unknown[]) => (calls.push(["in", ...args]), query),
          order: async (...args: unknown[]) => {
            calls.push(["order", ...args]);
            return { data: goals, error: null };
          },
        };
        return query;
      }
      if (table === "weeks") {
        return {
          select: () => ({ in: async () => ({ data: [], error: null }) }),
        };
      }
      return {
        select: async () => ({ data: profiles, error: null }),
        update: (patch: { last_nudged_on: string }) => ({
          eq: async (_column: string, id: string) => {
            updates.push({ id, ...patch });
            return { error: null };
          },
        }),
      };
    },
  }),
}));

const { GET } = await import("./route");

function request(token?: string) {
  return new NextRequest("http://localhost/api/cron/nudge", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe("GET /api/cron/nudge", () => {
  const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));

  beforeEach(() => {
    updates.length = 0;
    goalQueries.length = 0;
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("CRON_SECRET", "secret");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("RESEND_FROM", "Goalpost <hi@example.com>");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://goalpost.example");
    // Sunday evening in New York.
    vi.useFakeTimers({
      now: new Date("2026-11-08T22:00:00Z"),
      toFake: ["Date"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects a missing or wrong secret", async () => {
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request("nope"))).status).toBe(401);
  });

  it("rejects everything when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(request(""))).status).toBe(401);
    expect((await GET(request("secret"))).status).toBe(401);
  });

  it("skips when Resend is not configured", async () => {
    vi.stubEnv("RESEND_FROM", "");
    const response = await GET(request("secret"));
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends due nudges once and records the local date", async () => {
    const response = await GET(request("secret"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: 1, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.resend.com/emails");
    const headers = init.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("nudge-u1-2026-11-08-pick");
    expect(headers.Authorization).toBe("Bearer re_test");
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["tony@example.com"]);
    expect(body.subject).toBe("Pick your topic");
    expect(body.text).toContain("https://goalpost.example/app");
    expect(updates).toEqual([{ id: "u1", last_nudged_on: "2026-11-08" }]);
  });

  it("adds active goals without a check-in to the Friday email", async () => {
    vi.setSystemTime(new Date("2026-11-13T22:00:00Z"));
    const response = await GET(request("secret"));
    expect(await response.json()).toEqual({ sent: 2, failed: 0 });
    const bodies = fetchMock.mock.calls.map((call) =>
      JSON.parse((call as unknown as [string, RequestInit])[1].body as string),
    );
    const forSam = bodies.find((body) => body.to[0] === "sam@example.com");
    expect(forSam.subject).toBe("Friday check-in");
    expect(forSam.text).toContain(
      "Check in on your goals: Run a 10k (2 days over)",
    );
    const forTony = bodies.find((body) => body.to[0] === "tony@example.com");
    expect(forTony.subject).toBe("Interview night");
    expect(forTony.text).not.toContain("Check in on your goals");
    // Only active goals, with check-ins limited to the current week.
    expect(goalQueries[0]).toContainEqual(["is", "finished_at", null]);
    expect(goalQueries[0]).toContainEqual([
      "in",
      "checkins.week_start",
      ["2026-11-08"],
    ]);
  });

  it("counts a member it cannot plan as a failure and sends the rest", async () => {
    const original = profiles[0]!.display_name;
    profiles[0]!.display_name = null as unknown as string;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      // Friday: Sam has a goal waiting; Tony's broken row cannot be planned.
      vi.setSystemTime(new Date("2026-11-13T22:00:00Z"));
      const response = await GET(request("secret"));
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ sent: 1, failed: 1 });
      expect(updates).toEqual([{ id: "u2", last_nudged_on: "2026-11-13" }]);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("u1"));
    } finally {
      profiles[0]!.display_name = original;
      errorSpy.mockRestore();
    }
  });

  it("does not record a nudge that failed to send", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    const response = await GET(request("secret"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ sent: 0, failed: 1 });
    expect(updates).toEqual([]);
  });
});
