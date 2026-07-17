"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { validateUpload } from "@/lib/file-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(formData: FormData) {
  const viewer = await requireViewer();
  const parsed = z
    .object({
      displayName: z.string().trim().min(1).max(80),
      bio: z.string().trim().max(500),
      timezone: z.string().trim().min(1).max(64),
      emailReminders: z.boolean(),
    })
    .parse({
      displayName: formData.get("displayName"),
      bio: formData.get("bio"),
      timezone: formData.get("timezone"),
      emailReminders: formData.get("emailReminders") === "on",
    });
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.displayName,
      bio: parsed.bio || null,
      timezone: parsed.timezone,
      email_reminders_enabled: parsed.emailReminders,
    })
    .eq("id", viewer.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings");
  revalidatePath("/app", "layout");
}

export async function uploadAvatarAction(formData: FormData) {
  const viewer = await requireViewer();
  const file = formData.get("avatar");
  if (!(file instanceof File)) throw new Error("Select an image");
  const validated = await validateUpload(file);
  if (validated.kind !== "image") throw new Error("Avatars must be images");
  const path = `${viewer.id}/avatars/${crypto.randomUUID()}-${validated.safeName}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("goalpost-media")
    .upload(path, file, { contentType: validated.mimeType, upsert: false });
  if (uploadError) throw new Error(uploadError.message);
  const { data: old } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", viewer.id)
    .single();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", viewer.id);
  if (error) {
    await supabase.storage.from("goalpost-media").remove([path]);
    throw new Error(error.message);
  }
  if (old?.avatar_path)
    await supabase.storage.from("goalpost-media").remove([old.avatar_path]);
  revalidatePath("/app", "layout");
}

export async function deleteAccountAction(formData: FormData) {
  const viewer = await requireViewer();
  const confirmation = z
    .literal("DELETE MY ACCOUNT")
    .parse(formData.get("confirmation"));
  if (!confirmation) throw new Error("Confirmation required");
  const supabase = await createClient();
  const { error } = await supabase.rpc("prepare_account_deletion");
  if (error) throw new Error(error.message);
  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(viewer.id);
  if (deleteError) throw new Error(deleteError.message);
  redirect("/?account=deleted");
}
