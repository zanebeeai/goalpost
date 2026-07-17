"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import {
  normalizeTags,
  parseRichText,
  plainTextDocument,
} from "@/lib/rich-text";
import { createClient } from "@/lib/supabase/server";
import { firstIssue } from "@/lib/validation";
import type { ActionState } from "@/app/actions/ideas";

export async function createGoalAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireViewer();
  const parsed = z
    .object({
      title: z.string().trim().min(1).max(180),
      content: z.string().optional(),
      tags: z.string().optional(),
      startedOn: z.string().date(),
      parentGoalpostId: z.string().uuid().optional(),
    })
    .safeParse({
      title: formData.get("title"),
      content: formData.get("content")?.toString(),
      tags: formData.get("tags")?.toString(),
      startedOn: formData.get("startedOn"),
      parentGoalpostId:
        formData.get("parentGoalpostId")?.toString() || undefined,
    });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_goalpost", {
    p_title: parsed.data.title,
    p_content: parseRichText(parsed.data.content ?? null),
    p_tags: normalizeTags(parsed.data.tags),
    p_started_on: parsed.data.startedOn,
    p_parent_goalpost_id: parsed.data.parentGoalpostId,
  });
  if (error) return { error: error.message };
  const result = Array.isArray(data) ? data[0] : data;
  revalidatePath("/app/tree");
  if (result?.public_id) redirect(`/g/${result.public_id}`);
  return { ok: true };
}

export async function transitionGoalAction(formData: FormData) {
  await requireViewer();
  const parsed = z
    .object({
      goalpostId: z.string().uuid(),
      publicId: z.string().uuid(),
      status: z.enum(["active", "waiting", "done"]),
    })
    .parse({
      goalpostId: formData.get("goalpostId"),
      publicId: formData.get("publicId"),
      status: formData.get("status"),
    });
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_goal", {
    p_goalpost_id: parsed.goalpostId,
    p_status: parsed.status,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/g/${parsed.publicId}`);
  revalidatePath("/app/tree");
}

export async function addGoalUpdateAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      goalpostId: z.string().uuid(),
      publicId: z.string().uuid(),
      content: z.string().min(2),
    })
    .safeParse({
      goalpostId: formData.get("goalpostId"),
      publicId: formData.get("publicId"),
      content: formData.get("content"),
    });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("goal_updates").insert({
    goalpost_id: parsed.data.goalpostId,
    author_id: viewer.id,
    content: parseRichText(parsed.data.content),
  });
  if (error) return { error: error.message };
  revalidatePath(`/g/${parsed.data.publicId}`);
  return { ok: true };
}

export async function addGoalTaskAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      goalpostId: z.string().uuid(),
      publicId: z.string().uuid(),
      title: z.string().trim().min(1).max(240),
      assignee: z.string().uuid().optional(),
      dueAt: z.string().optional(),
    })
    .parse({
      goalpostId: formData.get("goalpostId"),
      publicId: formData.get("publicId"),
      title: formData.get("title"),
      assignee: formData.get("assignee")?.toString() || undefined,
      dueAt: formData.get("dueAt")?.toString() || undefined,
    });
  const supabase = await createClient();
  const { error } = await supabase.from("goal_tasks").insert({
    goalpost_id: parsed.goalpostId,
    title: parsed.title,
    assignee_user_id: parsed.assignee ?? null,
    due_at: parsed.dueAt ? new Date(parsed.dueAt).toISOString() : null,
    created_by: viewer.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/g/${parsed.publicId}`);
  revalidatePath("/app/calendar");
}

export async function toggleGoalTaskAction(formData: FormData) {
  await requireViewer();
  const parsed = z
    .object({
      taskId: z.string().uuid(),
      publicId: z.string().uuid(),
      completed: z.enum(["true", "false"]),
    })
    .parse({
      taskId: formData.get("taskId"),
      publicId: formData.get("publicId"),
      completed: formData.get("completed"),
    });
  const supabase = await createClient();
  const { error } = await supabase
    .from("goal_tasks")
    .update({
      completed_at:
        parsed.completed === "true" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/g/${parsed.publicId}`);
}

export async function addGoalEventAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      goalpostId: z.string().uuid(),
      publicId: z.string().uuid(),
      title: z.string().trim().min(1).max(180),
      eventType: z.enum([
        "delivery",
        "deadline",
        "milestone",
        "resume",
        "custom",
      ]),
      startsAt: z.string().min(1),
      description: z.string().trim().max(2000).optional(),
    })
    .parse({
      goalpostId: formData.get("goalpostId"),
      publicId: formData.get("publicId"),
      title: formData.get("title"),
      eventType: formData.get("eventType"),
      startsAt: formData.get("startsAt"),
      description: formData.get("description")?.toString(),
    });
  const supabase = await createClient();
  const { error } = await supabase.from("goal_events").insert({
    goalpost_id: parsed.goalpostId,
    title: parsed.title,
    event_type: parsed.eventType,
    starts_at: new Date(parsed.startsAt).toISOString(),
    description: parsed.description || null,
    created_by: viewer.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/g/${parsed.publicId}`);
  revalidatePath("/app/calendar");
}

export async function addReminderAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      goalpostId: z.string().uuid(),
      publicId: z.string().uuid(),
      remindAt: z.string().min(1),
      goalTaskId: z.string().uuid().optional(),
      goalEventId: z.string().uuid().optional(),
      sendEmail: z.boolean(),
    })
    .parse({
      goalpostId: formData.get("goalpostId"),
      publicId: formData.get("publicId"),
      remindAt: formData.get("remindAt"),
      goalTaskId: formData.get("goalTaskId")?.toString() || undefined,
      goalEventId: formData.get("goalEventId")?.toString() || undefined,
      sendEmail: formData.get("sendEmail") === "on",
    });
  const supabase = await createClient();
  const { error } = await supabase.from("reminders").insert({
    user_id: viewer.id,
    goalpost_id: parsed.goalpostId,
    goal_task_id: parsed.goalTaskId ?? null,
    goal_event_id: parsed.goalEventId ?? null,
    remind_at: new Date(parsed.remindAt).toISOString(),
    send_email: parsed.sendEmail,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/g/${parsed.publicId}`);
  revalidatePath("/app/calendar");
}

export async function addCommentAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      body: z.string().trim().min(1).max(4000),
      ideaId: z.string().uuid().optional(),
      goalpostId: z.string().uuid().optional(),
      revalidate: z.string().startsWith("/"),
    })
    .refine(
      (value) => Boolean(value.ideaId) !== Boolean(value.goalpostId),
      "Choose one comment parent",
    )
    .parse({
      body: formData.get("body"),
      ideaId: formData.get("ideaId")?.toString() || undefined,
      goalpostId: formData.get("goalpostId")?.toString() || undefined,
      revalidate: formData.get("revalidate"),
    });
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    author_id: viewer.id,
    body: parsed.body,
    idea_id: parsed.ideaId ?? null,
    goalpost_id: parsed.goalpostId ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(parsed.revalidate);
}

export async function addQuickUpdateAction(formData: FormData) {
  const viewer = await requireViewer();
  const goalpostId = z.string().uuid().parse(formData.get("goalpostId"));
  const publicId = z.string().uuid().parse(formData.get("publicId"));
  const body = z.string().trim().min(1).max(5000).parse(formData.get("body"));
  const supabase = await createClient();
  await supabase.from("goal_updates").insert({
    goalpost_id: goalpostId,
    author_id: viewer.id,
    content: plainTextDocument(body),
  });
  revalidatePath(`/g/${publicId}`);
}
