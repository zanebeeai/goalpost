# Goalpost operations

## Deployment order

1. Apply migrations to staging.
2. Generate TypeScript database types and review any unexpected diff.
3. Deploy the reminder Edge Function and its secrets.
4. Run the reminder scheduling SQL and make one test reminder due.
5. Deploy the Vercel preview and execute the browser smoke suite against staging.
6. Apply the same migration commit to production.
7. Deploy production and verify `/`, a public profile, authentication callback, one private list, one promotion, and one reminder.

Database migrations are forward-only. Create a corrective migration rather than editing an applied migration.

## Required monitoring

- Vercel build and request failures
- Sentry frontend, server, and Edge runtime errors
- `cron.job_run_details` failures for the reminder job
- `reminders` rows left in `failed` after five attempts
- Open reports and account suspensions
- GitHub backup workflow completion and `rclone check` output

The reminder function returns claimed/sent/failed counts and logs individual delivery errors. A service operator should investigate repeated Resend failure before replaying rows.

## Backups

The nightly workflow makes a dated full snapshot under `YYYY-MM-DD/`:

- an age-encrypted custom-format Postgres dump
- every object from the private `goalpost-media` bucket
- checksums and an object manifest

Configure a private R2 lifecycle rule that deletes objects 30 days after creation. Keep the age private key outside GitHub and R2, ideally in a password manager and one offline recovery location.

### Restore rehearsal

Perform this monthly against a disposable Supabase project:

```bash
stamp=YYYY-MM-DD
rclone copy "R2:${R2_BUCKET}/${stamp}" ./restore
age -d -i age-private-key.txt -o database.dump ./restore/database/database.dump.age
createdb goalpost_restore_test
pg_restore --no-owner --no-acl --dbname goalpost_restore_test database.dump
rclone check ./restore/media "SUPABASE_RESTORE:goalpost-media" --one-way
```

For a real restore, disable writes first, restore the database into a clean project, copy media into the new private bucket, regenerate Storage access credentials, deploy the same application revision, and execute the acceptance checklist before changing DNS.

## Account deletion and backup retention

Deletion first transfers shared administration and removes sole-owned data in a transaction, then deletes the Supabase Auth user. Database foreign keys anonymize retained shared authorship. Production data disappears immediately; encrypted snapshots retain the previous state until their 30-day lifecycle expiry. The Privacy Notice communicates this window.

## Incident notes

- Suspending an account hides its profile through RLS and prevents new writes, but moderators must separately resolve reports to hide already-public goal content.
- A block cannot revoke public web access. It stops authenticated comments, friendship requests, and collaboration invitations.
- If an upload is reported as unsafe, hide the attachment first, then delete the Storage object after preserving only the minimum evidence required for the moderation audit.
- Rotate Supabase secret, Resend, Turnstile, Sentry, R2, and backup credentials independently. Never expose a server secret through a `NEXT_PUBLIC_` variable.
