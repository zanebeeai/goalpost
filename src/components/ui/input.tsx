"use client";

import type { ComponentProps } from "react";
import { useFieldErrorProps } from "@/components/action-form";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-xl border border-line bg-white/70 px-3.5 text-base text-ink placeholder:text-muted/70 transition-colors outline-none hover:border-moss-400 focus:border-forest-500 focus:bg-white focus:ring-3 focus:ring-moss-100 disabled:opacity-60 aria-invalid:border-clay-ink";

export function Input({ className, ...props }: ComponentProps<"input">) {
  const errorProps = useFieldErrorProps(props.name);
  return (
    <input
      className={cn(fieldBase, "h-12", className)}
      {...errorProps}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  const errorProps = useFieldErrorProps(props.name);
  return (
    <textarea
      className={cn(
        fieldBase,
        "field-sizing-content min-h-32 resize-y py-3 leading-relaxed",
        className,
      )}
      {...errorProps}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("block text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}
