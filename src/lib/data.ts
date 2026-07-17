import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  AppNotification,
  GoalCollaborator,
  GoalEvent,
  Goalpost,
  GoalTask,
  GoalUpdate,
  IdeaCard,
  ListRole,
  ListSummary,
  Profile,
} from "@/types/domain";

type RecordRow = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function profileFromRow(row: RecordRow): Profile {
  return {
    id: asString(row.id),
    username: asString(row.username),
    displayName: asString(row.display_name, "Deleted user"),
    bio: asNullableString(row.bio),
    avatarPath: asNullableString(row.avatar_path),
    timezone: asString(row.timezone, "UTC"),
    createdAt: asString(row.created_at),
  };
}

function ideaFromRow(row: RecordRow): IdeaCard {
  const checklistRows = Array.isArray(row.checklists)
    ? (row.checklists as RecordRow[])
    : [];
  const checklistItems = checklistRows.flatMap((item) =>
    Array.isArray(item.checklist_items)
      ? (item.checklist_items as RecordRow[])
      : [],
  );
  return {
    id: asString(row.id),
    listId: asString(row.list_id),
    listTitle:
      asNullableString((row.idea_lists as RecordRow | undefined)?.title) ??
      undefined,
    title: asString(row.title),
    content: (row.content ?? {
      type: "doc",
      content: [],
    }) as IdeaCard["content"],
    status: asString(row.status, "active") as IdeaCard["status"],
    tags: Array.isArray(row.tags)
      ? row.tags.filter((item): item is string => typeof item === "string")
      : [],
    position:
      typeof row.position === "number"
        ? row.position
        : Number(row.position ?? 0),
    createdBy: asString(row.created_by),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    completedAt: asNullableString(row.completed_at),
    archivedAt: asNullableString(row.archived_at),
    checklistTotal: checklistItems.length,
    checklistDone: checklistItems.filter((item) => item.completed_at).length,
    attachmentCount: Array.isArray(row.attachments)
      ? row.attachments.length
      : 0,
    commentCount: Array.isArray(row.comments) ? row.comments.length : 0,
  };
}

function collaboratorFromRow(row: RecordRow): GoalCollaborator {
  const profile = (row.profiles ?? {}) as RecordRow;
  return {
    userId: asString(row.user_id),
    username: asString(profile.username),
    displayName: asString(profile.display_name, "Deleted user"),
    avatarPath: asNullableString(profile.avatar_path),
    isAdmin: Boolean(row.is_admin),
  };
}

function goalFromRow(row: RecordRow): Goalpost {
  const collaborators = Array.isArray(row.goal_collaborators)
    ? (row.goal_collaborators as RecordRow[]).map(collaboratorFromRow)
    : [];
  const tasks = Array.isArray(row.goal_tasks)
    ? (row.goal_tasks as RecordRow[])
    : [];
  const updates = Array.isArray(row.goal_updates)
    ? (row.goal_updates as RecordRow[])
    : [];
  const latest = updates[0];
  return {
    id: asString(row.id),
    publicId: asString(row.public_id),
    title: asString(row.title),
    content: (row.content ?? {
      type: "doc",
      content: [],
    }) as Goalpost["content"],
    status: asString(row.status, "active") as Goalpost["status"],
    tags: Array.isArray(row.tags)
      ? row.tags.filter((item): item is string => typeof item === "string")
      : [],
    startedOn: asString(row.started_on),
    completedAt: asNullableString(row.completed_at),
    parentGoalpostId: asNullableString(row.parent_goalpost_id),
    createdBy: asNullableString(row.created_by),
    adminUserId: asNullableString(row.admin_user_id),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    collaborators,
    taskTotal: tasks.length,
    taskDone: tasks.filter((task) => task.completed_at).length,
    latestUpdate: latest
      ? {
          id: asString(latest.id),
          goalpostId: asString(latest.goalpost_id),
          authorId: asNullableString(latest.author_id),
          authorName: asString(
            ((latest.profiles ?? {}) as RecordRow).display_name,
            "Deleted user",
          ),
          content: (latest.content ?? {}) as GoalUpdate["content"],
          publishedAt: asString(latest.published_at),
        }
      : undefined,
  };
}

const goalSelect = `
  id, public_id, title, content, status, tags, started_on, completed_at,
  parent_goalpost_id, created_by, admin_user_id, created_at, updated_at,
  goal_collaborators(user_id, is_admin, profiles(username, display_name, avatar_path)),
  goal_tasks(id, completed_at),
  goal_updates(id, goalpost_id, author_id, content, published_at, profiles(display_name))
`;

export const getProfileByUsername = cache(
  async (username: string): Promise<Profile | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    return data ? profileFromRow(data as RecordRow) : null;
  },
);

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? profileFromRow(data as RecordRow) : null;
}

export async function getLists(userId: string): Promise<ListSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("list_members")
    .select("role, idea_lists(id,title,description,updated_at,ideas(count))")
    .eq("user_id", userId)
    .order("joined_at");
  return ((data ?? []) as RecordRow[]).map((row) => {
    const list = row.idea_lists as RecordRow;
    const counts = Array.isArray(list.ideas)
      ? (list.ideas[0] as RecordRow | undefined)
      : undefined;
    return {
      id: asString(list.id),
      title: asString(list.title),
      description: asNullableString(list.description),
      role: asString(row.role, "viewer") as ListRole,
      ideaCount: Number(counts?.count ?? 0),
      updatedAt: asString(list.updated_at),
    };
  });
}

export async function getIdeas(
  options: {
    listId?: string;
    status?: IdeaCard["status"];
    limit?: number;
  } = {},
): Promise<IdeaCard[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ideas")
    .select(
      "*, idea_lists(title), checklists(checklist_items(id,completed_at)), attachments(id), comments(id)",
    )
    .order("position", { ascending: true })
    .limit(options.limit ?? 200);
  if (options.listId) query = query.eq("list_id", options.listId);
  if (options.status) query = query.eq("status", options.status);
  const { data } = await query;
  return ((data ?? []) as RecordRow[]).map(ideaFromRow);
}

export async function getIdea(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ideas")
    .select(
      "*, idea_lists(title), checklists(*,checklist_items(*)), attachments(*), comments(*,profiles(username,display_name,avatar_path))",
    )
    .eq("id", id)
    .maybeSingle();
  return data as RecordRow | null;
}

export async function getGoalsForUser(userId: string): Promise<Goalpost[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("goal_collaborators")
    .select("goalpost_id")
    .eq("user_id", userId);
  const ids = ((memberships ?? []) as RecordRow[])
    .map((row) => asString(row.goalpost_id))
    .filter(Boolean);
  if (!ids.length) return [];
  const { data } = await supabase
    .from("goalposts")
    .select(goalSelect)
    .in("id", ids)
    .order("started_on", { ascending: false });
  return ((data ?? []) as RecordRow[]).map(goalFromRow);
}

export async function getGoalByPublicId(publicId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goalposts")
    .select(
      `
      id, public_id, title, content, status, tags, started_on, completed_at,
      parent_goalpost_id, created_by, admin_user_id, created_at, updated_at,
      goal_collaborators(user_id, is_admin, profiles(username, display_name, avatar_path)),
      goal_tasks(*), goal_events(*),
      goal_updates(*, profiles(username,display_name,avatar_path), attachments(*)),
      attachments(*), comments(*,profiles(username,display_name,avatar_path))
    `,
    )
    .eq("public_id", publicId)
    .maybeSingle();
  if (!data) return null;
  return { goal: goalFromRow(data as RecordRow), raw: data as RecordRow };
}

export async function getCalendarData(
  userId: string,
): Promise<{ events: GoalEvent[]; tasks: GoalTask[] }> {
  const goals = await getGoalsForUser(userId);
  const ids = goals.map((goal) => goal.id);
  if (!ids.length) return { events: [], tasks: [] };
  const supabase = await createClient();
  const [{ data: events }, { data: tasks }] = await Promise.all([
    supabase
      .from("goal_events")
      .select("*")
      .in("goalpost_id", ids)
      .order("starts_at"),
    supabase
      .from("goal_tasks")
      .select("*")
      .in("goalpost_id", ids)
      .not("due_at", "is", null)
      .order("due_at"),
  ]);
  return {
    events: ((events ?? []) as RecordRow[]).map((row) => ({
      id: asString(row.id),
      goalpostId: asString(row.goalpost_id),
      title: asString(row.title),
      description: asNullableString(row.description),
      eventType: asString(row.event_type, "custom") as GoalEvent["eventType"],
      startsAt: asString(row.starts_at),
      createdBy: asNullableString(row.created_by),
    })),
    tasks: ((tasks ?? []) as RecordRow[]).map((row) => ({
      id: asString(row.id),
      goalpostId: asString(row.goalpost_id),
      title: asString(row.title),
      assigneeUserId: asNullableString(row.assignee_user_id),
      dueAt: asNullableString(row.due_at),
      completedAt: asNullableString(row.completed_at),
      position: Number(row.position ?? 0),
    })),
  };
}

export async function getNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return ((data ?? []) as RecordRow[]).map((row) => ({
    id: asString(row.id),
    type: asString(row.notification_type),
    title: asString(row.title),
    body: asNullableString(row.body),
    href: asNullableString(row.href),
    readAt: asNullableString(row.read_at),
    createdAt: asString(row.created_at),
  }));
}

export async function searchGoalpost(query: string, userId: string) {
  const supabase = await createClient();
  const term = query.trim().replace(/[%_]/g, "");
  if (term.length < 2) return { profiles: [], ideas: [], goals: [] };
  const [{ data: profiles }, { data: ideas }, { data: goals }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(15),
      supabase
        .from("ideas")
        .select("*,idea_lists(title)")
        .or(`title.ilike.%${term}%,tags.cs.{${term.toLowerCase()}}`)
        .limit(25),
      supabase
        .from("goalposts")
        .select(goalSelect)
        .or(`title.ilike.%${term}%,tags.cs.{${term.toLowerCase()}}`)
        .limit(25),
    ]);
  return {
    profiles: ((profiles ?? []) as RecordRow[])
      .filter((row) => asString(row.id) !== userId)
      .map(profileFromRow),
    ideas: ((ideas ?? []) as RecordRow[]).map(ideaFromRow),
    goals: ((goals ?? []) as RecordRow[]).map(goalFromRow),
  };
}

export async function getSocialData(userId: string) {
  const supabase = await createClient();
  const [
    { data: friendships },
    { data: incoming },
    { data: outgoing },
    { data: blocks },
  ] = await Promise.all([
    supabase
      .from("friendships")
      .select("*")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`),
    supabase
      .from("friend_requests")
      .select(
        "*,profiles!friend_requests_sender_id_fkey(username,display_name,avatar_path)",
      )
      .eq("recipient_id", userId)
      .eq("status", "pending"),
    supabase
      .from("friend_requests")
      .select(
        "*,profiles!friend_requests_recipient_id_fkey(username,display_name,avatar_path)",
      )
      .eq("sender_id", userId)
      .eq("status", "pending"),
    supabase
      .from("blocks")
      .select(
        "blocked_id,profiles!blocks_blocked_id_fkey(username,display_name,avatar_path)",
      )
      .eq("blocker_id", userId),
  ]);
  const friendIds = ((friendships ?? []) as RecordRow[]).map((row) =>
    asString(row.user_a) === userId
      ? asString(row.user_b)
      : asString(row.user_a),
  );
  const { data: friendProfiles } = friendIds.length
    ? await supabase.from("profiles").select("*").in("id", friendIds)
    : { data: [] };
  return {
    friends: ((friendProfiles ?? []) as RecordRow[]).map(profileFromRow),
    incoming: (incoming ?? []) as RecordRow[],
    outgoing: (outgoing ?? []) as RecordRow[],
    blocks: (blocks ?? []) as RecordRow[],
  };
}

export async function getAdminReports() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("*, profiles!reports_reporter_id_fkey(username,display_name)")
    .order("created_at", { ascending: false });
  return (data ?? []) as RecordRow[];
}
