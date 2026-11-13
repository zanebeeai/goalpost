import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-3xl border border-line bg-card p-5 shadow-[0_1px_2px_rgb(31_43_36/0.04),0_8px_24px_-12px_rgb(31_43_36/0.08)] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

/** Small uppercase label that sits above a card title. */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-xs font-bold tracking-[0.12em] text-forest-500 uppercase",
        className,
      )}
      {...props}
    />
  );
}
