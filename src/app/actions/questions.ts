"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionContext } from "@/lib/action-context";
import type { ActionState } from "@/lib/action-state";
import { friendlyDbError } from "@/lib/db-errors";
import { fields, firstIssue, idSchema, requiredText } from "@/lib/validation";

function revalidateQuestions() {
  revalidatePath("/app");
  revalidatePath("/app/history");
}

export async function addQuestionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      weekId: idSchema,
      body: requiredText(
        500,
        "Write a question first.",
        "Keep questions under 500 characters.",
      ),
    })
    .safeParse(fields(formData, "weekId", "body"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { member, supabase } = await actionContext();
  const { error } = await supabase.from("questions").insert({
    week_id: parsed.data.weekId,
    author_id: member.id,
    body: parsed.data.body,
  });
  if (error) {
    if (error.code === "42501") {
      return { error: "You can only ask questions about someone else's week." };
    }
    return { error: friendlyDbError(error) };
  }
  revalidateQuestions();
  return { ok: true };
}

export async function deleteQuestionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ questionId: idSchema })
    .safeParse(fields(formData, "questionId"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { member, supabase } = await actionContext();
  const { data, error } = await supabase
    .from("questions")
    .delete()
    .eq("id", parsed.data.questionId)
    .eq("author_id", member.id)
    .select("id");
  if (error) return { error: friendlyDbError(error) };
  if (!data || data.length === 0) {
    return { error: "That question was already removed." };
  }
  revalidateQuestions();
  return { ok: true };
}
