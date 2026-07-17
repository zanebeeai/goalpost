import Link from "next/link";
import Image from "next/image";
import {
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  ImageIcon,
  Link2,
  MessageCircle,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import {
  addLinkAttachmentAction,
  deleteAttachmentAction,
  uploadAttachmentAction,
} from "@/app/actions/attachments";
import {
  addChecklistItemAction,
  promoteIdeaAction,
  setIdeaStatusAction,
  toggleChecklistItemAction,
} from "@/app/actions/ideas";
import { addCommentAction } from "@/app/actions/goals";
import { IdeaEditorForm } from "@/components/idea-editor-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { getSignedMediaUrls } from "@/lib/media";
import { formatDate, hostnameFromUrl } from "@/lib/utils";

type Row = Record<string, unknown>;

export async function IdeaDetail({
  idea,
  listId,
  canEdit,
}: {
  idea: Row;
  listId: string;
  canEdit: boolean;
}) {
  const attachments = (
    Array.isArray(idea.attachments) ? idea.attachments : []
  ) as Row[];
  const paths = attachments
    .map((item) =>
      typeof item.storage_path === "string" ? item.storage_path : "",
    )
    .filter(Boolean);
  const signed = await getSignedMediaUrls(paths);
  const checklists = (
    Array.isArray(idea.checklists) ? idea.checklists : []
  ) as Row[];
  const comments = (Array.isArray(idea.comments) ? idea.comments : []) as Row[];
  const revalidate = `/app/ideas/${listId}`;
  return (
    <aside
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--forest-950)]/40 p-0 backdrop-blur-sm sm:p-5"
      aria-label="Idea details"
    >
      <Card className="ml-auto min-h-full w-full max-w-3xl rounded-none p-5 sm:min-h-0 sm:rounded-[1.5rem] sm:p-7">
        <div className="flex items-center justify-between gap-3 border-b pb-5">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[.15em] text-[var(--muted)] uppercase">
              Idea in{" "}
              {String((idea.idea_lists as Row | undefined)?.title ?? "list")}
            </p>
            <h2 className="font-display mt-1 truncate text-3xl font-semibold">
              {String(idea.title)}
            </h2>
          </div>
          <Button asChild variant="ghost" size="icon">
            <Link href={`/app/ideas/${listId}`} aria-label="Close idea">
              <X className="size-5" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_220px]">
          <div className="min-w-0 space-y-8">
            <IdeaEditorForm idea={idea} listId={listId} canEdit={canEdit} />

            <section>
              <h3 className="font-display mb-3 flex items-center gap-2 text-xl font-semibold">
                <CheckCircle2 className="size-5 text-[var(--moss-600)]" />
                Checklist
              </h3>
              <div className="space-y-2">
                {checklists
                  .flatMap(
                    (checklist) =>
                      (Array.isArray(checklist.checklist_items)
                        ? checklist.checklist_items
                        : []) as Row[],
                  )
                  .map((item) => {
                    const done = Boolean(item.completed_at);
                    return (
                      <form
                        key={String(item.id)}
                        action={toggleChecklistItemAction}
                      >
                        <input
                          type="hidden"
                          name="itemId"
                          value={String(item.id)}
                        />
                        <input type="hidden" name="listId" value={listId} />
                        <input
                          type="hidden"
                          name="completed"
                          value={done ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          disabled={!canEdit}
                          className="flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left text-sm hover:bg-[var(--cream-50)] disabled:cursor-default"
                        >
                          <span
                            className={`flex size-5 items-center justify-center rounded-md border ${done ? "border-[var(--forest-700)] bg-[var(--forest-700)] text-white" : ""}`}
                          >
                            {done ? <Check className="size-3.5" /> : null}
                          </span>
                          <span
                            className={
                              done ? "text-[var(--muted)] line-through" : ""
                            }
                          >
                            {String(item.title)}
                          </span>
                        </button>
                      </form>
                    );
                  })}
              </div>
              {canEdit ? (
                <form
                  action={addChecklistItemAction}
                  className="mt-3 flex gap-2"
                >
                  <input type="hidden" name="ideaId" value={String(idea.id)} />
                  <input type="hidden" name="listId" value={listId} />
                  {checklists[0]?.id ? (
                    <input
                      type="hidden"
                      name="checklistId"
                      value={String(checklists[0].id)}
                    />
                  ) : null}
                  <Input
                    name="title"
                    placeholder="Add a checklist item"
                    maxLength={240}
                    required
                  />
                  <Button type="submit" variant="secondary" size="icon">
                    <Plus className="size-4" />
                  </Button>
                </form>
              ) : null}
            </section>

            <section>
              <h3 className="font-display mb-3 flex items-center gap-2 text-xl font-semibold">
                <Paperclip className="size-5 text-[var(--moss-600)]" />
                Attachments
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {attachments.map((item) => {
                  const kind = String(item.kind);
                  const href =
                    kind === "link"
                      ? String(item.url)
                      : signed.get(String(item.storage_path));
                  return (
                    <div
                      key={String(item.id)}
                      className="group relative overflow-hidden rounded-xl border bg-white"
                    >
                      {kind === "image" && href ? (
                        <Image
                          src={href}
                          alt={String(item.title)}
                          width={600}
                          height={300}
                          unoptimized
                          className="h-32 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-20 items-center justify-center bg-[var(--cream-100)] text-[var(--forest-700)]">
                          {kind === "link" ? (
                            <Link2 className="size-6" />
                          ) : (
                            <FileText className="size-6" />
                          )}
                        </div>
                      )}
                      <div className="p-3">
                        <p className="truncate text-sm font-bold">
                          {String(item.title)}
                        </p>
                        {kind === "link" ? (
                          <p className="truncate text-xs text-[var(--muted)]">
                            {hostnameFromUrl(String(item.url))}
                          </p>
                        ) : null}
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            download={
                              kind === "document"
                                ? String(item.title)
                                : undefined
                            }
                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--forest-700)]"
                          >
                            {kind === "document" ? (
                              <Download className="size-3" />
                            ) : (
                              <ExternalLink className="size-3" />
                            )}
                            {kind === "document" ? "Download" : "Open"}
                          </a>
                        ) : null}
                      </div>
                      {canEdit ? (
                        <form
                          action={deleteAttachmentAction}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={String(item.id)}
                          />
                          <input
                            type="hidden"
                            name="revalidate"
                            value={revalidate}
                          />
                          <Button
                            type="submit"
                            variant="secondary"
                            size="icon"
                            className="size-8"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {canEdit ? (
                <div className="mt-4 grid gap-3 rounded-xl bg-[var(--cream-50)] p-4 sm:grid-cols-2">
                  <form action={uploadAttachmentAction} className="space-y-2">
                    <input
                      type="hidden"
                      name="ideaId"
                      value={String(idea.id)}
                    />
                    <input type="hidden" name="revalidate" value={revalidate} />
                    <label className="text-xs font-bold">
                      Upload image or document
                      <Input
                        type="file"
                        name="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf,.docx,.xlsx,.pptx,text/plain"
                        required
                        className="mt-1 file:mr-2 file:rounded-full file:border-0 file:bg-[var(--moss-200)] file:px-2 file:py-1 file:text-xs"
                      />
                    </label>
                    <Button type="submit" variant="secondary" size="sm">
                      <ImageIcon className="size-3.5" />
                      Upload
                    </Button>
                  </form>
                  <form action={addLinkAttachmentAction} className="space-y-2">
                    <input
                      type="hidden"
                      name="ideaId"
                      value={String(idea.id)}
                    />
                    <input type="hidden" name="revalidate" value={revalidate} />
                    <Input name="title" placeholder="Link title" required />
                    <Input
                      name="url"
                      type="url"
                      placeholder="https://…"
                      required
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      <Link2 className="size-3.5" />
                      Attach link
                    </Button>
                  </form>
                </div>
              ) : null}
            </section>

            <section>
              <h3 className="font-display mb-3 flex items-center gap-2 text-xl font-semibold">
                <MessageCircle className="size-5 text-[var(--moss-600)]" />
                Discussion
              </h3>
              <div className="space-y-3">
                {comments.map((comment) => {
                  const profile = (comment.profiles ?? {}) as Row;
                  return (
                    <div
                      key={String(comment.id)}
                      className="flex gap-3 rounded-xl border bg-white p-3"
                    >
                      <Avatar
                        name={String(profile.display_name ?? "Deleted user")}
                        className="size-8"
                      />
                      <div>
                        <p className="text-xs font-bold">
                          {String(profile.display_name ?? "Deleted user")}{" "}
                          <span className="font-normal text-[var(--muted)]">
                            · {formatDate(String(comment.created_at))}
                          </span>
                        </p>
                        <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">
                          {String(comment.body)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form action={addCommentAction} className="mt-3 space-y-2">
                <input type="hidden" name="ideaId" value={String(idea.id)} />
                <input type="hidden" name="revalidate" value={revalidate} />
                <Textarea
                  name="body"
                  placeholder="Add a comment…"
                  maxLength={4000}
                  required
                />
                <Button type="submit" variant="secondary" size="sm">
                  Comment
                </Button>
              </form>
            </section>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold tracking-wider text-[var(--muted)] uppercase">
              Actions
            </p>
            {canEdit ? (
              <>
                <form action={promoteIdeaAction}>
                  <input type="hidden" name="ideaId" value={String(idea.id)} />
                  <Button type="submit" className="w-full justify-between">
                    Promote to goal <ArrowRight className="size-4" />
                  </Button>
                  <p className="mt-2 text-xs leading-5 text-[var(--clay-600)]">
                    <Globe2 className="mr-1 inline size-3.5" />
                    This moves the card into a public joint goal for every
                    editor.
                  </p>
                </form>
                {String(idea.status) !== "archived" ? (
                  <form action={setIdeaStatusAction}>
                    <input type="hidden" name="id" value={String(idea.id)} />
                    <input type="hidden" name="listId" value={listId} />
                    <input type="hidden" name="status" value="archived" />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Archive className="size-4" />
                      Archive
                    </Button>
                  </form>
                ) : null}
                {String(idea.status) !== "done" ? (
                  <form action={setIdeaStatusAction}>
                    <input type="hidden" name="id" value={String(idea.id)} />
                    <input type="hidden" name="listId" value={listId} />
                    <input type="hidden" name="status" value="done" />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <CheckCircle2 className="size-4" />
                      Mark done
                    </Button>
                  </form>
                ) : null}
                {String(idea.status) !== "active" ? (
                  <form action={setIdeaStatusAction}>
                    <input type="hidden" name="id" value={String(idea.id)} />
                    <input type="hidden" name="listId" value={listId} />
                    <input type="hidden" name="status" value="active" />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                    >
                      Return to active
                    </Button>
                  </form>
                ) : null}
              </>
            ) : (
              <Badge>View and comment</Badge>
            )}
          </div>
        </div>
      </Card>
    </aside>
  );
}
