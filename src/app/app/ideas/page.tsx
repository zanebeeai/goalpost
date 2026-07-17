import Link from "next/link";
import { ArrowRight, Eye, ListTodo, Lock, Pencil } from "lucide-react";
import { CreateListButton } from "@/components/create-menu";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProfile } from "@/lib/auth";
import { getLists } from "@/lib/data";
import { relativeDate } from "@/lib/utils";

export default async function IdeasPage() {
  const profile = await requireProfile();
  const lists = await getLists(profile.id);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Private workspace"
        title="Idea lists"
        description="Collect things before they become commitments. A list is visible only to its invited members."
        actions={<CreateListButton />}
      />
      {lists.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lists.map((list) => (
            <Link href={`/app/ideas/${list.id}`} key={list.id}>
              <Card className="group h-full p-5 transition hover:-translate-y-0.5 hover:border-[var(--moss-400)] hover:shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--moss-200)] text-[var(--forest-800)]">
                    <ListTodo className="size-5" />
                  </span>
                  <Badge>
                    {list.role === "owner" ? (
                      <Lock className="mr-1 size-3" />
                    ) : list.role === "editor" ? (
                      <Pencil className="mr-1 size-3" />
                    ) : (
                      <Eye className="mr-1 size-3" />
                    )}
                    {list.role}
                  </Badge>
                </div>
                <h2 className="font-display mt-6 text-2xl font-semibold">
                  {list.title}
                </h2>
                <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">
                  {list.description ?? "A place for ideas that might grow."}
                </p>
                <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-[var(--muted)]">
                  <span>
                    {list.ideaCount} {list.ideaCount === 1 ? "idea" : "ideas"}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[var(--forest-700)]">
                    Updated {relativeDate(list.updatedAt)}{" "}
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListTodo}
          title="Your first list is waiting"
          description="Create a private list to start catching ideas. Your Inbox is normally created during onboarding."
          action={<CreateListButton />}
        />
      )}
    </div>
  );
}
