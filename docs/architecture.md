# Goalpost architecture

## Runtime boundaries

Next.js renders public profile and goal routes on the server so they have canonical metadata and crawlable HTML. Interactive editors, drag ordering, tree view switching, and Realtime refresh listeners are client components. Mutations use validated Server Actions or narrowly scoped Postgres functions; there is no public write API.

Supabase is the authorization source of truth. Server Actions do not substitute for database enforcement: every exposed table has RLS, and high-integrity multi-row operations are `security definer` functions that validate `auth.uid()` before doing work. The service-role key is used only by server-side account deletion, notification fan-out, moderation, and scheduled reminder processing.

## Data model

- `profiles`, `friend_requests`, `friendships`, and `blocks` hold identity and mutual social state.
- `idea_lists`, `list_members`, and `list_invitations` implement owner/editor/viewer access.
- `ideas`, `checklists`, `checklist_items`, `comments`, and `attachments` form Trello-like cards.
- `goalposts` and `goal_collaborators` represent one public goal shared across every collaborator tree.
- `goal_updates`, `goal_tasks`, and `goal_events` form the public work history.
- `reminders` and `notifications` are private per-user operational state.
- `reports`, `account_moderation`, and `admin_audit_logs` support the beta safety layer.

Rich text is TipTap/ProseMirror JSON. Rendering walks known nodes and marks rather than injecting HTML. Link schemes are limited to HTTP(S), and the product does not fetch arbitrary link previews.

## Permission matrix

| Capability                       | Anonymous | List viewer              | List editor              | List owner               | Goal collaborator          | Goal admin                 |
| -------------------------------- | --------- | ------------------------ | ------------------------ | ------------------------ | -------------------------- | -------------------------- |
| Read a public goal               | Yes       | Yes                      | Yes                      | Yes                      | Yes                        | Yes                        |
| Read an idea list                | No        | Yes                      | Yes                      | Yes                      | Only if separately invited | Only if separately invited |
| Comment on an idea               | No        | Yes                      | Yes                      | Yes                      | By list role               | By list role               |
| Create/edit/promote ideas        | No        | No                       | Yes                      | Yes                      | By list role               | By list role               |
| Manage list access               | No        | No                       | No                       | Yes                      | No                         | No                         |
| Edit goal content/status         | No        | No                       | No                       | No                       | Yes                        | Yes                        |
| Manage goal collaborators/delete | No        | No                       | No                       | No                       | No                         | Yes                        |
| Comment on public goals          | No        | When friend/collaborator | When friend/collaborator | When friend/collaborator | Yes                        | Yes                        |

RLS helper functions centralize list role, goal collaboration, friendship, block, suspension, and platform-admin checks. Storage policies join attachment ownership back to the same content rules.

## Promotion transaction

`promote_idea(idea_id)` locks the source card, verifies editor access, creates the goal, assigns the list owner as goal admin, adds all owner/editor members as collaborators, reparents attachments/checklists/comments, writes an activity record, and deletes the source idea. Viewers do not become collaborators. Any failure rolls back the entire database transition.

## Realtime and reminders

Database triggers publish authorized Broadcast events to `user:{id}`, `list:{id}`, and `goal:{id}` topics. `realtime.messages` policies admit only the target user, list members, or goal collaborators. The app refreshes server-rendered state after an authorized event.

Supabase Cron invokes `process-reminders` every minute. The function claims rows with `FOR UPDATE SKIP LOCKED`, uses a unique notification source key and Resend idempotency key, and retries failed deliveries at most five times. Public timeline dates never reveal private reminder rows or delivery state.

## Upload safety

Objects use immutable `{userId}/{uuid}/{sanitizedName}` paths. The server validates declared MIME type, size, magic bytes, Office ZIP structure, macro markers, and prohibited HTML. SVG, HTML, archives, executables, legacy/macro-enabled Office formats, and general files are rejected. Office documents download rather than render inline. Private signed URLs are issued only after Storage RLS authorizes the object.
