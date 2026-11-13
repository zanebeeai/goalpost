import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "Privacy",
  robots: { index: true, follow: true },
};

const SECTIONS = [
  {
    title: "What we store",
    body: [
      "Your email address, and your password stored as a secure hash (or your Google sign-in, if you use that).",
      "The name you choose, your timezone, and whether you want email reminders.",
      "What you write: topics, notes, questions, takeaways, goals and check-ins.",
    ],
  },
  {
    title: "Who can see it",
    body: [
      "Only the members of your space, the people who joined through your invite link. Nothing you write is ever public, and there are no public profiles.",
      "Questions written for you stay hidden from you until Friday of that week.",
    ],
  },
  {
    title: "What we don't do",
    body: [
      "No ads, no tracking scripts, no selling or sharing your data.",
      "When you tap a share button, your phone shares only the text you see.",
    ],
  },
  {
    title: "Deleting your account",
    body: [
      "Go to Settings and choose Delete account. Your account and everything you wrote is removed right away.",
      "Topic ideas you added to your space's shared Up next list stay for the others, without your name.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main
      id="content"
      tabIndex={-1}
      className="mx-auto w-full max-w-2xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-16 md:px-8"
    >
      <header className="flex h-12 items-center">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg">
          <Brand />
        </Link>
      </header>
      <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight text-forest-900">
        Privacy
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        Goalpost is a private space for a few friends. Here is everything it
        keeps, in plain words.
      </p>
      <div className="mt-10 space-y-9">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl font-semibold text-forest-900">
              {section.title}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {section.body.map((line) => (
                <li
                  key={line}
                  className="relative pl-5 text-[16px] leading-relaxed text-ink before:absolute before:top-[0.7em] before:left-0 before:size-1.5 before:rounded-full before:bg-moss-400"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
