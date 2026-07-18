# Goalpost local testing and deployment

This guide covers a complete local setup, the available automated and manual tests, and the services and configuration required to deploy Goalpost online.

## Run Goalpost locally

### Prerequisites

Install:

- [mise](https://mise.jdx.dev/) 2026.7.0 or newer
- Docker Desktop with Linux containers running
- Git

The committed `mise.toml` installs exact Node.js and pnpm versions. The Supabase CLI remains a repository development dependency, so it does not require a global installation.

### First-time setup

Install mise on macOS:

```sh
brew install mise
```

On Windows, use Scoop (recommended) or winget:

```powershell
scoop install mise
# Or: winget install jdx.mise
```

From the repository root on either platform:

```sh
mise trust
mise install
mise run setup
```

The setup task installs the frozen pnpm dependencies, starts local Postgres, Auth, Storage, Realtime, Studio, Mailpit, and Edge Runtime containers, applies migrations, and configures `.env.local`.

`env:local` securely reads the local stack's status and creates or updates `.env.local` with:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=<local secret key>

# These may remain blank locally.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
RESEND_FROM=Goalpost <reminders@example.com>
CRON_SECRET=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

The generated file is ignored by Git. Existing optional integration settings are preserved when `env:local` is run again, and secret values are not printed to the terminal.

The Supabase URL must be the API root, `http://127.0.0.1:54321`. Do not use the Storage S3 URL ending in `/storage/v1/s3`.

Start the web application:

```sh
mise run dev
```

Use these local endpoints:

| Service         | URL                      |
| --------------- | ------------------------ |
| Goalpost        | <http://localhost:3000>  |
| Supabase Studio | <http://127.0.0.1:54323> |
| Mailpit         | <http://127.0.0.1:54324> |
| Supabase API    | <http://127.0.0.1:54321> |

Use `localhost:3000` consistently for the app. Restart `mise run dev` after changing `.env.local`.

### Create a local account

1. Open <http://localhost:3000/auth/signup> and register.
2. Open Mailpit at <http://127.0.0.1:54324>. Local Supabase captures outgoing authentication email instead of delivering it to a real inbox.
3. Open **Confirm your email address** and follow its link.
4. Complete onboarding. This creates the profile and private Inbox list.

Google OAuth is disabled locally by default. Email/password signup exercises the complete local authentication and onboarding path without third-party credentials.

### Reset or stop the local stack

```sh
# Reapply migrations and erase all local application data.
mise exec -- pnpm db:reset

# Stop the containers while retaining their Docker volumes.
mise exec -- pnpm db:stop
```

Run `mise exec -- pnpm db:start` to resume. The seed intentionally creates no users; create accounts through the app so password hashing, confirmation, and onboarding are tested normally.

## Automated tests

### Application checks

Run the same checks used by CI:

```sh
mise run check
```

The unit suite covers rich-text validation, file validation, and shared utilities. A production build also catches Server/Client Component and route compilation problems that type checking alone may miss.

### Database tests

With local Supabase running:

```sh
mise exec -- pnpm db:test
```

This runs the pgTAP database and RLS suites in `supabase/tests`. Run it after every migration or authorization-policy change.

To regenerate TypeScript database types after a schema change:

```sh
mise exec -- pnpm db:types
mise exec -- pnpm typecheck
```

### Public browser tests

Install the Playwright browser once, then run the public desktop and mobile tests:

```sh
mise exec -- pnpm exec playwright install chromium
mise exec -- pnpm test:e2e
```

Playwright starts the Next.js development server automatically, or reuses one already listening on port 3000. The authenticated journey is skipped unless explicitly enabled.

### Authenticated browser test

The authenticated test creates and confirms a disposable user through the Supabase admin API, completes onboarding, captures an idea, promotes it to a public goal, and deletes the test user afterward.

Get the local keys from `mise exec -- pnpm exec supabase status`, then run:

```powershell
$env:E2E_AUTHENTICATED = "1"
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "<PUBLISHABLE_KEY>"
$env:SUPABASE_SECRET_KEY = "<SECRET_KEY>"
mise exec -- pnpm test:e2e --project=chromium
```

On macOS/Linux, provide the same variables for the command:

```sh
E2E_AUTHENTICATED=1 \
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='<PUBLISHABLE_KEY>' \
SUPABASE_SECRET_KEY='<SECRET_KEY>' \
mise exec -- pnpm test:e2e --project=chromium
```

Only run authenticated E2E tests against a disposable local or staging Supabase project. Never point them at production.

### Test reminders locally

The hosted cron schedule is not created in the local stack. Serve and invoke the reminder function manually instead.

Create an ignored file at `supabase/functions/.env.local`:

```dotenv
CRON_SECRET=local-dev-cron-secret
SITE_URL=http://localhost:3000
# Optional: provide these to exercise real email delivery.
RESEND_API_KEY=
RESEND_FROM=Goalpost <reminders@example.com>
```

In one terminal:

```powershell
mise exec -- pnpm exec supabase functions serve process-reminders --no-verify-jwt --env-file supabase/functions/.env.local
```

Create a due reminder in Goalpost, then invoke the function from another terminal:

```powershell
$headers = @{ Authorization = "Bearer local-dev-cron-secret" }
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:54321/functions/v1/process-reminders" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body "{}"
```

The response reports `claimed`, `sent`, and `failed` counts. Without a Resend key, an in-app notification is still created and the external email step is skipped.

## Manual beta smoke test

Before a release, verify this journey in both desktop and narrow mobile viewports:

1. Register, confirm the account through Mailpit, finish onboarding, and verify that Inbox is private.
2. Create a second account and test list sharing as viewer and editor. Confirm that viewers can comment but cannot edit or promote.
3. Create, reorder, edit, archive, complete, and restore ideas. Check the global Archive and Done views retain their source-list labels.
4. Add rich text, a checklist, tags, a link, a valid image, and a valid document. Confirm rejected file types and oversized uploads fail safely.
5. Promote an idea and confirm that the original card disappears, the owner becomes goal admin, accepted editors become collaborators, and viewers are excluded.
6. Open the resulting `/g/{publicId}` page in a private browser window. Verify that the goal, updates, tasks, events, comments, and permitted media are publicly readable.
7. Create parent and child goals, mark one waiting, reopen it, complete it, and check both the visual tree and chronological alternative on `/u/{username}`.
8. Add a task, update, dated delivery event, and reminder. Invoke the local reminder function and check Notifications and Calendar.
9. Test friend requests, goal comments, leaving a collaboration, blocking, invitations, and the blocked-interaction rules.
10. Report a public item and verify the moderator workflow with an admin test account.

To make a local user an admin, run this in Supabase Studio's SQL editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'YOUR_LOCAL_TEST_EMAIL';
```

Log out and back in after changing app metadata. The moderation queue is at `/app/admin`.

## Troubleshooting local development

- **`Unexpected token '<'` or XML returned during signup:** `NEXT_PUBLIC_SUPABASE_URL` is probably set to the Storage S3 endpoint. Change it to `http://127.0.0.1:54321` and restart Next.js.
- **No verification email in the real inbox:** local emails are captured by Mailpit at <http://127.0.0.1:54324>.
- **Supabase does not start:** confirm Docker Desktop is running, then inspect `mise exec -- pnpm exec supabase status` and Docker's container logs.
- **Confirmation returns to the wrong host:** use <http://localhost:3000> and ensure `NEXT_PUBLIC_SITE_URL` matches it.
- **Environment changes have no effect:** stop and restart `mise run dev`; Next.js reads environment variables when the server starts.
- **Local schema is stale:** run `mise exec -- pnpm db:reset`. This deletes local data.

## Deploy Goalpost online

Use separate staging and production environments. Validate migrations, authentication, reminders, uploads, and backups in staging before production.

### Required services and accounts

- A Supabase project for staging and another for production
- A Vercel project connected to this repository
- A production domain
- A Google Cloud OAuth client
- Cloudflare Turnstile site and secret keys
- Resend with a verified sending domain
- A Sentry project
- A private Cloudflare R2 bucket
- A GitHub Actions `production` environment for backup secrets
- An `age` encryption key pair whose private key is stored outside GitHub and R2

### 1. Provision Supabase

For each environment:

1. Create the hosted Supabase project and record its project reference, API URL, publishable key, and secret key.
2. Link the CLI and apply the versioned migrations:

   ```powershell
   mise exec -- pnpm exec supabase login
   mise exec -- pnpm exec supabase link --project-ref <PROJECT_REF>
   mise exec -- pnpm exec supabase db push
   ```

3. Confirm the private `goalpost-media` bucket, RLS policies, database functions, and Realtime configuration created by the migration.
4. Generate hosted database types and review the resulting diff:

   ```powershell
   mise exec -- pnpm exec supabase gen types typescript --linked > src/types/database.generated.ts
   mise exec -- pnpm typecheck
   ```

Migrations are forward-only after deployment. Fix an applied migration with a new migration rather than editing its history.

### 2. Configure authentication

In Supabase Auth settings:

- Set the Site URL to `https://YOUR_DOMAIN`.
- Allow `https://YOUR_DOMAIN/auth/callback` as a redirect URL. Add the staging callback separately; avoid broad production wildcards.
- Keep email confirmation required.
- Configure custom SMTP for production confirmation and password-reset delivery. Resend SMTP may be used with the verified domain.
- Customize and test confirmation and password-reset templates.
- Review password, signup, and email rate limits before opening registration.

For Google OAuth:

1. Create a Web application OAuth client in Google Cloud.
2. Add `https://<PROJECT_REF>.supabase.co/auth/v1/callback` as its authorized redirect URI.
3. Put the Google client ID and secret in the Supabase Google provider settings and enable the provider.
4. Keep `https://YOUR_DOMAIN/auth/callback` in the Supabase redirect allowlist.

### 3. Configure Vercel

Import the GitHub repository into Vercel and set these variables independently for Preview/Staging and Production:

| Variable                               | Purpose                                               |
| -------------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Hosted project API root                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key                             |
| `NEXT_PUBLIC_SITE_URL`                 | Canonical deployment origin, without a trailing slash |
| `SUPABASE_SECRET_KEY`                  | Server-only Supabase secret key                       |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`       | Browser-safe Turnstile site key                       |
| `TURNSTILE_SECRET_KEY`                 | Server-only Turnstile verification key                |
| `NEXT_PUBLIC_SENTRY_DSN`               | Sentry event destination                              |
| `SENTRY_AUTH_TOKEN`                    | Source-map upload token                               |
| `SENTRY_ORG`                           | Sentry organization slug                              |
| `SENTRY_PROJECT`                       | Sentry project slug                                   |

Never expose `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, Resend credentials, cron credentials, or backup credentials through a `NEXT_PUBLIC_` variable.

Add the final domain to Vercel, update DNS, and redeploy after changing environment variables.

### 4. Deploy reminders and email

Create a long random cron secret. Deploy the function without Supabase gateway JWT verification because the function authenticates the cron request with that secret:

```powershell
mise exec -- pnpm exec supabase secrets set `
  CRON_SECRET=<LONG_RANDOM_SECRET> `
  RESEND_API_KEY=<RESEND_API_KEY> `
  "RESEND_FROM=Goalpost <reminders@YOUR_DOMAIN>" `
  SITE_URL=https://YOUR_DOMAIN `
  --project-ref <PROJECT_REF>

mise exec -- pnpm exec supabase functions deploy process-reminders `
  --project-ref <PROJECT_REF> `
  --no-verify-jwt
```

Enable the `pg_cron`, `pg_net`, and Vault integrations in Supabase if they are not already available. In the SQL editor, run `supabase/setup/schedule_reminders.sql.example` after replacing the project URL and secret placeholders. Use exactly the same cron secret in Vault and the Edge Function.

Create a reminder due within a few minutes and confirm:

- the cron job appears in `cron.job_run_details`;
- the Edge Function reports a successful invocation;
- one in-app notification is created;
- one email is delivered when email delivery is enabled;
- retries do not create duplicate notifications or email.

### 5. Configure Turnstile, Sentry, and moderation

- Register the staging and production hostnames in Cloudflare Turnstile and add the matching keys to Vercel.
- Create the Sentry project, configure the DSN and source-map credentials, then trigger and resolve a staging test error.
- Bootstrap the first administrator from a service-role context or the Supabase SQL editor:

  ```sql
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || '{"role":"admin"}'::jsonb
  where email = 'ADMIN_EMAIL';
  ```

Never store the admin role in user-editable `raw_user_meta_data`.

### 6. Configure nightly encrypted backups

Create a private R2 bucket and a lifecycle rule that deletes objects 30 days after creation. Create an `age` key pair; store only its public key in GitHub. Keep the private key in a password manager and an offline recovery location.

In the GitHub `production` environment, configure the secrets consumed by `.github/workflows/nightly-backup.yml`:

- `SUPABASE_DB_URL`
- `SUPABASE_S3_ENDPOINT`
- `SUPABASE_S3_ACCESS_KEY_ID`
- `SUPABASE_S3_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `BACKUP_AGE_PUBLIC_KEY`

Use a Supabase database connection URI that `pg_dump` can reach from GitHub Actions and generate S3 credentials from Supabase Storage settings. Grant the R2 credentials access only to the backup bucket.

Run the **Nightly encrypted backup** workflow manually once. Confirm the dated database, media, checksum, and manifest objects in R2 and inspect `rclone check`. Follow `docs/operations.md` for restore rehearsals, and test a restore into a disposable project at least monthly.

### 7. Production release gate

Before directing users to production:

1. Require CI to pass formatting, linting, type checking, unit tests, the production build, Playwright smoke tests, and database tests.
2. Deploy and test the full manual smoke journey in staging.
3. Apply the same migration commit to production, then deploy the matching application revision.
4. Verify the landing page, legal pages, signup and callback, one private list, idea promotion, a public profile and goal, upload access, reminder delivery, moderation, and account deletion.
5. Confirm Vercel and Sentry monitoring, reminder-failure monitoring, and the most recent encrypted backup.

See `docs/architecture.md` for the permission and data model and `docs/operations.md` for rollout, monitoring, incident handling, backups, and restoration.
