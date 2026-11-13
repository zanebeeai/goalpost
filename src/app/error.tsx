"use client";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main
      id="content"
      tabIndex={-1}
      className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-6 text-center"
    >
      <BrandMark className="size-12" />
      <h1 className="mt-6 font-display text-3xl font-semibold text-forest-900">
        Something went wrong
      </h1>
      <p className="mt-2 text-muted">
        It&apos;s probably temporary. Try again in a moment.
      </p>
      <Button className="mt-8" onClick={() => unstable_retry()}>
        Try again
      </Button>
    </main>
  );
}
