"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { normalizeTags, parseRichText } from "@/lib/rich-text";
import { createClient } from "@/lib/supabase/server";
import { firstIssue } from "@/lib/validation";

export type ActionState = { ok?: boolean; error?: string };

export async function createListAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireViewer();
  const parsed = z
    .object({
      title: z.string().trim().min(1).max(120),
      description: z.string().trim().max(1000).optional(),
    })
    .safeParse({
      title: formData.get("title"),
      description: formData.get("description")?.toString(),
    });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_idea_list", {
    p_title: parsed.data.title,
    p_description: parsed.data.description || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/ideas");
  if (typeof data === "string") redirect(`/app/ideas/${data}`);
  return { ok: true };
}

export async function createIdeaAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      listId: z.string().uuid(),
      title: z.string().trim().min(1).max(180),
      content: z.string().optional(),
      tags: z.string().optional(),
    })
    .safeParse({
      listId: formData.get("listId"),
      title: formData.get("title"),
      content: formData.get("content")?.toString(),
      tags: formData.get("tags")?.toString(),
    });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { data: tail } = await supabase
    .from("ideas")
    .select("position")
    .eq("list_id", parsed.data.listId)
    .eq("status", "active")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = Number(tail?.position ?? 0) + 1000;
  const { error } = await supabase.from("ideas").insert({
    list_id: parsed.data.listId,
    title: parsed.data.title,
    content: parseRichText(parsed.data.content ?? null),
    tags: normalizeTags(parsed.data.tags),
    position,
    created_by: viewer.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/app/ideas/${parsed.data.listId}`);
  revalidatePath("/app");
  return { ok: true };
}

export async function updateIdeaAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireViewer();
  const parsed = z
    .object({
      id: z.string().uuid(),
      listId: z.string().uuid(),
      title: z.string().trim().min(1).max(180),
      content: z.string(),
      tags: z.string().optional(),
    })
    .safeParse({
      id: formData.get("id"),
      listId: formData.get("listId"),
      title: formData.get("title"),
      content: formData.get("content"),
      tags: formData.get("tags")?.toString(),
    });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas")
    .update({
      title: parsed.data.title,
      content: parseRichText(parsed.data.content),
      tags: normalizeTags(parsed.data.tags),
    })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };
  revalidatePath(`/app/ideas/${parsed.data.listId}`);
  return { ok: true };
}

export async function setIdeaStatusAction(formData: FormData) {
  await requireViewer();
  const parsed = z
    .object({
      id: z.string().uuid(),
      listId: z.string().uuid(),
      status: z.enum(["active", "archived", "done"]),
    })
    .parse({
      id: formData.get("id"),
      listId: formData.get("listId"),
      status: formData.get("status"),
    });
  const now = new Date().toISOString();
  const supabase = await createClient();
  await supabase
    .from("ideas")
    .update({
      status: parsed.status,
      archived_at: parsed.status === "archived" ? now : null,
      completed_at: parsed.status === "done" ? now : null,
    })
    .eq("id", parsed.id);
  revalidatePath(`/app/ideas/${parsed.listId}`);
  revalidatePath("/app/archive");
  revalidatePath("/app/done");
}

export async function reorderIdeasAction(orderedIds: string[], listId: string) {
  await requireViewer();
  const ids = z.array(z.string().uuid()).max(500).parse(orderedIds);
  z.string().uuid().parse(listId);
  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("ideas")
        .update({ position: (index + 1) * 1000 })
        .eq("id", id)
        .eq("list_id", listId),
    ),
  );
  const failure = results.find((result) => result.error);
  if (failure?.error) throw new Error(failure.error.message);
  revalidatePath(`/app/ideas/${listId}`);
}

export async function promoteIdeaAction(formData: FormData) {
  await requireViewer();
  const ideaId = z.string().uuid().parse(formData.get("ideaId"));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("promote_idea", {
    p_idea_id: ideaId,
  });
  if (error) throw new Error(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.public_id)
    throw new Error("Goalpost was created without a public address");
  revalidatePath("/app/ideas");
  revalidatePath("/app/tree");
  redirect(`/g/${result.public_id}`);
}

export async function addChecklistItemAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      ideaId: z.string().uuid(),
      listId: z.string().uuid(),
      title: z.string().trim().min(1).max(240),
      checklistId: z.string().uuid().optional(),
    })
    .parse({
      ideaId: formData.get("ideaId"),
      listId: formData.get("listId"),
      title: formData.get("title"),
      checklistId: formData.get("checklistId")?.toString() || undefined,
    });
  const supabase = await createClient();
  let checklistId = parsed.checklistId;
  if (!checklistId) {
    const { data, error } = await supabase
      .from("checklists")
      .insert({ idea_id: parsed.ideaId, title: "Checklist" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    checklistId = data.id;
  }
  const { error } = await supabase.from("checklist_items").insert({
    checklist_id: checklistId,
    title: parsed.title,
    created_by: viewer.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/ideas/${parsed.listId}`);
}

export async function toggleChecklistItemAction(formData: FormData) {
  await requireViewer();
  const parsed = z
    .object({
      itemId: z.string().uuid(),
      listId: z.string().uuid(),
      completed: z.enum(["true", "false"]),
    })
    .parse({
      itemId: formData.get("itemId"),
      listId: formData.get("listId"),
      completed: formData.get("completed"),
    });
  const supabase = await createClient();
  await supabase
    .from("checklist_items")
    .update({
      completed_at:
        parsed.completed === "true" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.itemId);
  revalidatePath(`/app/ideas/${parsed.listId}`);
}
