import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: { absolute: "Goalpost" },
  robots: { index: true, follow: true },
};

const STEPS = [
  {
    day: "Sunday",
    title: "Pick",
    body: "Choose one thing to learn this week.",
  },
  { day: "Mon – Thu", title: "Learn", body: "Drop notes and links as you go." },
  {
    day: "Friday",
    title: "Interview",
    body: "Ask each other questions about it.",
  },
];

export default async function LandingPage() {
  if (await getViewer()) redirect("/app");

  return (
    <main
      id="content"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8"
    >
      <header className="flex h-12 items-center justify-between">
        <Brand />
        <Link
          href="/auth/login"
          className="hidden h-11 items-center rounded-full px-4 text-[15px] font-semibold text-forest-700 hover:bg-moss-100/60 md:inline-flex"
        >
          Log in
        </Link>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-7 py-6 md:grid md:grid-cols-[1.15fr_1fr] md:items-center md:gap-16">
        <div>
          <h1 className="font-display text-[2.6rem] leading-[1.04] font-semibold tracking-tight text-balance text-forest-900 sm:text-6xl">
            Pick something to learn every Sunday.{" "}
            <span className="text-moss-600">
              Get interviewed about it on Friday.
            </span>
          </h1>
          <div className="mt-8 hidden gap-3 md:flex">
            <Button asChild size="lg">
              <Link href="/auth/signup">Sign up</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/auth/login">Log in</Link>
            </Button>
          </div>
        </div>

        <ol className="relative space-y-2.5">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex items-start gap-4 rounded-2xl border border-line bg-card px-4 py-3.5 shadow-[0_1px_2px_rgb(31_43_36/0.04)]"
            >
              <span
                aria-hidden
                className={
                  index === 2
                    ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-clay-ink text-sm font-bold text-cream"
                    : "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-moss-100 text-sm font-bold text-forest-900"
                }
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.12em] text-forest-500 uppercase">
                  {step.day}
                </p>
                <p className="mt-0.5 font-display text-lg font-semibold text-forest-900">
                  {step.title}
                </p>
                <p className="text-[15px] leading-snug text-muted">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-3 md:hidden">
        <Button asChild size="lg" variant="secondary" className="w-full">
          <Link href="/auth/login">Log in</Link>
        </Button>
        <Button asChild size="lg" className="w-full">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
      </div>

      <footer className="mt-6 text-center text-sm text-muted md:text-left">
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center rounded underline-offset-2 hover:text-ink hover:underline"
        >
          Privacy
        </Link>
      </footer>
    </main>
  );
}
