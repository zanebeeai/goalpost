import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="content"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center"
    >
      <BrandMark className="size-12" />
      <h1 className="mt-6 font-display text-3xl font-semibold text-forest-900">
        Nothing here
      </h1>
      <p className="mt-2 text-muted">That page doesn&apos;t exist.</p>
      <Button asChild className="mt-8">
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
