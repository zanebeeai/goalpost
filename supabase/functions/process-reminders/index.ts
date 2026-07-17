import { createClient } from "npm:@supabase/supabase-js@2";

type Reminder = {
  id: string;
  user_id: string;
  goalpost_id: string;
  remind_at: string;
  send_email: boolean;
  attempt_count: number;
};

const corsHeaders = { "content-type": "application/json" };

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  const expected = Deno.env.get("CRON_SECRET");
  if (
    !expected ||
    request.headers.get("authorization") !== `Bearer ${expected}`
  )
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });

  const url = Deno.env.get("SUPABASE_URL");
  const secret =
    Deno.env.get("SUPABASE_SECRET_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret)
    return new Response(
      JSON.stringify({ error: "Function is not configured" }),
      { status: 500, headers: corsHeaders },
    );
  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("claim_due_reminders", {
    p_limit: 100,
  });
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });

  const reminders = (data ?? []) as Reminder[];
  const results = await Promise.allSettled(
    reminders.map(async (reminder) => {
      try {
        const [{ data: goal }, { data: profile }, userResult] =
          await Promise.all([
            supabase
              .from("goalposts")
              .select("title,public_id")
              .eq("id", reminder.goalpost_id)
              .single(),
            supabase
              .from("profiles")
              .select("display_name,email_reminders_enabled")
              .eq("id", reminder.user_id)
              .single(),
            supabase.auth.admin.getUserById(reminder.user_id),
          ]);
        if (!goal || !profile)
          throw new Error("Reminder subject no longer exists");
        const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";
        const href = `/g/${goal.public_id}`;
        const title = `Reminder: ${goal.title}`;
        await supabase.from("notifications").upsert(
          {
            user_id: reminder.user_id,
            notification_type: "reminder",
            title,
            body: "A reminder you scheduled for this goalpost is due.",
            href,
            source_key: `reminder:${reminder.id}`,
          },
          { onConflict: "source_key" },
        );

        const email = userResult.data.user?.email;
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (
          reminder.send_email &&
          profile.email_reminders_enabled &&
          email &&
          resendKey
        ) {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              authorization: `Bearer ${resendKey}`,
              "content-type": "application/json",
              "idempotency-key": `goalpost-reminder-${reminder.id}`,
            },
            body: JSON.stringify({
              from:
                Deno.env.get("RESEND_FROM") ??
                "Goalpost <reminders@example.com>",
              to: [email],
              subject: title,
              html: `<div style="font-family:system-ui;max-width:560px;margin:auto"><h1 style="color:#203a2d">${escapeHtml(goal.title)}</h1><p>A private reminder you scheduled is due.</p><p><a href="${siteUrl}${href}" style="display:inline-block;background:#203a2d;color:white;padding:12px 18px;border-radius:999px;text-decoration:none">Open goalpost</a></p><p style="color:#647068;font-size:13px">Timeline dates are public. This reminder and its delivery state remain private.</p></div>`,
            }),
          });
          if (!response.ok)
            throw new Error(
              `Resend returned ${response.status}: ${await response.text()}`,
            );
        }
        await supabase
          .from("reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", reminder.id);
        return reminder.id;
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message.slice(0, 2000)
            : "Unknown reminder failure";
        await supabase
          .from("reminders")
          .update({ status: "failed", last_error: message })
          .eq("id", reminder.id);
        throw cause;
      }
    }),
  );

  return new Response(
    JSON.stringify({
      claimed: reminders.length,
      sent: results.filter((item) => item.status === "fulfilled").length,
      failed: results.filter((item) => item.status === "rejected").length,
    }),
    { headers: corsHeaders },
  );
});

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] ?? character,
  );
}
