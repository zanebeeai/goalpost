import {
  CalendarClock,
  Check,
  CircleDotDashed,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const nodes = [
  {
    title: "Build a reading nook",
    date: "Today",
    status: "active",
    icon: CircleDotDashed,
    side: "right",
  },
  {
    title: "Order the oak shelves",
    date: "Arrives Friday",
    status: "waiting",
    icon: PackageOpen,
    side: "left",
  },
  {
    title: "Sketch the layout",
    date: "May 12",
    status: "done",
    icon: Check,
    side: "right",
  },
];

export function LandingTree() {
  return (
    <div
      className="relative mx-auto min-h-[470px] max-w-xl"
      aria-label="Example goalpost tree"
    >
      <svg
        className="absolute top-5 left-1/2 h-[430px] w-24 -translate-x-1/2 text-[var(--moss-400)]"
        viewBox="0 0 96 430"
        fill="none"
        aria-hidden
      >
        <path
          d="M50 425C43 350 59 320 48 250C41 198 56 154 48 14"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M48 294C35 270 23 260 8 253"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M48 177C61 153 74 145 89 140"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M48 70C35 51 24 47 12 45"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <article
            key={node.title}
            className={`grow-in absolute w-[min(74%,280px)] rounded-2xl border bg-[var(--white)] p-4 shadow-[var(--shadow-soft)] ${
              node.side === "left" ? "left-0" : "right-0"
            }`}
            style={{
              bottom: 45 + index * 132,
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--moss-200)] text-[var(--forest-800)]">
                <Icon className="size-4" />
              </span>
              <Badge
                className={
                  node.status === "done"
                    ? "bg-amber-100 text-amber-800"
                    : node.status === "waiting"
                      ? "bg-[var(--clay-200)] text-[var(--clay-600)]"
                      : ""
                }
              >
                {node.status}
              </Badge>
            </div>
            <h3 className="font-display text-lg font-semibold">{node.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <CalendarClock className="size-3.5" />
              {node.date}
            </p>
          </article>
        );
      })}
      <div className="absolute top-0 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[var(--forest-900)] px-3 py-1.5 text-xs font-bold text-white shadow-lg">
        <Sparkles className="size-3.5" /> Growing now
      </div>
    </div>
  );
}
