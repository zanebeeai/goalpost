import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[1.4rem] border border-[var(--line)] bg-[var(--white)] shadow-[0_8px_30px_rgba(32,58,45,0.06)]",
          className,
        )}
        {...props}
      />
    );
  },
);
