"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ListPlus, Settings } from "lucide-react";
import { Brand, BrandMark } from "@/components/brand";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app", label: "This week", icon: CalendarDays },
  { href: "/app/next", label: "Up next", icon: ListPlus },
  { href: "/app/history", label: "History", icon: BookOpen },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function AppNav() {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/app/settings");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 md:h-16 md:px-6">
          <Link
            href="/app"
            className="-mx-1 flex min-h-11 items-center gap-2 rounded-lg px-1"
            aria-label="Goalpost, this week"
          >
            <BrandMark className="size-7 md:hidden" />
            <span className="font-display text-lg font-semibold tracking-tight text-forest-900 md:hidden">
              Goalpost
            </span>
            <Brand className="hidden md:inline-flex" />
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {TABS.map((tab) => {
                const active = isActive(pathname, tab.href);
                return (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex h-11 items-center rounded-full px-4 text-[15px] font-semibold transition-colors",
                        active
                          ? "bg-forest-900 text-cream"
                          : "text-muted hover:bg-moss-100/60 hover:text-ink",
                      )}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Link
            href="/app/settings"
            aria-label="Settings"
            aria-current={settingsActive ? "page" : undefined}
            className={cn(
              "-mr-2 inline-flex size-11 items-center justify-center rounded-full transition-colors",
              settingsActive
                ? "bg-moss-100 text-forest-900"
                : "text-muted hover:bg-moss-100/60 hover:text-ink",
            )}
          >
            <Settings className="size-[22px]" aria-hidden />
          </Link>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-cream/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors",
                    active ? "text-forest-900" : "text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-moss-100",
                    )}
                  >
                    <Icon
                      className="size-[20px]"
                      strokeWidth={active ? 2.4 : 2}
                      aria-hidden
                    />
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
