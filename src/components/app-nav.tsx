"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Bell,
  CalendarDays,
  CheckCircle2,
  LayoutList,
  Search,
  Sprout,
  TreePine,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Home", icon: Sprout, exact: true },
  { href: "/app/ideas", label: "Ideas", icon: LayoutList },
  { href: "/app/tree", label: "My tree", icon: TreePine },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/archive", label: "Archive", icon: Archive },
  { href: "/app/done", label: "Done", icon: CheckCircle2 },
  { href: "/app/inbox", label: "Inbox", icon: Bell },
  { href: "/app/friends", label: "Friends", icon: Users },
  { href: "/app/search", label: "Search", icon: Search },
];

export function AppNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1" aria-label="Workspace">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "focus-ring flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--cream-100)] hover:text-[var(--forest-900)]",
              active && "bg-[var(--moss-200)] text-[var(--forest-950)]",
            )}
          >
            <Icon className="size-4.5" />
            <span>{label}</span>
            {label === "Inbox" && unread > 0 ? (
              <span className="ml-auto rounded-full bg-[var(--clay-500)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const mobileItems = [items[0]!, items[1]!, items[2]!, items[3]!, items[6]!];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-[var(--white)]/95 px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      aria-label="Mobile workspace"
    >
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-semibold text-[var(--muted)]",
              active && "text-[var(--forest-900)]",
            )}
          >
            <Icon className="size-5" />
            {item.label}
            {item.label === "Inbox" && unread > 0 ? (
              <span className="absolute top-0 right-[28%] size-2 rounded-full bg-[var(--clay-500)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
