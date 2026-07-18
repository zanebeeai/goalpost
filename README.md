# Goalpost

Goalpost is an idea and goal tracker with deliberately mild social features. Ideas begin in private or shared lists. When an idea becomes real work, it moves into a public, chronological goal tree where collaborators can keep tasks, updates, files, events, and a durable record of completion.

This repository contains the complete deployable beta:

- Next.js App Router frontend and server actions
- Supabase Auth, Postgres, RLS, Storage, Realtime Broadcast, and Edge Functions
- Email/password and Google authentication
- Idea lists with owner/editor/viewer roles
- Atomic idea-to-joint-goal promotion
- Public profiles and accessible visual goal trees
- Tasks, updates, events, reminders, comments, files, tags, search, and calendar
- Friends, invitations, blocking, reports, and an admin moderation queue
- Resend reminder delivery, Sentry instrumentation, CI, and encrypted R2 backups

## Local development

Requirements:

- [mise](https://mise.jdx.dev/) 2026.7.0 or newer
- Docker Desktop for the local Supabase stack
- Git

Install mise with Homebrew on macOS:

```sh
brew install mise
```

On Windows, install mise with Scoop (recommended) or winget:

```powershell
scoop install mise
# Or: winget install jdx.mise
```

Then, on either platform, install the pinned tools and configure Goalpost:

```sh
mise trust
mise install
mise run setup
mise run dev
```

The committed `mise.toml` pins Node.js and pnpm for every developer and CI. The `setup` task installs dependencies, starts Supabase, and runs `env:local`. That command writes the current developer's local Supabase values to an ignored `.env.local` without printing credentials and preserves existing optional settings. Local confirmation email appears at `http://127.0.0.1:54324`.

Useful commands:

```sh
mise run check
mise exec -- pnpm test
mise exec -- pnpm db:reset
mise exec -- pnpm db:test
mise exec -- pnpm db:types
mise exec -- pnpm test:e2e
```

The app can build without environment values so its public marketing and legal pages remain testable in CI. Authenticated and data-backed routes require Supabase configuration.

## Production configuration

1. Create separate Supabase staging and production projects.
2. Run `supabase link --project-ref …` and `supabase db push` against staging first, then production.
3. Create `goalpost-media` through the migration and leave it private.
4. Enable email/password signup, require email verification, and configure Google OAuth with `/auth/callback` as an allowed redirect.
5. Create a Resend API key and verified sending domain.
6. Create Turnstile keys for the deployed hostname.
7. Deploy `process-reminders` and set its `CRON_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, and `SITE_URL` secrets.
8. Run the statements in `supabase/setup/schedule_reminders.sql.example` after replacing its placeholders.
9. Create Vercel staging and production projects/environments and populate the variables documented in `.env.example`.
10. Configure Sentry and the GitHub Actions environment secrets used by the backup workflow.

To bootstrap the first administrator, set immutable app metadata through a service-role context or the Supabase SQL editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'ADMIN_EMAIL_HERE';
```

The moderation queue is then available at `/app/admin`. Never put the admin role in user-editable `raw_user_meta_data`.

## Privacy model

The distinction is intentionally sharp:

- Profiles and all goal content are public and indexable: descriptions, collaborators, updates, tasks, events, attachments, and permitted comments.
- Idea lists, card content, reminder schedules, notification state, authentication details, blocks, and reports are protected by membership-aware RLS.
- Blocking stops interaction and invitations; it cannot hide an open-web profile or goal from anonymous visitors.
- Promotion is a database transaction. It creates one shared goal for every accepted editor, reparents content, and deletes the original card.

See [Architecture](docs/architecture.md) and [Operations](docs/operations.md) for the data flow, permission matrix, rollout, backups, and recovery procedure.

## Repository structure

```text
src/app/                 Next.js routes and Server Actions
src/components/          UI, editors, tree, boards, and forms
src/lib/                 Auth, data access, validation, and utilities
supabase/migrations/     Schema, RLS, RPCs, Storage, and Realtime
supabase/functions/      Reminder delivery Edge Function
supabase/tests/          pgTAP database tests
.github/workflows/       CI and nightly encrypted backups
e2e/                     Public Playwright acceptance checks
```

## Deferred deliberately

Native/PWA clients, private goals, follows and feeds, reactions, messaging, AI features, gamification, recurring tasks, templates, external calendar sync, dependency graphs, arbitrary files, and user exports are outside this beta.
