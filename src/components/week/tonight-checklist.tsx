import { Circle, CircleCheck } from "lucide-react";
import { phaseOf } from "@/lib/week";
import { cn } from "@/lib/utils";
import type { TonightItem } from "./tonight";

/** Friday and Saturday: what is left for me, each a link to its section. */
export function TonightChecklist({
  items,
  today,
}: {
  items: TonightItem[];
  today: string;
}) {
  if (items.length === 0) return null;
  const title =
    phaseOf(today) === "interview" ? "Tonight" : "Before the week ends";

  return (
    <nav
      aria-labelledby="tonight-heading"
      className="mt-5 max-w-sm rounded-2xl border border-line bg-card/70 px-2 py-2"
    >
      <h2
        id="tonight-heading"
        className="px-2 pt-1 text-xs font-bold tracking-[0.12em] text-forest-500 uppercase"
      >
        {title}
      </h2>
      <ul className="mt-1">
        {items.map((item) => (
          <li key={item.key}>
            <a
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 hover:bg-moss-100/40"
            >
              {item.done ? (
                <CircleCheck
                  aria-hidden
                  className="size-5 shrink-0 text-forest-500"
                />
              ) : (
                <Circle aria-hidden className="size-5 shrink-0 text-moss-400" />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 text-[15px] font-semibold",
                  item.done
                    ? "text-muted line-through decoration-moss-400"
                    : "text-forest-900",
                )}
              >
                {item.label}
                {item.done ? <span className="sr-only"> (done)</span> : null}
              </span>
              {item.progress ? (
                <span className="shrink-0 text-sm text-muted tabular-nums">
                  {item.progress}
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
