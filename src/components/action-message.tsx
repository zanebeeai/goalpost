import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ActionState } from "@/app/actions/ideas";

export function ActionMessage({
  state,
  success = "Saved",
}: {
  state: ActionState;
  success?: string;
}) {
  if (state.error)
    return (
      <p
        role="alert"
        className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"
      >
        <AlertCircle className="size-4" />
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
      >
        <CheckCircle2 className="size-4" />
        {success}
      </p>
    );
  return null;
}
