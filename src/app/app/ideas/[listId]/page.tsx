import Link from "next/link";
import { ArrowLeft, Eye, Plus, Share2 } from "lucide-react";
import { IdeaBoard } from "@/components/idea-board";
import { IdeaDetail } from "@/components/idea-detail";
import { QuickCaptureForm } from "@/components/idea-forms";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProfile } from "@/lib/auth";
import { getIdea, getIdeas, getLists } from "@/lib/data";
import { notFound } from "next/navigation";
import { inviteToListAction } from "@/app/actions/social";
import { Input } from "@/components/ui/input";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export default async function ListPage({
  params,
  searchParams,
}: {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ idea?: string }>;
}) {
  const [{ listId }, query, profile] = await Promise.all([
    params,
    searchParams,
    requireProfile(),
  ]);
  const lists = await getLists(profile.id);
  const list = lists.find((item) => item.id === listId);
  if (!list) notFound();
  const [ideas, selected] = await Promise.all([
    getIdeas({ listId, status: "active" }),
    query.idea ? getIdea(query.idea) : Promise.resolve(null),
  ]);
  const canEdit = list.role === "owner" || list.role === "editor";
  return (
    <div className="space-y-8">
      <Link
        href="/app/ideas"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--forest-700)]"
      >
        <ArrowLeft className="size-4" />
        All lists
      </Link>
      <PageHeader
        eyebrow={
          list.role === "owner"
            ? "Your private list"
            : `Shared with you · ${list.role}`
        }
        title={list.title}
        description={
          list.description ?? "Ideas that have not become commitments yet."
        }
        actions={
          <>
            {list.role === "owner" ? (
              <details className="relative">
                <summary className="list-none">
                  <Button asChild variant="secondary">
                    <span>
                      <Share2 className="size-4" />
                      Share
                    </span>
                  </Button>
                </summary>
                <Card className="absolute top-13 right-0 z-20 w-80 p-4">
                  <form action={inviteToListAction} className="space-y-3">
                    <input type="hidden" name="listId" value={listId} />
                    <Input name="username" placeholder="Username" required />
                    <select
                      name="role"
                      className="focus-ring min-h-11 w-full rounded-xl border bg-white px-3 text-sm"
                    >
                      <option value="viewer">Viewer · read and comment</option>
                      <option value="editor">
                        Editor · create, edit, promote
                      </option>
                    </select>
                    <Button type="submit" size="sm" className="w-full">
                      Send invitation
                    </Button>
                  </form>
                </Card>
              </details>
            ) : (
              <Badge>
                <Eye className="mr-1 size-3" />
                {list.role}
              </Badge>
            )}
          </>
        }
      />
      {canEdit ? (
        <Card className="p-4">
          <QuickCaptureForm lists={[list]} defaultListId={list.id} />
        </Card>
      ) : null}
      {ideas.length ? (
        <IdeaBoard initialIdeas={ideas} listId={listId} draggable={canEdit} />
      ) : (
        <EmptyState
          icon={Plus}
          title="No active ideas here"
          description={
            canEdit
              ? "Catch something small. You can add the shape and detail later."
              : "The editors have not added any active ideas yet."
          }
        />
      )}
      {selected && String(selected.list_id) === listId ? (
        <IdeaDetail idea={selected} listId={listId} canEdit={canEdit} />
      ) : null}
      <RealtimeRefresh topics={[`list:${listId}`]} />
    </div>
  );
}
