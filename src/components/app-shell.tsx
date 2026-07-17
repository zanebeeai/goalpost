import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { AppNav, MobileNav } from "@/components/app-nav";
import { Avatar } from "@/components/ui/avatar";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export function AppShell({
  children,
  profile,
  avatarUrl,
  unread = 0,
}: {
  children: React.ReactNode;
  profile: { id: string; username: string; display_name: string };
  avatarUrl: string | null;
  unread?: number;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r bg-[var(--white)]/90 p-4 backdrop-blur lg:flex">
        <Brand className="mx-2 mt-2 mb-7" />
        <AppNav unread={unread} />
        <div className="mt-auto border-t pt-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={profile.display_name} src={avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {profile.display_name}
              </p>
              <Link
                href={`/u/${profile.username}`}
                className="truncate text-xs text-[var(--muted)]"
              >
                @{profile.username}
              </Link>
            </div>
            <Button asChild variant="ghost" size="icon" className="size-8">
              <Link href="/app/settings" aria-label="Settings">
                <Settings className="size-4" />
              </Link>
            </Button>
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start"
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </form>
        </div>
      </aside>
      <div className="lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-[var(--cream-50)]/90 px-5 backdrop-blur lg:hidden">
          <Brand />
          <Avatar name={profile.display_name} src={avatarUrl} />
        </header>
        <main className="mx-auto max-w-[1500px] px-5 pt-8 pb-28 sm:px-8 lg:px-10 lg:pt-10 lg:pb-16">
          {children}
        </main>
      </div>
      <MobileNav unread={unread} />
      <RealtimeRefresh topics={[`user:${profile.id}`]} />
    </div>
  );
}
