"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionContext } from "@/lib/action-context";
import type { ActionState } from "@/lib/action-state";
import { friendlyDbError } from "@/lib/db-errors";
import {
  fields,
  firstIssue,
  idSchema,
  requiredText,
  text,
} from "@/lib/validation";

const topicText = requiredText(
  120,
  "Write what you're learning this week.",
  "Keep the topic under 120 characters.",
);

const pickSchema = z.object({
  topic: text(120, "Keep the topic under 120 characters."),
  topicId: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.union([z.literal(""), z.uuid("That topic was not found.")]),
  ),
});

function revalidateWeek() {
  revalidatePath("/app");
  revalidatePath("/app/next");
  revalidatePath("/app/history");
}

export async function pickTopicAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = pickSchema.safeParse(fields(formData, "topic", "topicId"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { topic, topicId } = parsed.data;
  if (!topic && !topicId) {
    return { error: "Write what you're learning this week." };
  }

  const { member, supabase, weekStart } = await actionContext();

  const existing = await supabase
    .from("weeks")
    .select("id")
    .eq("user_id", member.id)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (existing.error) return { error: friendlyDbError(existing.error) };
  if (existing.data) return { error: "You already picked a topic this week." };

  let title = topic;
  if (topicId) {
    const found = await supabase
      .from("topics")
      .select("title")
      .eq("id", topicId)
      .maybeSingle();
    if (found.error) return { error: friendlyDbError(found.error) };
    if (!found.data) {
      return { error: "That topic is no longer on the list." };
    }
    title = found.data.title;
  }

  const inserted = await supabase
    .from("weeks")
    .insert({ user_id: member.id, week_start: weekStart, topic: title });
  if (inserted.error) {
    if (inserted.error.code === "23505") {
      return { error: "You already picked a topic this week." };
    }
    return { error: friendlyDbError(inserted.error) };
  }

  if (topicId) {
    // The pick already succeeded; a leftover list item is not worth failing it.
    const removed = await supabase.from("topics").delete().eq("id", topicId);
    if (removed.error) {
      console.error("pickTopicAction: could not remove Up next item", {
        topicId,
        code: removed.error.code,
        message: removed.error.message,
      });
    }
  }

  revalidateWeek();
  return { ok: true };
}

async function updateOwnWeek(
  weekId: string,
  patch: { topic?: string; notes?: string; takeaway?: string },
  options: { currentWeekOnly: boolean },
): Promise<ActionState> {
  const { member, supabase, weekStart } = await actionContext();
  let query = supabase
    .from("weeks")
    .update(patch)
    .eq("id", weekId)
    .eq("user_id", member.id);
  if (options.currentWeekOnly) query = query.eq("week_start", weekStart);
  const { data, error } = await query.select("id").maybeSingle();
  if (error) return { error: friendlyDbError(error) };
  if (!data) {
    return {
      error: options.currentWeekOnly
        ? "You can only change this week's topic and notes. Refresh and try again."
        : "That week was not found. Refresh and try again.",
    };
  }
  revalidateWeek();
  return { ok: true };
}

export async function renameTopicAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ weekId: idSchema, topic: topicText })
    .safeParse(fields(formData, "weekId", "topic"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  return updateOwnWeek(
    parsed.data.weekId,
    { topic: parsed.data.topic },
    { currentWeekOnly: true },
  );
}

export async function saveNotesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      weekId: idSchema,
      notes: z.preprocess(
        (value) => (typeof value === "string" ? value.replace(/\s+$/, "") : ""),
        z.string().max(20000, "Notes are limited to 20,000 characters."),
      ),
    })
    .safeParse(fields(formData, "weekId", "notes"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  return updateOwnWeek(
    parsed.data.weekId,
    { notes: parsed.data.notes },
    { currentWeekOnly: true },
  );
}

export async function saveTakeawayAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      weekId: idSchema,
      takeaway: text(2000, "Keep it under 2,000 characters."),
    })
    .safeParse(fields(formData, "weekId", "takeaway"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  return updateOwnWeek(
    parsed.data.weekId,
    { takeaway: parsed.data.takeaway },
    { currentWeekOnly: false },
  );
}
