"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionContext } from "@/lib/action-context";
import type { ActionState } from "@/lib/action-state";
import { friendlyDbError } from "@/lib/db-errors";
import { fields, firstIssue, idSchema, requiredText } from "@/lib/validation";

function revalidateTopics() {
  revalidatePath("/app");
  revalidatePath("/app/next");
}

export async function addTopicAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      title: requiredText(
        120,
        "Write a topic first.",
        "Keep the topic under 120 characters.",
      ),
    })
    .safeParse(fields(formData, "title"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { member, supabase } = await actionContext();
  const { error } = await supabase.from("topics").insert({
    space_id: member.space.id,
    added_by: member.id,
    title: parsed.data.title,
  });
  if (error) return { error: friendlyDbError(error) };
  revalidateTopics();
  return { ok: true };
}

export async function removeTopicAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ topicId: idSchema })
    .safeParse(fields(formData, "topicId"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { supabase } = await actionContext();
  const { data, error } = await supabase
    .from("topics")
    .delete()
    .eq("id", parsed.data.topicId)
    .select("id");
  if (error) return { error: friendlyDbError(error) };
  if (data.length === 0) {
    revalidateTopics();
    return { error: "That topic is no longer on the list." };
  }
  revalidateTopics();
  return { ok: true };
}
