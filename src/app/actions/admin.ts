"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user?.app_metadata.role !== "admin")
    throw new Error("Administrator access required");
  return viewer;
}

export async function resolveReportAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      reportId: z.string().uuid(),
      status: z.enum(["resolved", "dismissed"]),
      targetType: z.enum([
        "profile",
        "goalpost",
        "goal_update",
        "comment",
        "attachment",
      ]),
      targetId: z.string().uuid(),
      hide: z.boolean(),
    })
    .parse({
      reportId: formData.get("reportId"),
      status: formData.get("status"),
      targetType: formData.get("targetType"),
      targetId: formData.get("targetId"),
      hide: formData.get("hide") === "true",
    });
  const client = createAdminClient();
  if (parsed.hide && parsed.targetType !== "profile") {
    if (parsed.targetType === "goalpost")
      await client
        .from("goalposts")
        .update({ moderation_state: "hidden" })
        .eq("id", parsed.targetId);
    if (parsed.targetType === "goal_update")
      await client
        .from("goal_updates")
        .update({ moderation_state: "hidden" })
        .eq("id", parsed.targetId);
    if (parsed.targetType === "comment")
      await client
        .from("comments")
        .update({ moderation_state: "hidden" })
        .eq("id", parsed.targetId);
    if (parsed.targetType === "attachment")
      await client
        .from("attachments")
        .update({ moderation_state: "hidden" })
        .eq("id", parsed.targetId);
  }
  await client
    .from("reports")
    .update({
      status: parsed.status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.reportId);
  await client.from("admin_audit_logs").insert({
    admin_id: admin.id,
    action: parsed.hide ? "hide_and_resolve" : parsed.status,
    target_type: parsed.targetType,
    target_id: parsed.targetId,
    details: { report_id: parsed.reportId },
  });
  revalidatePath("/app/admin");
}

export async function suspendAccountAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      userId: z.string().uuid(),
      suspend: z.enum(["true", "false"]),
      reason: z.string().trim().max(500),
    })
    .parse({
      userId: formData.get("userId"),
      suspend: formData.get("suspend"),
      reason: formData.get("reason"),
    });
  const client = createAdminClient();
  const suspended = parsed.suspend === "true";
  await client.from("account_moderation").upsert({
    user_id: parsed.userId,
    is_suspended: suspended,
    suspended_reason: suspended ? parsed.reason : null,
    suspended_at: suspended ? new Date().toISOString() : null,
  });
  await client.from("admin_audit_logs").insert({
    admin_id: admin.id,
    action: suspended ? "suspend_account" : "restore_account",
    target_type: "profile",
    target_id: parsed.userId,
    details: { reason: parsed.reason },
  });
  revalidatePath("/app/admin");
}
