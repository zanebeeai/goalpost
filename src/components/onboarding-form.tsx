"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, Globe2, LoaderCircle, LockKeyhole } from "lucide-react";
import { completeOnboardingAction } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OnboardingForm({ suggestedName }: { suggestedName: string }) {
  const [state, action, pending] = useActionState(completeOnboardingAction, {});
  const timezoneRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (timezoneRef.current)
      timezoneRef.current.value =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }, []);
  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-semibold">
        Display name
        <Input
          name="displayName"
          className="mt-1.5"
          defaultValue={suggestedName}
          maxLength={80}
          required
        />
      </label>
      <label className="block text-sm font-semibold">
        Username
        <div className="relative mt-1.5">
          <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-[var(--muted)]">
            goalpost.app/u/
          </span>
          <Input
            name="username"
            className="pl-[8.3rem]"
            pattern="[a-z0-9_]{3,30}"
            minLength={3}
            maxLength={30}
            autoCapitalize="none"
            required
          />
        </div>
        <span className="mt-1.5 block text-xs font-normal text-[var(--muted)]">
          Permanent during beta. Lowercase letters, numbers, and underscores.
        </span>
      </label>
      <input
        ref={timezoneRef}
        type="hidden"
        name="timezone"
        defaultValue="UTC"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-[var(--cream-50)] p-4">
          <LockKeyhole className="mb-3 size-5 text-[var(--forest-700)]" />
          <h3 className="text-sm font-bold">Ideas stay private</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Only you and invited list members can see idea cards.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--clay-200)] bg-orange-50 p-4">
          <Globe2 className="mb-3 size-5 text-[var(--clay-600)]" />
          <h3 className="text-sm font-bold">Goals are public</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Promoted goals and everything inside them are visible on the open
            web.
          </p>
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm">
        <input
          type="checkbox"
          name="publicAcknowledgement"
          className="mt-1 size-4 accent-[var(--forest-800)]"
          required
        />
        <span>
          I understand that goalposts, updates, tasks, events, attachments,
          collaborators, and permitted comments are public.
        </span>
      </label>
      {state.error ? (
        <p
          role="alert"
          className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"
        >
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Create my Goalpost
      </Button>
    </form>
  );
}
