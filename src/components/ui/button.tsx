import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-forest-900 text-cream shadow-[0_1px_0_rgb(0_0_0/0.06)] hover:bg-forest-700 active:bg-forest-700",
        secondary:
          "border border-line bg-card text-ink hover:border-moss-400 hover:bg-white active:bg-moss-100/40",
        soft: "bg-moss-100/70 text-forest-900 hover:bg-moss-100 active:bg-moss-100",
        ghost: "text-muted hover:bg-moss-100/50 hover:text-ink",
        danger: "bg-clay-ink text-cream hover:bg-[#843d24]",
      },
      size: {
        md: "h-11 px-4 text-[15px]",
        lg: "h-12 px-5 text-base",
        sm: "h-11 px-3.5 text-sm",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild,
  type = "button",
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
