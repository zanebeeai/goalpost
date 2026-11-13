import { cn } from "@/lib/utils";

/** The goalpost mark: crossbar, two uprights and a post. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--forest-900)" />
      <path
        d="M9.5 7.5v9.5h13V7.5M16 17v8"
        fill="none"
        stroke="var(--cream)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="11" r="2.2" fill="var(--clay)" />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="font-display text-xl font-semibold tracking-tight text-forest-900">
        Goalpost
      </span>
    </span>
  );
}
