import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center border-dashed p-8 text-center">
      <span className="mb-4 rounded-full bg-[var(--moss-200)] p-3 text-[var(--forest-700)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <h2 className="font-display text-xl font-semibold text-[var(--forest-950)]">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
