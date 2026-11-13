import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import {
  currentWeekStarts,
  planNudges,
  type Nudge,
  type NudgeProfile,
} from "@/lib/nudge";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function sendEmail(
  nudge: Nudge,
  config: { apiKey: string; from: string },
): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": nudge.idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [nudge.email],
        subject: nudge.subject,
        text: nudge.text,
        html: nudge.html,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function loadEmails(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    data.users.forEach((user) => {
      if (user.email) emails.set(user.id, user.email);
    });
    if (data.users.length < perPage) return emails;
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return NextResponse.json({
      skipped: "RESEND_API_KEY or RESEND_FROM is not set",
    });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Supabase service role is not configured" },
      { status: 500 },
    );
  }

  const profilesResult = await admin
    .from("profiles")
    .select(
      "id, space_id, display_name, email_nudges, last_nudged_on, space:spaces(timezone)",
    );
  if (profilesResult.error) {
    return NextResponse.json(
      { error: "Could not load profiles" },
      { status: 500 },
    );
  }
  if (!profilesResult.data.some((row) => row.email_nudges)) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  let emails: Map<string, string>;
  try {
    emails = await loadEmails(admin);
  } catch {
    return NextResponse.json(
      { error: "Could not load users" },
      { status: 500 },
    );
  }

  const profiles: NudgeProfile[] = profilesResult.data.map((row) => ({
    id: row.id,
    email: emails.get(row.id) ?? null,
    displayName: row.display_name,
    emailNudges: row.email_nudges,
    lastNudgedOn: row.last_nudged_on,
    spaceId: row.space_id,
    timezone: row.space?.timezone ?? "UTC",
  }));

  const now = new Date();
  const weekStarts = currentWeekStarts(
    profiles.map((profile) => profile.timezone),
    now,
  );
  const weeksResult = await admin
    .from("weeks")
    .select("user_id, week_start, topic")
    .in("week_start", weekStarts);
  if (weeksResult.error) {
    return NextResponse.json(
      { error: "Could not load weeks" },
      { status: 500 },
    );
  }

  const nudges = planNudges({
    profiles,
    weeks: weeksResult.data.map((row) => ({
      userId: row.user_id,
      weekStart: row.week_start,
      topic: row.topic,
    })),
    now,
    siteUrl: getPublicEnv().siteUrl,
  });

  let sent = 0;
  let failed = 0;
  for (const nudge of nudges) {
    if (!(await sendEmail(nudge, { apiKey, from }))) {
      failed += 1;
      continue;
    }
    const { error } = await admin
      .from("profiles")
      .update({ last_nudged_on: nudge.localDate })
      .eq("id", nudge.userId);
    if (error) failed += 1;
    else sent += 1;
  }

  // A non-2xx status makes failed sends visible in cron monitoring.
  return NextResponse.json(
    { sent, failed },
    { status: failed > 0 ? 500 : 200 },
  );
}
