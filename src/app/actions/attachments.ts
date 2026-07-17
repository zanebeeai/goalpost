"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { validateUpload } from "@/lib/file-validation";
import { createClient } from "@/lib/supabase/server";

const parentSchema = z
  .object({
    ideaId: z.string().uuid().optional(),
    goalpostId: z.string().uuid().optional(),
    goalUpdateId: z.string().uuid().optional(),
  })
  .refine(
    (value) =>
      [value.ideaId, value.goalpostId, value.goalUpdateId].filter(Boolean)
        .length === 1,
    "Choose one attachment parent",
  );

export async function uploadAttachmentAction(formData: FormData) {
  const viewer = await requireViewer();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Select a file to upload");
  const parent = parentSchema.parse({
    ideaId: formData.get("ideaId")?.toString() || undefined,
    goalpostId: formData.get("goalpostId")?.toString() || undefined,
    goalUpdateId: formData.get("goalUpdateId")?.toString() || undefined,
  });
  const revalidate = z
    .string()
    .startsWith("/")
    .parse(formData.get("revalidate"));
  const validated = await validateUpload(file);
  const storagePath = `${viewer.id}/${crypto.randomUUID()}/${validated.safeName}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("goalpost-media")
    .upload(storagePath, file, {
      contentType: validated.mimeType,
      upsert: false,
      cacheControl: "31536000",
    });
  if (uploadError) throw new Error(uploadError.message);
  const { error: recordError } = await supabase.from("attachments").insert({
    idea_id: parent.ideaId ?? null,
    goalpost_id: parent.goalpostId ?? null,
    goal_update_id: parent.goalUpdateId ?? null,
    kind: validated.kind,
    title: file.name.slice(0, 240),
    storage_path: storagePath,
    mime_type: validated.mimeType,
    byte_size: file.size,
    uploaded_by: viewer.id,
  });
  if (recordError) {
    await supabase.storage.from("goalpost-media").remove([storagePath]);
    throw new Error(recordError.message);
  }
  revalidatePath(revalidate);
}

export async function addLinkAttachmentAction(formData: FormData) {
  const viewer = await requireViewer();
  const parent = parentSchema.parse({
    ideaId: formData.get("ideaId")?.toString() || undefined,
    goalpostId: formData.get("goalpostId")?.toString() || undefined,
    goalUpdateId: formData.get("goalUpdateId")?.toString() || undefined,
  });
  const parsed = z
    .object({
      title: z.string().trim().min(1).max(240),
      url: z
        .string()
        .url()
        .max(2000)
        .refine(
          (url) => ["http:", "https:"].includes(new URL(url).protocol),
          "Only HTTP and HTTPS links are allowed",
        ),
      revalidate: z.string().startsWith("/"),
    })
    .parse({
      title: formData.get("title"),
      url: formData.get("url"),
      revalidate: formData.get("revalidate"),
    });
  const supabase = await createClient();
  const { error } = await supabase.from("attachments").insert({
    idea_id: parent.ideaId ?? null,
    goalpost_id: parent.goalpostId ?? null,
    goal_update_id: parent.goalUpdateId ?? null,
    kind: "link",
    title: parsed.title,
    url: parsed.url,
    uploaded_by: viewer.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(parsed.revalidate);
}

export async function deleteAttachmentAction(formData: FormData) {
  await requireViewer();
  const parsed = z
    .object({ id: z.string().uuid(), revalidate: z.string().startsWith("/") })
    .parse({ id: formData.get("id"), revalidate: formData.get("revalidate") });
  const supabase = await createClient();
  const { data } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("id", parsed.id)
    .maybeSingle();
  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", parsed.id);
  if (error) throw new Error(error.message);
  if (data?.storage_path)
    await supabase.storage.from("goalpost-media").remove([data.storage_path]);
  revalidatePath(parsed.revalidate);
}
