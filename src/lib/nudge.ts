import { goalDue } from "@/lib/goals";
import { phaseOf, todayIn, weekStartOf } from "@/lib/week";

export type NudgeKind = "pick" | "interview";

export type NudgeProfile = {
  id: string;
  email: string | null;
  displayName: string;
  emailNudges: boolean;
  lastNudgedOn: string | null;
  spaceId: string;
  timezone: string;
};

export type NudgeWeek = { userId: string; weekStart: string; topic: string };

/** An active goal and the weeks it has a check-in for. */
export type NudgeGoal = {
  userId: string;
  title: string;
  targetDate: string;
  checkinWeekStarts: string[];
};

/** An active goal still waiting for this week's check-in. */
export type PendingGoal = { title: string; dueLabel: string };

export type NudgeEmail = { subject: string; text: string; html: string };

export type Nudge = NudgeEmail & {
  userId: string;
  email: string;
  kind: NudgeKind;
  /** The member's local date; stored as `last_nudged_on` after sending. */
  localDate: string;
  idempotencyKey: string;
};

export type Mate = { displayName: string; topic: string | null };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Distinct current-week Sundays across the given timezones. */
export function currentWeekStarts(timezones: string[], now: Date): string[] {
  return [
    ...new Set(timezones.map((zone) => weekStartOf(todayIn(zone, now)))),
  ].sort();
}

/**
 * Which nudge, if any, a member should get today. Pure: callers pass the
 * member's local date, their own topic this week, and their space mates.
 */
export function decideNudge(input: {
  emailNudges: boolean;
  hasEmail: boolean;
  lastNudgedOn: string | null;
  today: string;
  myTopic: string | null;
  mates: Mate[];
  /** Active goals without a check-in this week. */
  pendingGoals: number;
}): NudgeKind | null {
  if (!input.emailNudges || !input.hasEmail) return null;
  if (input.lastNudgedOn === input.today) return null;
  const phase = phaseOf(input.today);
  if (phase === "pick") return input.myTopic ? null : "pick";
  if (phase === "interview") {
    if (input.mates.length === 0 && !input.myTopic && input.pendingGoals === 0)
      return null;
    return "interview";
  }
  return null;
}

function layout(
  paragraphs: Array<{ text: string; html: string }>,
  siteUrl: string,
) {
  const settings = `${siteUrl}/app/settings`;
  const footerText = `You get these because email nudges are on. Turn them off in settings: ${settings}`;
  const footerHtml = `You get these because email nudges are on. <a href="${escapeHtml(settings)}">Turn them off in settings</a>.`;
  return {
    text: [...paragraphs.map((p) => p.text), "--", footerText].join("\n\n"),
    html: [
      '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:16px;line-height:1.5;color:#1f2b24;max-width:480px">',
      ...paragraphs.map((p) => `<p>${p.html}</p>`),
      `<p style="font-size:13px;color:#647068">${footerHtml}</p>`,
      "</div>",
    ].join(""),
  };
}

function link(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" style="color:#2b4d3c">${escapeHtml(label)}</a>`;
}

export function buildPickEmail(input: {
  displayName: string;
  siteUrl: string;
}): NudgeEmail {
  const url = `${input.siteUrl}/app`;
  const name = input.displayName;
  return {
    subject: "Pick your topic",
    ...layout(
      [
        {
          text: `Hi ${name}, it's Sunday. What are you learning this week?`,
          html: `Hi ${escapeHtml(name)}, it's Sunday. What are you learning this week?`,
        },
        {
          text: `Pick your topic: ${url}`,
          html: link(url, "Pick your topic"),
        },
      ],
      input.siteUrl,
    ),
  };
}

/** "Check in on your goals: Run a 10k (3 weeks left); Ship it (2 days over)" */
function goalsParagraph(goals: PendingGoal[]): { text: string; html: string } {
  const intro = "Check in on your goals: ";
  return {
    text:
      intro +
      goals
        .map((goal) =>
          goal.dueLabel ? `${goal.title} (${goal.dueLabel})` : goal.title,
        )
        .join("; "),
    html:
      intro +
      goals
        .map((goal) => {
          const title = `<strong>${escapeHtml(goal.title)}</strong>`;
          return goal.dueLabel
            ? `${title} (${escapeHtml(goal.dueLabel)})`
            : title;
        })
        .join("; "),
  };
}

/**
 * The Friday email. "Interview night" when anyone picked a topic or there is
 * no goal to check in on; otherwise a short "Friday check-in".
 */
export function buildInterviewEmail(input: {
  displayName: string;
  myTopic: string | null;
  mates: Mate[];
  pendingGoals: PendingGoal[];
  siteUrl: string;
}): NudgeEmail {
  const url = `${input.siteUrl}/app`;
  const name = input.displayName;
  const anyMateTopic = input.mates.some((mate) => mate.topic);
  const checkinOnly =
    !input.myTopic && !anyMateTopic && input.pendingGoals.length > 0;

  if (checkinOnly) {
    return {
      subject: "Friday check-in",
      ...layout(
        [
          {
            text: `Hi ${name}, it's Friday.`,
            html: `Hi ${escapeHtml(name)}, it's Friday.`,
          },
          goalsParagraph(input.pendingGoals),
          { text: `Open Goalpost: ${url}`, html: link(url, "Open Goalpost") },
        ],
        input.siteUrl,
      ),
    };
  }

  const paragraphs: Array<{ text: string; html: string }> = [
    {
      text: `Hi ${name}, it's interview night.`,
      html: `Hi ${escapeHtml(name)}, it's interview night.`,
    },
  ];

  if (input.mates.length > 0) {
    const lines = input.mates.map((mate) =>
      mate.topic
        ? {
            text: `${mate.displayName} learned about: ${mate.topic}`,
            html: `${escapeHtml(mate.displayName)} learned about: <strong>${escapeHtml(mate.topic)}</strong>`,
          }
        : {
            text: `${mate.displayName} didn't pick a topic this week.`,
            html: `${escapeHtml(mate.displayName)} didn't pick a topic this week.`,
          },
    );
    paragraphs.push({
      text: lines.map((line) => line.text).join("\n"),
      html: lines.map((line) => line.html).join("<br>"),
    });
  }

  if (input.myTopic) {
    paragraphs.push({
      text: `You're up too: ${input.myTopic}`,
      html: `You're up too: <strong>${escapeHtml(input.myTopic)}</strong>`,
    });
  }

  if (input.pendingGoals.length > 0) {
    paragraphs.push(goalsParagraph(input.pendingGoals));
  }

  paragraphs.push(
    anyMateTopic
      ? {
          text: `Add your questions: ${url}`,
          html: link(url, "Add your questions"),
        }
      : {
          text: `Open Goalpost: ${url}`,
          html: link(url, "Open Goalpost"),
        },
  );

  return { subject: "Interview night", ...layout(paragraphs, input.siteUrl) };
}

type PlanInput = {
  profiles: NudgeProfile[];
  weeks: NudgeWeek[];
  /** Active goals only. */
  goals: NudgeGoal[];
  now: Date;
  siteUrl: string;
};

/** The nudge for one member right now, or null. */
function planNudgeFor(profile: NudgeProfile, input: PlanInput): Nudge | null {
  const today = todayIn(profile.timezone, input.now);
  const weekStart = weekStartOf(today);
  const topicOf = (userId: string) =>
    input.weeks.find(
      (week) => week.userId === userId && week.weekStart === weekStart,
    )?.topic ?? null;
  const myTopic = topicOf(profile.id);
  const mates = input.profiles
    .filter((other) => other.spaceId === profile.spaceId)
    .filter((other) => other.id !== profile.id)
    .map((other) => ({
      displayName: other.displayName,
      topic: topicOf(other.id),
    }));
  const pendingGoals = input.goals
    .filter(
      (goal) =>
        goal.userId === profile.id &&
        !goal.checkinWeekStarts.includes(weekStart),
    )
    .map((goal) => ({
      title: goal.title,
      dueLabel: goalDue(goal.targetDate, today).label,
    }));

  const kind = decideNudge({
    emailNudges: profile.emailNudges,
    hasEmail: Boolean(profile.email),
    lastNudgedOn: profile.lastNudgedOn,
    today,
    myTopic,
    mates,
    pendingGoals: pendingGoals.length,
  });
  if (!kind || !profile.email) return null;

  const email =
    kind === "pick"
      ? buildPickEmail({
          displayName: profile.displayName,
          siteUrl: input.siteUrl,
        })
      : buildInterviewEmail({
          displayName: profile.displayName,
          myTopic,
          mates,
          pendingGoals,
          siteUrl: input.siteUrl,
        });
  return {
    ...email,
    userId: profile.id,
    email: profile.email,
    kind,
    localDate: today,
    idempotencyKey: `nudge-${profile.id}-${today}-${kind}`,
  };
}

/**
 * Every nudge to send right now. One member's bad data never stops the rest:
 * that member is skipped and reported through `onError`.
 */
export function planNudges(
  input: PlanInput & { onError?: (userId: string, error: unknown) => void },
): Nudge[] {
  const nudges: Nudge[] = [];
  for (const profile of input.profiles) {
    try {
      const nudge = planNudgeFor(profile, input);
      if (nudge) nudges.push(nudge);
    } catch (error) {
      input.onError?.(profile.id, error);
    }
  }
  return nudges;
}
