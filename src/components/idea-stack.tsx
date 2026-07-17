import Link from "next/link";
import { Archive, CheckCircle2, MessageCircle, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { richTextToPlainText } from "@/lib/rich-text";
import { formatDate } from "@/lib/utils";
import type { IdeaCard } from "@/types/domain";

export function IdeaStack({
  ideas,
  status,
}: {
  ideas: IdeaCard[];
  status: "archived" | "done";
}) {
  const Icon = status === "done" ? CheckCircle2 : Archive;
  return (
    <div className="space-y-3">
      {ideas.map((idea) => (
        <Link key={idea.id} href={`/app/ideas/${idea.listId}?idea=${idea.id}`}>
          <Card className="flex items-start gap-4 p-5 transition hover:border-[var(--moss-400)]">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cream-100)] text-[var(--forest-700)]">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold">
                  {idea.title}
                </h2>
                <Badge>{idea.listTitle}</Badge>
                {idea.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              {richTextToPlainText(idea.content) ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                  {richTextToPlainText(idea.content)}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
                <span>
                  {formatDate(
                    status === "done"
                      ? (idea.completedAt ?? idea.updatedAt)
                      : (idea.archivedAt ?? idea.updatedAt),
                  )}
                </span>
                {idea.attachmentCount ? (
                  <span className="flex items-center gap-1">
                    <Paperclip className="size-3" />
                    {idea.attachmentCount}
                  </span>
                ) : null}
                {idea.commentCount ? (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="size-3" />
                    {idea.commentCount}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
