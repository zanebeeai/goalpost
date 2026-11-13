"use client";

import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { pickTopicAction } from "@/app/actions/week";
import { ActionForm, SubmitButton } from "@/components/action-form";

/** Picks an Up next topic for this week, then goes to This week. */
export function PickForWeek({ topicId }: { topicId: string }) {
  const router = useRouter();
  // Navigate from the action itself: revalidation removes this item from the
  // list, so an effect in this component would unmount before it runs.
  async function pickAndGo(prev: ActionState, formData: FormData) {
    const result = await pickTopicAction(prev, formData);
    if (result.ok) router.push("/app");
    return result;
  }
  return (
    <ActionForm action={pickAndGo}>
      <input type="hidden" name="topicId" value={topicId} />
      <SubmitButton variant="soft" size="sm" pendingLabel="Picking">
        Pick for this week
      </SubmitButton>
    </ActionForm>
  );
}
