import Link from "next/link";
import { Lightbulb, Search, Sprout, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireProfile } from "@/lib/auth";
import { searchGoalpost } from "@/lib/data";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [profile, params] = await Promise.all([requireProfile(), searchParams]);
  const q = params.q?.trim() ?? "";
  const results = q.length >= 2 ? await searchGoalpost(q, profile.id) : null;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Find what matters"
        title="Search"
        description="Search your accessible idea cards, public goalposts, tags, and member profiles."
      />
      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search ideas, goals, tags, or people…"
          autoFocus
        />
        <button className="focus-ring flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--forest-900)] text-white">
          <Search className="size-4" />
        </button>
      </form>
      {results ? (
        <div className="space-y-8">
          {results.profiles.length ? (
            <section>
              <h2 className="font-display mb-3 text-xl font-semibold">
                People
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.profiles.map((item) => (
                  <Link href={`/u/${item.username}`} key={item.id}>
                    <Card className="flex items-center gap-3 p-4">
                      <Avatar name={item.displayName} />
                      <div>
                        <p className="text-sm font-bold">{item.displayName}</p>
                        <p className="text-xs text-[var(--muted)]">
                          @{item.username}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {results.ideas.length ? (
            <section>
              <h2 className="font-display mb-3 text-xl font-semibold">
                Your accessible ideas
              </h2>
              <div className="space-y-2">
                {results.ideas.map((item) => (
                  <Link
                    href={`/app/ideas/${item.listId}?idea=${item.id}`}
                    key={item.id}
                  >
                    <Card className="flex items-center gap-3 p-4">
                      <Lightbulb className="size-4 text-[var(--moss-600)]" />
                      <span className="flex-1 text-sm font-bold">
                        {item.title}
                      </span>
                      <Badge>{item.listTitle}</Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {results.goals.length ? (
            <section>
              <h2 className="font-display mb-3 text-xl font-semibold">
                Public goals
              </h2>
              <div className="space-y-2">
                {results.goals.map((item) => (
                  <Link href={`/g/${item.publicId}`} key={item.id}>
                    <Card className="flex items-center gap-3 p-4">
                      <Sprout className="size-4 text-[var(--moss-600)]" />
                      <span className="flex-1 text-sm font-bold">
                        {item.title}
                      </span>
                      <Badge>{item.status}</Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {!results.profiles.length &&
          !results.ideas.length &&
          !results.goals.length ? (
            <Card className="p-10 text-center">
              <Search className="mx-auto size-6 text-[var(--muted)]" />
              <p className="font-display mt-3 text-xl font-semibold">
                No matches for “{q}”
              </p>
            </Card>
          ) : null}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <UserRound className="mx-auto size-6 text-[var(--moss-600)]" />
          <p className="mt-3 text-sm text-[var(--muted)]">
            Enter at least two characters to begin.
          </p>
        </Card>
      )}
    </div>
  );
}
