import Link from "next/link";
import { Signpost } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Signpost className="mb-5 size-10 text-[var(--moss-600)]" />
      <h1 className="font-display text-4xl font-semibold">
        This path does not grow here.
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        The page may have moved, or the link is no longer active.
      </p>
      <Button asChild className="mt-7">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}
