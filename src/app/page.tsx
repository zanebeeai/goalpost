import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ListPlus,
  UsersRound,
} from "lucide-react";
import { LandingTree } from "@/components/landing-tree";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: ListPlus,
    number: "01",
    title: "Catch the idea",
    copy: "Drop a thought into a private list before it gets away. Add context, links, images, documents, and a checklist.",
  },
  {
    icon: UsersRound,
    number: "02",
    title: "Shape it together",
    copy: "Invite people as viewers or editors. Talk through the details without turning Goalpost into another noisy social feed.",
  },
  {
    icon: CheckCircle2,
    number: "03",
    title: "Make it real",
    copy: "Promote the idea into a public goalpost, keep a living record of the work, and let completion become part of your tree.",
  },
];

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <section className="paper-grid overflow-hidden border-b border-[var(--line)]">
        <div className="mx-auto grid min-h-[700px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:py-24">
          <div>
            <Badge className="mb-6 border border-[var(--moss-200)] bg-white/80">
              Ideas are seeds. Progress leaves a record.
            </Badge>
            <h1 className="font-display max-w-3xl text-5xl leading-[1.02] font-semibold tracking-[-0.045em] text-[var(--forest-950)] sm:text-6xl lg:text-7xl">
              A place for the things you{" "}
              <span className="text-[var(--moss-600)] italic">mean</span> to
              make real.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Collect loose ideas in private. Grow the right ones into public
              goals. Keep every update, detour, delivery, and finished thing in
              one living history.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth/signup">
                  Plant your first idea <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="#how-it-works">See how it grows</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[var(--forest-700)]">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[var(--moss-600)]" />
                Private idea lists
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[var(--moss-600)]" />
                Public progress tree
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[var(--moss-600)]" />
                No follower feed
              </span>
            </div>
          </div>
          <div className="relative rounded-[2.5rem] border border-[var(--moss-200)] bg-white/55 px-4 py-12 shadow-[0_30px_80px_rgba(32,58,45,0.12)] backdrop-blur sm:px-8">
            <LandingTree />
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-[0.2em] text-[var(--clay-600)] uppercase">
            From maybe to made
          </p>
          <h2 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            A gentle system with a clear next step.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, number, title, copy }) => (
            <Card key={number} className="relative overflow-hidden p-7">
              <span className="font-display absolute top-2 right-5 text-6xl font-semibold text-[var(--cream-200)]">
                {number}
              </span>
              <span className="mb-12 flex size-11 items-center justify-center rounded-2xl bg-[var(--forest-900)] text-white">
                <Icon className="size-5" />
              </span>
              <h3 className="font-display text-2xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {copy}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section id="public-trees" className="bg-[var(--forest-950)] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <Badge className="bg-white/10 text-[var(--moss-200)]">
              A history worth keeping
            </Badge>
            <h2 className="font-display mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              The work stays visible—even after it is done.
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-white/65">
              A goalpost can wait for a delivery, branch into subgoals, gather
              updates from collaborators, and finally settle into your tree as
              an achievement.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-white/10 bg-white/5 p-5 text-white">
              <CalendarDays className="mb-7 size-6 text-[var(--moss-400)]" />
              <h3 className="font-display text-xl font-semibold">
                A real timeline
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Events, deadlines, deliveries, updates, and the moments work
                resumed.
              </p>
            </Card>
            <Card className="border-white/10 bg-white/5 p-5 text-white">
              <BellRing className="mb-7 size-6 text-[var(--clay-500)]" />
              <h3 className="font-display text-xl font-semibold">
                Private reminders
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                The public story can be shared while your notification settings
                stay yours.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 text-sm text-[var(--muted)] sm:px-8 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} Goalpost. Grow something worth
          remembering.
        </p>
        <nav className="flex gap-5">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/community">Community</Link>
        </nav>
      </footer>
    </main>
  );
}
