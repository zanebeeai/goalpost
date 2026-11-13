import { cache } from "react";
import { getMember, getViewer } from "@/lib/auth";
import {
  assembleHistory,
  finishedInWeek,
  historyWeekStarts,
  type GoalRow,
  type MemberWithJoin,
} from "@/lib/history";
import { createClient } from "@/lib/supabase/server";
import { addDays } from "@/lib/week";

export type MemberSummary = { id: string; displayName: string; isMe: boolean };
export type Question = {
  id: string;
  body: string;
  authorName: string;
  mine: boolean;
};
export type WeekEntry = {
  id: string;
  userId: string;
  weekStart: string;
  topic: string;
  notes: string;
  takeaway: string;
  /** True once the owner may read this week's questions (frozen at creation). */
  revealed: boolean;
  /** ISO timestamp when the owner may read the questions. */
  revealsAt: string;
  /** Only the questions the viewer is allowed to read (RLS decides). */
  questions: Question[];
};
export type Goal = {
  id: string;
  title: string;
  /** This goal's check-in for the requested week, or null. */
  checkin: string | null;
  /** "YYYY-MM-DD" in the space timezone. */
  targetDate: string;
};
export type BoardColumn = {
  member: MemberSummary;
  week: WeekEntry | null;
  /** Active goals only. */
  goals: Goal[];
  /** Titles of goals finished during this week (space timezone). */
  finishedThisWeek: string[];
};
export type UpNextTopic = {
  id: string;
  title: string;
  addedByName: string | null;
};
export type HistoryWeek = {
  weekStart: string;
  columns: Array<{
    member: MemberSummary;
    week: WeekEntry | null;
    checkins: Array<{ goalTitle: string; body: string }>;
    /** Titles of goals finished during this week (space timezone). */
    finishedGoals: string[];
  }>;
};

const UNKNOWN_AUTHOR = "Someone";

const WEEK_COLUMNS =
  "id, user_id, week_start, topic, notes, takeaway, reveals_at, questions(id, body, author_id, created_at)";

type WeekRow = {
  id: string;
  user_id: string;
  week_start: string;
  topic: string;
  notes: string;
  takeaway: string;
  reveals_at: string;
  questions: Array<{
    id: string;
    body: string;
    author_id: string;
    created_at: string;
  }>;
};

function fail(what: string, error: { message: string }): never {
  throw new Error(`Could not load ${what}: ${error.message}`);
}

function toWeekEntry(
  row: WeekRow,
  names: Map<string, string>,
  viewerId: string,
): WeekEntry {
  const questions = [...row.questions]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((question) => ({
      id: question.id,
      body: question.body,
      authorName: names.get(question.author_id) ?? UNKNOWN_AUTHOR,
      mine: question.author_id === viewerId,
    }));
  return {
    id: row.id,
    userId: row.user_id,
    weekStart: row.week_start,
    topic: row.topic,
    notes: row.notes,
    takeaway: row.takeaway,
    revealed: Date.now() >= Date.parse(row.reveals_at),
    revealsAt: new Date(row.reveals_at).toISOString(),
    questions,
  };
}

function nameMap(members: MemberSummary[]): Map<string, string> {
  return new Map(members.map((member) => [member.id, member.displayName]));
}

const loadMembers = cache(async (): Promise<MemberWithJoin[]> => {
  const viewer = await getViewer();
  if (!viewer) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) fail("members", error);
  const members = data.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    isMe: row.id === viewer.id,
    joinedAt: row.created_at,
  }));
  return [
    ...members.filter((member) => member.isMe),
    ...members.filter((member) => !member.isMe),
  ];
});

/** Viewer first, then the rest by join date. */
export const getMembers = cache(async (): Promise<MemberSummary[]> =>
  (await loadMembers()).map(({ id, displayName, isMe }) => ({
    id,
    displayName,
    isMe,
  })),
);

async function spaceTimezone(): Promise<string> {
  return (await getMember())?.space.timezone ?? "UTC";
}

const GOAL_COLUMNS = "id, user_id, title, created_at, finished_at";

function toGoalRow(row: {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  finished_at: string | null;
}): GoalRow {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    finishedAt: row.finished_at,
  };
}

/** One column per member for the given week, viewer first. */
export async function getBoard(weekStart: string): Promise<BoardColumn[]> {
  const viewer = await getViewer();
  if (!viewer) return [];
  const [members, timezone] = await Promise.all([
    getMembers(),
    spaceTimezone(),
  ]);
  const ids = members.map((member) => member.id);
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const [weeksResult, goalsResult, finishedResult] = await Promise.all([
    supabase
      .from("weeks")
      .select(WEEK_COLUMNS)
      .eq("week_start", weekStart)
      .in("user_id", ids),
    supabase
      .from("goals")
      .select(
        "id, user_id, title, target_date, created_at, checkins(body, week_start)",
      )
      .is("finished_at", null)
      .in("user_id", ids)
      .eq("checkins.week_start", weekStart)
      .order("created_at", { ascending: true }),
    // A day of slack each side covers every UTC offset; finishedInWeek()
    // then applies the exact local-week boundary.
    supabase
      .from("goals")
      .select(GOAL_COLUMNS)
      .in("user_id", ids)
      .gte("finished_at", addDays(weekStart, -1))
      .lt("finished_at", addDays(weekStart, 8)),
  ]);
  if (weeksResult.error) fail("this week", weeksResult.error);
  if (goalsResult.error) fail("goals", goalsResult.error);
  if (finishedResult.error) fail("finished goals", finishedResult.error);

  const names = nameMap(members);
  const weeks = new Map(
    weeksResult.data.map((row) => [
      row.user_id,
      toWeekEntry(row, names, viewer.id),
    ]),
  );
  const finished = finishedResult.data.map(toGoalRow);

  return members.map((member) => ({
    member,
    week: weeks.get(member.id) ?? null,
    goals: goalsResult.data
      .filter((goal) => goal.user_id === member.id)
      .map((goal) => ({
        id: goal.id,
        title: goal.title,
        checkin:
          goal.checkins.find((checkin) => checkin.week_start === weekStart)
            ?.body ?? null,
        targetDate: goal.target_date,
      })),
    finishedThisWeek: finishedInWeek(finished, member.id, weekStart, timezone),
  }));
}

export async function getUpNext(): Promise<UpNextTopic[]> {
  const viewer = await getViewer();
  if (!viewer) return [];
  const supabase = await createClient();
  const [members, topicsResult] = await Promise.all([
    getMembers(),
    supabase
      .from("topics")
      .select("id, title, added_by, created_at")
      .order("created_at", { ascending: true }),
  ]);
  if (topicsResult.error) fail("the Up next list", topicsResult.error);
  const names = nameMap(members);
  return topicsResult.data.map((topic) => ({
    id: topic.id,
    title: topic.title,
    addedByName: topic.added_by ? (names.get(topic.added_by) ?? null) : null,
  }));
}

/** Weeks strictly before `beforeWeekStart`, newest first, only weeks where at
 *  least one member has an entry, a check-in, or a finished goal. Members who
 *  joined after a week ended get no column for it. Default limit 26. */
export async function getHistory(
  beforeWeekStart: string,
  limit = 26,
): Promise<HistoryWeek[]> {
  const viewer = await getViewer();
  if (!viewer) return [];
  const [members, timezone] = await Promise.all([
    loadMembers(),
    spaceTimezone(),
  ]);
  const ids = members.map((member) => member.id);
  if (ids.length === 0 || limit <= 0) return [];

  const supabase = await createClient();

  // Find which weeks have anything in them, then load only those weeks.
  const [weekStarts, goalsResult] = await Promise.all([
    supabase
      .from("weeks")
      .select("week_start")
      .in("user_id", ids)
      .lt("week_start", beforeWeekStart),
    supabase
      .from("goals")
      .select(GOAL_COLUMNS)
      .in("user_id", ids)
      .order("created_at", { ascending: true }),
  ]);
  if (weekStarts.error) fail("history", weekStarts.error);
  if (goalsResult.error) fail("goals", goalsResult.error);

  const goals = goalsResult.data.map(toGoalRow);
  const goalIds = goals.map((goal) => goal.id);
  const checkinStarts =
    goalIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("checkins")
          .select("week_start")
          .in("goal_id", goalIds)
          .lt("week_start", beforeWeekStart);
  if (checkinStarts.error) fail("check-ins", checkinStarts.error);

  const starts = historyWeekStarts({
    weekStarts: weekStarts.data.map((row) => row.week_start),
    checkinStarts: checkinStarts.data.map((row) => row.week_start),
    goals,
    timezone,
    beforeWeekStart,
    limit,
  });
  if (starts.length === 0) return [];

  const [weeksResult, checkinsResult] = await Promise.all([
    supabase
      .from("weeks")
      .select(WEEK_COLUMNS)
      .in("user_id", ids)
      .in("week_start", starts),
    goalIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("checkins")
          .select("goal_id, week_start, body")
          .in("goal_id", goalIds)
          .in("week_start", starts),
  ]);
  if (weeksResult.error) fail("history", weeksResult.error);
  if (checkinsResult.error) fail("check-ins", checkinsResult.error);

  const names = nameMap(members);
  return assembleHistory({
    starts,
    members,
    weeks: weeksResult.data.map((row) => toWeekEntry(row, names, viewer.id)),
    goals,
    checkins: checkinsResult.data.map((row) => ({
      goalId: row.goal_id,
      weekStart: row.week_start,
      body: row.body,
    })),
    timezone,
  });
}

/** Member names in the invited space, or null when the code is invalid. */
export async function getInvitePreview(code: string): Promise<string[] | null> {
  const trimmed = code.trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(trimmed)) return null;
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_preview", {
    p_invite_code: trimmed,
  });
  if (error) fail("the invite", error);
  if (!data || data.length === 0) return null;
  return data.map((row) => row.display_name);
}
