"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  href: string,
) {
  try {
    const admin = createAdminClient();
    await admin
      .from("notifications")
      .insert({ user_id: userId, notification_type: type, title, body, href });
  } catch {
    // Local development may omit the secret key; the invitation itself still succeeds.
  }
}

export async function sendFriendRequestAction(formData: FormData) {
  const viewer = await requireViewer();
  const username = z
    .string()
    .trim()
    .min(3)
    .max(30)
    .parse(formData.get("username"));
  const supabase = await createClient();
  const { data: recipient } = await supabase
    .from("profiles")
    .select("id,display_name")
    .eq("username", username)
    .maybeSingle();
  if (!recipient || recipient.id === viewer.id)
    throw new Error("That member could not be invited");
  const { error } = await supabase.from("friend_requests").upsert(
    {
      sender_id: viewer.id,
      recipient_id: recipient.id,
      status: "pending",
      responded_at: null,
    },
    { onConflict: "sender_id,recipient_id" },
  );
  if (error) throw new Error(error.message);
  await notify(
    recipient.id,
    "friend_request",
    "New friend request",
    "Someone would like to connect with you.",
    "/app/friends",
  );
  revalidatePath("/app/friends");
}

export async function respondFriendRequestAction(formData: FormData) {
  await requireViewer();
  const requestId = z.string().uuid().parse(formData.get("requestId"));
  const accept = formData.get("accept") === "true";
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_to_friend_request", {
    p_request_id: requestId,
    p_accept: accept,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/friends");
}

export async function removeFriendAction(formData: FormData) {
  const viewer = await requireViewer();
  const friendId = z.string().uuid().parse(formData.get("friendId"));
  const a = viewer.id < friendId ? viewer.id : friendId;
  const b = viewer.id < friendId ? friendId : viewer.id;
  const supabase = await createClient();
  await supabase.from("friendships").delete().eq("user_a", a).eq("user_b", b);
  revalidatePath("/app/friends");
}

export async function blockMemberAction(formData: FormData) {
  const viewer = await requireViewer();
  const blockedId = z.string().uuid().parse(formData.get("memberId"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("blocks")
    .upsert({ blocker_id: viewer.id, blocked_id: blockedId });
  if (error) throw new Error(error.message);
  revalidatePath("/app/friends");
}

export async function inviteToListAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      listId: z.string().uuid(),
      username: z.string().trim().min(3).max(30),
      role: z.enum(["editor", "viewer"]),
    })
    .parse({
      listId: formData.get("listId"),
      username: formData.get("username"),
      role: formData.get("role"),
    });
  const supabase = await createClient();
  const { data: invitee } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.username)
    .maybeSingle();
  if (!invitee) throw new Error("Member not found");
  const { error } = await supabase.from("list_invitations").upsert(
    {
      list_id: parsed.listId,
      inviter_id: viewer.id,
      invitee_id: invitee.id,
      role: parsed.role,
      status: "pending",
      responded_at: null,
    },
    { onConflict: "list_id,invitee_id" },
  );
  if (error) throw new Error(error.message);
  await notify(
    invitee.id,
    "list_invitation",
    "A list was shared with you",
    `You were invited as ${parsed.role}.`,
    "/app/inbox",
  );
  revalidatePath(`/app/ideas/${parsed.listId}`);
}

export async function inviteToGoalAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      goalpostId: z.string().uuid(),
      publicId: z.string().uuid(),
      username: z.string().trim().min(3).max(30),
    })
    .parse({
      goalpostId: formData.get("goalpostId"),
      publicId: formData.get("publicId"),
      username: formData.get("username"),
    });
  const supabase = await createClient();
  const { data: invitee } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.username)
    .maybeSingle();
  if (!invitee) throw new Error("Member not found");
  const { error } = await supabase.from("goal_invitations").upsert(
    {
      goalpost_id: parsed.goalpostId,
      inviter_id: viewer.id,
      invitee_id: invitee.id,
      status: "pending",
      responded_at: null,
    },
    { onConflict: "goalpost_id,invitee_id" },
  );
  if (error) throw new Error(error.message);
  await notify(
    invitee.id,
    "goal_invitation",
    "A goalpost was shared with you",
    "Accept to add the joint goal to your tree.",
    "/app/inbox",
  );
  revalidatePath(`/g/${parsed.publicId}`);
}

export async function respondInvitationAction(formData: FormData) {
  await requireViewer();
  const parsed = z
    .object({
      id: z.string().uuid(),
      kind: z.enum(["list", "goal"]),
      accept: z.enum(["true", "false"]),
    })
    .parse({
      id: formData.get("id"),
      kind: formData.get("kind"),
      accept: formData.get("accept"),
    });
  const supabase = await createClient();
  const fn =
    parsed.kind === "list"
      ? "accept_list_invitation"
      : "accept_goal_invitation";
  const { error } = await supabase.rpc(fn, {
    p_invitation_id: parsed.id,
    p_accept: parsed.accept === "true",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/inbox");
  revalidatePath("/app/ideas");
  revalidatePath("/app/tree");
}

export async function markNotificationReadAction(formData: FormData) {
  const viewer = await requireViewer();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", viewer.id);
  revalidatePath("/app/inbox");
}

export async function reportContentAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      targetType: z.enum([
        "profile",
        "goalpost",
        "goal_update",
        "comment",
        "attachment",
      ]),
      targetId: z.string().uuid(),
      reason: z.string().trim().min(3).max(100),
      details: z.string().trim().max(2000).optional(),
      revalidate: z.string().startsWith("/"),
    })
    .parse({
      targetType: formData.get("targetType"),
      targetId: formData.get("targetId"),
      reason: formData.get("reason"),
      details: formData.get("details")?.toString(),
      revalidate: formData.get("revalidate"),
    });
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: viewer.id,
    target_type: parsed.targetType,
    target_id: parsed.targetId,
    reason: parsed.reason,
    details: parsed.details || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(parsed.revalidate);
}
