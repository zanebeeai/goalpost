import Image from "next/image";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--moss-200)] text-xs font-bold text-[var(--forest-800)] ring-2 ring-white",
        className,
      )}
      aria-label={name}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
