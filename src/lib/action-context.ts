import { requireMember, type Member } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayIn, weekStartOf } from "@/lib/week";

/**
 * Signed-in member, their RLS-scoped client, and the current week computed on
 * the server from the space timezone. Redirects when signed out or not set up.
 */
export async function actionContext(): Promise<{
  member: Member;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
  weekStart: string;
}> {
  const member = await requireMember();
  const supabase = await createClient();
  const today = todayIn(member.space.timezone);
  return { member, supabase, today, weekStart: weekStartOf(today) };
}
