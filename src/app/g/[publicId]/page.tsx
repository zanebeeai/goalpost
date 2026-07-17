import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BellRing,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDotDashed,
  Download,
  ExternalLink,
  FileText,
  Flag,
  Globe2,
  Link2,
  MessageCircle,
  PackageOpen,
  Paperclip,
  Sprout,
  UsersRound,
} from "lucide-react";
import {
  addLinkAttachmentAction,
  uploadAttachmentAction,
} from "@/app/actions/attachments";
import { addCommentAction, toggleGoalTaskAction } from "@/app/actions/goals";
import { reportContentAction } from "@/app/actions/social";
import { GoalActions } from "@/components/goal-actions";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { SiteHeader } from "@/components/site-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { getViewer } from "@/lib/auth";
import { GOAL_EVENT_LABELS } from "@/lib/constants";
import { getGoalByPublicId } from "@/lib/data";
import { getSignedMediaUrls } from "@/lib/media";
import { formatDate, hostnameFromUrl, relativeDate } from "@/lib/utils";
import type { Json } from "@/types/domain";

type Row = Record<string, unknown>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const result = await getGoalByPublicId(publicId);
  if (!result) return {};
  const owners = result.goal.collaborators
    .map((person) => person.displayName)
    .join(", ");
  return {
    title: result.goal.title,
    description: `A public goal by ${owners || "a Goalpost member"}.`,
    alternates: { canonical: `/g/${publicId}` },
    openGraph: {
      title: result.goal.title,
      description: `Follow this ${result.goal.status} goal on Goalpost.`,
      type: "article",
    },
  };
}

function StatusBadge({ status }: { status: string }) {
  const Icon =
    status === "done"
      ? CheckCircle2
      : status === "waiting"
        ? PackageOpen
        : CircleDotDashed;
  return (
    <Badge
      className={
        status === "done"
          ? "bg-amber-100 text-amber-800"
          : status === "waiting"
            ? "bg-[var(--clay-200)] text-[var(--clay-600)]"
            : ""
      }
    >
      <Icon className="mr-1 size-3.5" />
      {status}
    </Badge>
  );
}

export default async function GoalPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const [result, viewer] = await Promise.all([
    getGoalByPublicId(publicId),
    getViewer(),
  ]);
  if (!result) notFound();
  const { goal, raw } = result;
  const isCollaborator = Boolean(
    viewer && goal.collaborators.some((person) => person.userId === viewer.id),
  );
  const isAdmin = Boolean(viewer && goal.adminUserId === viewer.id);
  const tasks = (Array.isArray(raw.goal_tasks) ? raw.goal_tasks : []) as Row[];
  const events = (
    Array.isArray(raw.goal_events) ? raw.goal_events : []
  ) as Row[];
  const updates = (
    Array.isArray(raw.goal_updates) ? raw.goal_updates : []
  ) as Row[];
  const attachments = (
    Array.isArray(raw.attachments) ? raw.attachments : []
  ) as Row[];
  const updateAttachments = updates.flatMap(
    (update) =>
      (Array.isArray(update.attachments) ? update.attachments : []) as Row[],
  );
  const comments = (Array.isArray(raw.comments) ? raw.comments : []) as Row[];
  const paths = [...attachments, ...updateAttachments]
    .map((item) =>
      typeof item.storage_path === "string" ? item.storage_path : "",
    )
    .filter(Boolean);
  const media = await getSignedMediaUrls(paths, 7200);
  const revalidate = `/g/${publicId}`;
  const timeline = [
    ...events.map((item) => ({
      kind: "event" as const,
      date: String(item.starts_at),
      item,
    })),
    ...updates.map((item) => ({
      kind: "update" as const,
      date: String(item.published_at),
      item,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <main>
      <SiteHeader />
      <section className="border-b bg-[var(--white)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={goal.status} />
                <Badge>
                  <Globe2 className="mr-1 size-3" />
                  Public
                </Badge>
                {goal.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <h1 className="font-display mt-5 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
                {goal.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  <Sprout className="size-4" />
                  Started {formatDate(goal.startedOn)}
                </span>
                {goal.completedAt ? (
                  <span className="flex items-center gap-2 text-amber-700">
                    <CheckCircle2 className="size-4" />
                    Completed {formatDate(goal.completedAt)}
                  </span>
                ) : null}
                <span className="flex items-center gap-2">
                  <UsersRound className="size-4" />
                  {goal.collaborators.length}{" "}
                  {goal.collaborators.length === 1 ? "builder" : "builders"}
                </span>
              </div>
            </div>
            <div>
              <div className="mb-2 flex -space-x-3">
                {goal.collaborators.map((person) => (
                  <Link
                    href={`/u/${person.username}`}
                    key={person.userId}
                    title={person.displayName}
                  >
                    <Avatar
                      name={person.displayName}
                      className="size-12 text-sm"
                    />
                  </Link>
                ))}
              </div>
              <p className="text-right text-xs text-[var(--muted)]">
                {goal.collaborators
                  .map((person) => person.displayName)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:py-14">
        <div className="min-w-0 space-y-12">
          <section>
            <h2 className="font-display mb-5 text-2xl font-semibold">
              The goal
            </h2>
            <Card className="p-6 sm:p-8">
              <RichTextRenderer
                content={goal.content}
                className="text-base leading-8"
              />
            </Card>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">Tasks</h2>
              <span className="text-xs font-bold text-[var(--muted)]">
                {tasks.filter((task) => task.completed_at).length} of{" "}
                {tasks.length} complete
              </span>
            </div>
            {tasks.length ? (
              <div className="space-y-2">
                {tasks
                  .sort((a, b) => Number(a.position) - Number(b.position))
                  .map((task) => {
                    const done = Boolean(task.completed_at);
                    return (
                      <Card
                        key={String(task.id)}
                        className="flex items-center gap-3 p-4"
                      >
                        {isCollaborator ? (
                          <form action={toggleGoalTaskAction}>
                            <input
                              type="hidden"
                              name="taskId"
                              value={String(task.id)}
                            />
                            <input
                              type="hidden"
                              name="publicId"
                              value={publicId}
                            />
                            <input
                              type="hidden"
                              name="completed"
                              value={done ? "false" : "true"}
                            />
                            <button
                              type="submit"
                              className={`flex size-6 items-center justify-center rounded-md border ${done ? "border-[var(--forest-700)] bg-[var(--forest-700)] text-white" : ""}`}
                              aria-label={
                                done ? "Reopen task" : "Complete task"
                              }
                            >
                              {done ? <Check className="size-4" /> : null}
                            </button>
                          </form>
                        ) : (
                          <span
                            className={`flex size-6 items-center justify-center rounded-md border ${done ? "border-[var(--forest-700)] bg-[var(--forest-700)] text-white" : ""}`}
                          >
                            {done ? <Check className="size-4" /> : null}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${done ? "text-[var(--muted)] line-through" : ""}`}
                          >
                            {String(task.title)}
                          </p>
                          {task.due_at ? (
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              Due {formatDate(String(task.due_at), true)}
                            </p>
                          ) : null}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <Card className="border-dashed p-7 text-center text-sm text-[var(--muted)]">
                No public tasks have been added.
              </Card>
            )}
          </section>

          <section>
            <h2 className="font-display mb-5 text-2xl font-semibold">
              Timeline
            </h2>
            {timeline.length ? (
              <div className="relative space-y-5 pl-9 before:absolute before:top-2 before:bottom-0 before:left-3 before:w-px before:bg-[var(--moss-400)]">
                {timeline.map(({ kind, date, item }) => {
                  const profile = (item.profiles ?? {}) as Row;
                  return (
                    <article
                      key={`${kind}-${String(item.id)}`}
                      className="relative"
                    >
                      <span
                        className={`absolute top-4 -left-[2.1rem] flex size-6 items-center justify-center rounded-full border-4 border-[var(--cream-50)] ${kind === "event" ? "bg-[var(--clay-500)]" : "bg-[var(--forest-700)]"}`}
                      />
                      {kind === "event" ? (
                        <Card className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <Badge className="bg-[var(--clay-200)] text-[var(--clay-600)]">
                                {GOAL_EVENT_LABELS[
                                  String(
                                    item.event_type,
                                  ) as keyof typeof GOAL_EVENT_LABELS
                                ] ?? "Event"}
                              </Badge>
                              <h3 className="font-display mt-2 text-xl font-semibold">
                                {String(item.title)}
                              </h3>
                            </div>
                            <p className="flex items-center gap-1 text-xs font-semibold text-[var(--muted)]">
                              <CalendarClock className="size-3.5" />
                              {formatDate(date, true)}
                            </p>
                          </div>
                          {item.description ? (
                            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                              {String(item.description)}
                            </p>
                          ) : null}
                        </Card>
                      ) : (
                        <Card className="p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <Avatar
                              name={String(
                                profile.display_name ?? "Deleted user",
                              )}
                              className="size-8"
                            />
                            <div>
                              <p className="text-sm font-bold">
                                {String(profile.display_name ?? "Deleted user")}
                              </p>
                              <p className="text-xs text-[var(--muted)]">
                                {relativeDate(date)}
                              </p>
                            </div>
                          </div>
                          <RichTextRenderer content={item.content as Json} />
                          {Array.isArray(item.attachments) &&
                          item.attachments.length ? (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              {(item.attachments as Row[]).map((attachment) => {
                                const href =
                                  String(attachment.kind) === "link"
                                    ? String(attachment.url)
                                    : media.get(
                                        String(attachment.storage_path),
                                      );
                                return href ? (
                                  <a
                                    key={String(attachment.id)}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl border p-3 text-sm font-bold"
                                  >
                                    {String(attachment.title)}
                                  </a>
                                ) : null;
                              })}
                            </div>
                          ) : null}
                        </Card>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed p-7 text-center text-sm text-[var(--muted)]">
                The story begins with the first update or event.
              </Card>
            )}
          </section>

          <section>
            <h2 className="font-display mb-5 flex items-center gap-2 text-2xl font-semibold">
              <Paperclip className="size-5" />
              Files and links
            </h2>
            {attachments.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {attachments.map((item) => {
                  const kind = String(item.kind);
                  const href =
                    kind === "link"
                      ? String(item.url)
                      : media.get(String(item.storage_path));
                  return (
                    <Card key={String(item.id)} className="overflow-hidden">
                      {kind === "image" && href ? (
                        <Image
                          src={href}
                          alt={String(item.title)}
                          width={600}
                          height={300}
                          unoptimized
                          className="h-40 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-[var(--cream-100)]">
                          {kind === "link" ? (
                            <Link2 className="size-6" />
                          ) : (
                            <FileText className="size-6" />
                          )}
                        </div>
                      )}
                      <div className="p-4">
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
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--forest-700)]"
                          >
                            {kind === "document" ? (
                              <Download className="size-3.5" />
                            ) : (
                              <ExternalLink className="size-3.5" />
                            )}
                            {kind === "document" ? "Download" : "Open"}
                          </a>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No files or links yet.
              </p>
            )}
            {isCollaborator ? (
              <div className="mt-4 grid gap-3 rounded-2xl border bg-[var(--cream-50)] p-4 sm:grid-cols-2">
                <form action={uploadAttachmentAction} className="space-y-2">
                  <input type="hidden" name="goalpostId" value={goal.id} />
                  <input type="hidden" name="revalidate" value={revalidate} />
                  <Input
                    type="file"
                    name="file"
                    required
                    accept="image/jpeg,image/png,image/webp,application/pdf,.docx,.xlsx,.pptx,text/plain"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    Upload file
                  </Button>
                </form>
                <form action={addLinkAttachmentAction} className="space-y-2">
                  <input type="hidden" name="goalpostId" value={goal.id} />
                  <input type="hidden" name="revalidate" value={revalidate} />
                  <Input name="title" placeholder="Link title" required />
                  <Input
                    name="url"
                    type="url"
                    placeholder="https://…"
                    required
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    Attach link
                  </Button>
                </form>
              </div>
            ) : null}
          </section>

          <section>
            <h2 className="font-display mb-5 flex items-center gap-2 text-2xl font-semibold">
              <MessageCircle className="size-5" />
              Conversation
            </h2>
            <div className="space-y-3">
              {comments.map((comment) => {
                const profile = (comment.profiles ?? {}) as Row;
                return (
                  <Card key={String(comment.id)} className="flex gap-3 p-4">
                    <Avatar
                      name={String(profile.display_name ?? "Deleted user")}
                      className="size-9"
                    />
                    <div>
                      <p className="text-sm font-bold">
                        {String(profile.display_name ?? "Deleted user")}{" "}
                        <span className="font-normal text-[var(--muted)]">
                          · {relativeDate(String(comment.created_at))}
                        </span>
                      </p>
                      <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">
                        {String(comment.body)}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
            {viewer ? (
              <form action={addCommentAction} className="mt-4 space-y-2">
                <input type="hidden" name="goalpostId" value={goal.id} />
                <input type="hidden" name="revalidate" value={revalidate} />
                <Textarea
                  name="body"
                  placeholder="Friends and collaborators can comment…"
                  maxLength={4000}
                  required
                />
                <Button type="submit" variant="secondary" size="sm">
                  Add comment
                </Button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                <Link
                  href={`/auth/login?next=/g/${publicId}`}
                  className="font-bold text-[var(--forest-700)]"
                >
                  Log in
                </Link>{" "}
                to join the conversation if you are a friend or collaborator.
              </p>
            )}
          </section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {isCollaborator ? (
            <Card className="p-4">
              <p className="mb-3 text-xs font-bold tracking-wider text-[var(--muted)] uppercase">
                Collaborator tools
              </p>
              <GoalActions goal={goal} isAdmin={isAdmin} />
            </Card>
          ) : (
            <Card className="p-5">
              <Globe2 className="size-5 text-[var(--moss-600)]" />
              <h2 className="font-display mt-3 text-xl font-semibold">
                A public work log
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                You can read every goalpost. Only collaborators can edit, and
                friends may comment.
              </p>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">Builders</h2>
            <div className="mt-4 space-y-3">
              {goal.collaborators.map((person) => (
                <Link
                  href={`/u/${person.username}`}
                  key={person.userId}
                  className="flex items-center gap-3"
                >
                  <Avatar name={person.displayName} />
                  <div>
                    <p className="text-sm font-bold">{person.displayName}</p>
                    <p className="text-xs text-[var(--muted)]">
                      @{person.username}
                      {person.isAdmin ? " · admin" : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
          {viewer ? (
            <details>
              <summary className="list-none">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-[var(--muted)]"
                >
                  <span>
                    <Flag className="size-4" />
                    Report this goal
                  </span>
                </Button>
              </summary>
              <Card className="mt-2 p-4">
                <form action={reportContentAction} className="space-y-3">
                  <input type="hidden" name="targetType" value="goalpost" />
                  <input type="hidden" name="targetId" value={goal.id} />
                  <input type="hidden" name="revalidate" value={revalidate} />
                  <select
                    name="reason"
                    className="focus-ring min-h-10 w-full rounded-xl border bg-white px-3 text-sm"
                  >
                    <option>Harassment or abuse</option>
                    <option>Private information</option>
                    <option>Malware or unsafe file</option>
                    <option>Copyright concern</option>
                    <option>Other violation</option>
                  </select>
                  <Textarea name="details" placeholder="Optional details" />
                  <Button type="submit" variant="danger" size="sm">
                    Submit report
                  </Button>
                </form>
              </Card>
            </details>
          ) : null}
          <div className="rounded-xl bg-[var(--cream-100)] p-4 text-xs leading-5 text-[var(--muted)]">
            <BellRing className="mb-2 size-4" />
            Reminder delivery and read state remain private even though timeline
            dates are public.
          </div>
        </aside>
      </div>
      {isCollaborator ? <RealtimeRefresh topics={[`goal:${goal.id}`]} /> : null}
    </main>
  );
}
