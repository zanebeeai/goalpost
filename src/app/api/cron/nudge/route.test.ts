// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updates: Array<{ id: string; last_nudged_on: string }> = [];

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

  it("does not record a nudge that failed to send", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    const response = await GET(request("secret"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ sent: 0, failed: 1 });
    expect(updates).toEqual([]);
  });
});
