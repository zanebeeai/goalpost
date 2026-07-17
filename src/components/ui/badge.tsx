import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--cream-100)] px-2.5 py-1 text-xs font-semibold text-[var(--forest-700)]",
        className,
      )}
      {...props}
    />
  );
}
