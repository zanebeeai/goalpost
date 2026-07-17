"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <AlertTriangle className="size-9 text-[var(--clay-600)]" />
      <h1 className="font-display mt-4 text-3xl font-semibold">
        Something got tangled.
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
        The error was recorded. Try this step again; your existing work is still
        safe.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
