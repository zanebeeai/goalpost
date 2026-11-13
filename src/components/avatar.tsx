import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  me = false,
  className,
}: {
  name: string;
  me?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
        me ? "bg-forest-900 text-cream" : "bg-moss-100 text-forest-900",
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
