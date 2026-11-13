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

function revalidateGoals() {
  revalidatePath("/app");
  revalidatePath("/app/history");
}

const goalIdSchema = z.object({ goalId: idSchema });

export async function addGoalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      title: requiredText(
        120,
        "Write the goal first.",
        "Keep the goal under 120 characters.",
      ),
    })
    .safeParse(fields(formData, "title"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { member, supabase } = await actionContext();
  const { error } = await supabase
    .from("goals")
    .insert({ user_id: member.id, title: parsed.data.title });
  if (error) return { error: friendlyDbError(error) };
  revalidateGoals();
  return { ok: true };
}

export async function saveCheckinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      goalId: idSchema,
      body: text(280, "Keep the check-in under 280 characters."),
    })
    .safeParse(fields(formData, "goalId", "body"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { goalId, body } = parsed.data;

  const { member, supabase, weekStart } = await actionContext();
  const goal = await supabase
    .from("goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", member.id)
    .maybeSingle();
  if (goal.error) return { error: friendlyDbError(goal.error) };
  if (!goal.data) return { error: "That goal was not found." };

  if (!body) {
    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("goal_id", goalId)
      .eq("week_start", weekStart);
    if (error) return { error: friendlyDbError(error) };
    revalidateGoals();
    return { ok: true };
  }

  // Update then insert: members may only update `body`, so a PostgREST upsert
  // (which also sets the key columns) would be rejected.
  const updated = await supabase
    .from("checkins")
    .update({ body })
    .eq("goal_id", goalId)
    .eq("week_start", weekStart)
    .select("goal_id");
  if (updated.error) return { error: friendlyDbError(updated.error) };
  if (updated.data.length === 0) {
    const inserted = await supabase
      .from("checkins")
      .insert({ goal_id: goalId, week_start: weekStart, body });
    if (inserted.error) return { error: friendlyDbError(inserted.error) };
  }
  revalidateGoals();
  return { ok: true };
}

export async function finishGoalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = goalIdSchema.safeParse(fields(formData, "goalId"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { member, supabase } = await actionContext();
  const { data, error } = await supabase
    .from("goals")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", parsed.data.goalId)
    .eq("user_id", member.id)
    .is("finished_at", null)
    .select("id");
  if (error) return { error: friendlyDbError(error) };
  if (data.length === 0) return { error: "That goal was not found." };
  revalidateGoals();
  return { ok: true };
}

export async function dropGoalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = goalIdSchema.safeParse(fields(formData, "goalId"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { member, supabase } = await actionContext();
  const { data, error } = await supabase
    .from("goals")
    .delete()
    .eq("id", parsed.data.goalId)
    .eq("user_id", member.id)
    .select("id");
  if (error) return { error: friendlyDbError(error) };
  if (data.length === 0) return { error: "That goal was not found." };
  revalidateGoals();
  return { ok: true };
}
