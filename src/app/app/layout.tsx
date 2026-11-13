import { AppNav } from "@/components/app-nav";
import { requireMember } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMember();
  return (
    <div className="min-h-dvh">
      <AppNav />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto w-full max-w-2xl px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-10 md:pb-16 lg:max-w-5xl"
      >
        {children}
      </main>
    </div>
  );
}
