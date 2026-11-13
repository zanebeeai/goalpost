# Goalpost

Goalpost is a small private app for learning something new every week with a friend. On Sunday each of you picks a topic, from Monday to Thursday you keep notes on it, and on Friday you interview each other with questions the other person can't see until then. You can also each keep up to three short-term goals, each with a target date. On Friday, a short checklist reminds you to write what stuck and check in on each goal with one line. When a goal's date passes, you decide: mark it done, extend it, or drop it.

Built with Next.js, Supabase (Auth and Postgres with row-level security) and Resend for the Sunday and Friday nudge emails.

Signed in, the app has three tabs: **This week** (`/app`), **Up next** (`/app/next`, a shared list of topic ideas) and **History** (`/app/history`), plus **Settings** (`/app/settings`). Everyone belongs to one private space. To bring a friend in, send them the invite link from This week or Settings (`/join/CODE`). It opens signup for someone new (with a link to log in instead), then onboarding, and drops them into your space. Nothing is public except `/` and `/privacy`.

## Local development

You need [mise](https://mise.jdx.dev/) and a Docker-compatible runtime ([OrbStack](https://orbstack.dev/) or Docker Desktop) for the local Supabase stack.

```sh
mise trust && mise install   # pinned Node and pnpm
mise run setup               # pnpm install, supabase start, write .env.local
mise run dev                 # http://localhost:3000
```

- Confirmation and reset emails land in the local mail catcher at http://127.0.0.1:54324.
- Supabase Studio is at http://127.0.0.1:54323.
- Google is turned off in `supabase/config.toml`, so the login and signup pages hide **Continue with Google**. Use email and password. The app shows the button only when the Supabase project reports the Google provider as enabled (checked every 5 minutes).
- To try the nudge job, set `CRON_SECRET` in `.env.local` and run
  `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/nudge`.
  Without `RESEND_API_KEY` and `RESEND_FROM` it returns `{ "skipped": ... }` and sends nothing.

## Scripts

Run them as `mise exec -- pnpm <script>`.

| Script                                  | What it does                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `dev` / `build` / `start`               | Next.js dev server, production build, production server                                         |
| `lint` / `typecheck`                    | ESLint (no warnings allowed) and `tsc --noEmit`                                                 |
| `format` / `format:check`               | Prettier write or check                                                                         |
| `test` / `test:coverage` / `test:watch` | Vitest unit tests                                                                               |
| `test:e2e`                              | Playwright e2e on desktop and phone sizes against the local stack (reuses or starts `pnpm dev`) |
| `db:start` / `db:stop`                  | Start or stop the local Supabase stack                                                          |
| `db:reset`                              | Recreate the local database from `supabase/migrations`                                          |
| `db:test`                               | pgTAP tests in `supabase/tests`                                                                 |
| `db:types`                              | Regenerate `src/types/database.generated.ts` from local                                         |
| `env:local`                             | Write the local Supabase URL and keys into `.env.local`                                         |

`mise run check` runs format check, lint, typecheck, unit tests and build, the same as CI.

## Deploying to a new domain

Below, `YOUR_DOMAIN` is the app's domain (for example `goalpost.example.com`) and `<ref>` is the Supabase project ref.

### 1. Supabase project

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard) and keep the database password.
2. Apply the schema:

   ```sh
   mise exec -- pnpm exec supabase login
   mise exec -- pnpm exec supabase link --project-ref <ref>
   mise exec -- pnpm exec supabase db push --dry-run   # check what will run
   mise exec -- pnpm exec supabase db push
   ```

3. Under **Settings > API Keys**, copy the publishable key (`sb_publishable_...`) and the secret key (`sb_secret_...`). Create them first if the project has none. The project URL is `https://<ref>.supabase.co`.

### 2. Supabase Auth

1. **Authentication > URL Configuration**
   - Site URL: `https://YOUR_DOMAIN`
   - Redirect URLs: `https://YOUR_DOMAIN/**`
   - Optional, for sign-in on Vercel preview deployments: `https://*-<vercel-team-slug>.vercel.app/**`
2. **Authentication > Sign In / Providers > Email**: keep email sign-in enabled and **Confirm email** on.
3. **Authentication > Emails > Templates**: paste the bodies of `supabase/templates/confirmation.html` into **Confirm signup** and `supabase/templates/recovery.html` into **Reset password**, unchanged. Their links point to the app's `/auth/confirm` with a token hash:
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}`

   With Supabase's default links, an email opened in a different browser or device than the one used to sign up (for example, a mail app that opens Safari) fails. These links work anywhere.

4. **Custom SMTP** (required): Supabase's built-in sender only delivers to members of your Supabase team, at about 2 emails an hour. Once Resend is set up (section 3), open **Authentication > Emails > SMTP Settings** and enter:
   host `smtp.resend.com`, port `465`, username `resend`, password a Resend API key, and a sender such as `Goalpost <auth@mail.YOUR_DOMAIN>`.
5. **Google sign-in**
   1. In Google Cloud console, go to **Google Auth Platform > Clients > Create client** and choose **Web application**.
   2. Under Authorized JavaScript origins, add `https://YOUR_DOMAIN`.
   3. Under Authorized redirect URIs, add the callback URL shown on Supabase's Google provider page. It looks like `https://<ref>.supabase.co/auth/v1/callback`.
   4. Under **Data Access**, add the `openid`, `userinfo.email` and `userinfo.profile` scopes. With only these scopes, nobody needs to be added as a test user.
   5. Paste the client ID and secret into Supabase under **Authentication > Sign In / Providers > Google**, then enable the provider. There is no env var for this: once the provider is on, **Continue with Google** appears on the login and signup pages within 5 minutes. Until then it stays hidden.

### 3. Resend

1. In **Domains > Add Domain**, add a subdomain such as `mail.YOUR_DOMAIN`. Add the SPF and DKIM records it shows to your DNS, with no proxying on CNAMEs, and wait until it says Verified. Then add a DMARC record.
2. In **API Keys**, create a key with sending access for the app (`RESEND_API_KEY`). Create a second key for Supabase SMTP so either one can be revoked on its own.

### 4. Vercel project

1. Import the repository as a new Vercel project. Vercel detects Next.js and pnpm on its own.
2. Add these environment variables for **Production** (and Preview, if you use previews):

   | Variable                               | Value                                        |
   | -------------------------------------- | -------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | `https://<ref>.supabase.co`                  |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...`                         |
   | `NEXT_PUBLIC_SITE_URL`                 | `https://YOUR_DOMAIN` (no trailing slash)    |
   | `SUPABASE_SECRET_KEY`                  | `sb_secret_...` (mark it Sensitive)          |
   | `RESEND_API_KEY`                       | The app's Resend key (Sensitive)             |
   | `RESEND_FROM`                          | `Goalpost <nudges@mail.YOUR_DOMAIN>`         |
   | `CRON_SECRET`                          | Output of `openssl rand -hex 32` (Sensitive) |

3. Under **Settings > Domains**, add `YOUR_DOMAIN` and create the DNS record Vercel asks for.
4. Deploy. Environment variables are read at build time, including `NEXT_PUBLIC_*` and the `CRON_SECRET` that the cron sends. After you change any of them, redeploy.

### 5. Nudge cron

`vercel.json` sets up a single cron, `GET /api/cron/nudge` on `0 22 * * *`. Vercel cron expressions are always in UTC. When it runs, Vercel sends `Authorization: Bearer $CRON_SECRET`, and the route returns 401 without a matching header. Each member gets the Sunday "pick a topic" email or the Friday "interview night" email based on their space's timezone. A member is emailed at most once per local day, so a duplicate run sends nothing new.

On the Hobby plan, a cron can run at most once a day. Vercel can start it any time within the hour (here, 22:00 to 22:59 UTC), and it only runs on the production deployment. 22:00 UTC is late afternoon or evening across the US. If you're elsewhere, change the hour, because the job only sends when it's Sunday or Friday in your timezone. Runs are listed under **Schedules > Cron Jobs**.

### 6. Post-deploy checklist

- [ ] Sign up with email. The confirmation comes from your Resend domain, and the link opens onboarding on `YOUR_DOMAIN`.
- [ ] **Continue with Google** shows on `/auth/login`, signs in and returns to the app.
- [ ] A friend opens the invite link from Settings (`/join/...`). They land on signup, confirm their email, and end up in your space after onboarding.
- [ ] `curl -i https://YOUR_DOMAIN/api/cron/nudge` returns 401. With `-H "Authorization: Bearer <CRON_SECRET>"` it returns 200.
- [ ] `/api/cron/nudge` appears under **Schedules > Cron Jobs** in Vercel.
- [ ] `https://YOUR_DOMAIN/robots.txt` disallows `/app`, `/auth`, `/join`, `/onboarding` and `/api`.
- [ ] Supabase **Advisors > Security Advisor** shows no errors.
