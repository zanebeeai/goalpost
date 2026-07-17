import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";

export async function SiteHeader() {
  const viewer = await getViewer();
  return (
    <header className="relative z-20 border-b border-[var(--line)]/70 bg-[var(--cream-50)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav
          className="hidden items-center gap-7 text-sm font-semibold text-[var(--forest-800)] md:flex"
          aria-label="Main navigation"
        >
          <Link
            href="/#how-it-works"
            className="hover:text-[var(--forest-950)]"
          >
            How it works
          </Link>
          <Link
            href="/#public-trees"
            className="hover:text-[var(--forest-950)]"
          >
            Public trees
          </Link>
          <Link
            href="/legal/community"
            className="hover:text-[var(--forest-950)]"
          >
            Community
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {viewer ? (
            <Button asChild size="sm">
              <Link href="/app">
                Open Goalpost <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">
                  Start growing <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
