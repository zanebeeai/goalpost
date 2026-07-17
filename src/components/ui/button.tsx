import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--forest-900)] px-5 py-2.5 text-white shadow-sm hover:bg-[var(--forest-800)]",
        secondary:
          "border border-[var(--line)] bg-[var(--white)] px-5 py-2.5 text-[var(--forest-900)] hover:border-[var(--moss-400)] hover:bg-white",
        ghost: "px-3 py-2 text-[var(--forest-800)] hover:bg-[var(--cream-100)]",
        danger: "bg-red-700 px-5 py-2.5 text-white hover:bg-red-800",
      },
      size: {
        sm: "min-h-9 px-3 py-1.5 text-xs",
        md: "min-h-11",
        lg: "min-h-12 px-6 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
