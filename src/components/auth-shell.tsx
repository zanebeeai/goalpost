import { Brand } from "@/components/brand";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="paper-grid grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Brand className="mb-10" />
          <Card className="p-6 sm:p-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>
            <div className="mt-7">{children}</div>
          </Card>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-[var(--forest-950)] p-14 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -top-32 -right-32 size-[30rem] rounded-full border border-white/10" />
        <div className="absolute -top-20 -right-20 size-[22rem] rounded-full border border-white/10" />
        <blockquote className="font-display relative max-w-lg text-4xl leading-tight font-medium">
          “The best time to remember why you started is while you are still
          building.”
        </blockquote>
        <p className="relative mt-6 text-sm text-white/55">
          Your ideas stay private. Your goals become a public history.
        </p>
      </aside>
    </main>
  );
}
