import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";

const documents = {
  terms: {
    title: "Terms of Use",
    sections: [
      [
        "Using Goalpost",
        "You must be at least 13 years old and provide accurate account information. You are responsible for activity performed through your account.",
      ],
      [
        "Public content",
        "Goalposts, their updates, tasks, events, comments, collaborators, and attachments are intentionally public. Do not publish private, confidential, or regulated information.",
      ],
      [
        "Your content",
        "You retain ownership of your content and grant Goalpost permission to store, process, and display it as needed to operate the service.",
      ],
      [
        "Shared work",
        "Collaborators may change shared goals. When an account is deleted, administration may transfer and retained shared contributions may be anonymized.",
      ],
      [
        "Beta service",
        "Goalpost is a beta and may change. We work to protect data but cannot guarantee uninterrupted availability.",
      ],
    ],
  },
  privacy: {
    title: "Privacy Notice",
    sections: [
      [
        "What we collect",
        "We collect account details, profile information, content you create, collaboration records, notification settings, and basic security and diagnostic logs.",
      ],
      [
        "What is public",
        "Profile names, usernames, avatars, biographies, goal trees, goal content, collaborators, and permitted comments can be viewed without an account and indexed by search engines.",
      ],
      [
        "What remains private",
        "Email addresses, authentication information, idea lists, reminders, notifications, blocks, and moderation reports are restricted.",
      ],
      [
        "Service providers",
        "Supabase hosts authentication, database, and files; Vercel hosts the app; Resend sends reminders; Cloudflare provides abuse protection and encrypted backup storage; Sentry records errors.",
      ],
      [
        "Your choices",
        "You may update your profile, disable reminder emails, or delete your account in Settings. Backups age out within 30 days.",
      ],
    ],
  },
  community: {
    title: "Community Guidelines",
    sections: [
      [
        "Build in good faith",
        "Goalpost is for sharing progress and encouraging people you know—not harassment, manipulation, or unsolicited promotion.",
      ],
      [
        "Keep it safe",
        "Do not publish threats, sexual exploitation, private information, malware, or instructions intended to cause serious harm.",
      ],
      [
        "Respect ownership",
        "Only upload material you have the right to share. Attribute collaborators honestly and do not impersonate others.",
      ],
      [
        "Use the controls",
        "Block people who should not contact you and report public content that breaks these guidelines. Blocking cannot hide content that is public on the web.",
      ],
      [
        "Enforcement",
        "We may hide content, limit features, or suspend accounts to protect the service. Beta moderation decisions are reviewed by the Goalpost administrator.",
      ],
    ],
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ document: string }>;
}): Promise<Metadata> {
  const { document } = await params;
  const item = documents[document as keyof typeof documents];
  return item ? { title: item.title } : {};
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  const item = documents[document as keyof typeof documents];
  if (!item) notFound();
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <Brand />
      <article className="mt-14">
        <p className="text-xs font-bold tracking-[.2em] text-[var(--clay-600)] uppercase">
          Last updated July 17, 2026
        </p>
        <h1 className="font-display mt-3 text-5xl font-semibold">
          {item.title}
        </h1>
        <div className="mt-10 space-y-9">
          {item.sections.map(([title, copy]) => (
            <section key={title}>
              <h2 className="font-display text-2xl font-semibold">{title}</h2>
              <p className="mt-2 leading-8 text-[var(--muted)]">{copy}</p>
            </section>
          ))}
        </div>
      </article>
      <p className="mt-16 border-t pt-7 text-sm text-[var(--muted)]">
        <Link href="/" className="font-semibold text-[var(--forest-700)]">
          ← Back to Goalpost
        </Link>
      </p>
    </main>
  );
}
