import Link from "next/link";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-ring inline-flex items-center gap-2 rounded-lg",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-[var(--forest-900)] text-white">
        <Sprout className="size-5" aria-hidden />
      </span>
      {!compact ? (
        <span className="font-display text-xl font-semibold tracking-tight">
          Goalpost
        </span>
      ) : null}
    </Link>
  );
}
