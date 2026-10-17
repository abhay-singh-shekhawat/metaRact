# Digital Services Studio — Phase 1 (Lead-generation MVP)

Polished public website + project-enquiry workflow + minimal admin triage,
implemented per `docs/architecture.md` (DSS-ARCH-001 v2.0).

## Stack

Next.js 15 App Router + TypeScript (strict) + Tailwind CSS v4 + Zod.
MongoDB Atlas for production; file-backed store (`.data/studio.json`)
for local development and tests when `MONGODB_URI` is absent.
Gmail SMTP via Nodemailer (log-only fallback in dev), Cloudflare Turnstile
(fail-closed in production, bypass in dev), Upstash Redis rate limiting
(in-memory fallback in dev).

> No invented business facts: studio name/contact default to placeholders,
> portfolio shows only approved entries (one labelled concept), policies are
> marked drafts pending legal review.

## Prerequisites

- Node 24 (`cat .nvmrc`), pnpm 9.12.0 (pinned in `packageManager`, and what CI installs)
- No external services required for local dev

## Local setup

```bash
cp .env.example .env.local
# edit .env.local: set ADMIN_DEV_EMAIL / ADMIN_DEV_PASSWORD / ADMIN_SESSION_SECRET
pnpm install
pnpm db:reset
pnpm dev        # http://localhost:3000
```

Local admin sign-in: `/admin/sign-in` with `ADMIN_DEV_EMAIL` + `ADMIN_DEV_PASSWORD`
(defaults `founder@example.com` / `change-me-in-env-local` — change in `.env.local`).

## MongoDB Atlas setup

1. Create a cluster and database user, allow-list your deployment IPs.
2. Set `MONGODB_URI` (full connection string) and `MONGODB_DB_NAME` in
   `.env.local` / hosting secrets. Collections and indexes are created
   automatically on first use (`ensureIndexes`).
3. Bootstrap the first admin (see below), then set
   `ADMIN_BOOTSTRAP_ALLOWED=false`.

## Gmail SMTP setup

1. On the studio Gmail account, enable 2-Step Verification, then create an
   App Password (Google Account → Security → App passwords).
2. Set `GMAIL_USER` (the Gmail address), `GMAIL_APP_PASSWORD` (the 16-char
   app password, no spaces), `EMAIL_FROM`, and `INTERNAL_NOTIFICATION_EMAIL`.
3. Without Gmail credentials the app uses the log-only adapter (marked sent,
   logged server-side) so the enquiry flow stays testable.
4. Troubleshoot: `auth_failed` means the app password is wrong/revoked;
   `transient_failure` means a network/timeout issue — the enquiry is still
   saved and the notification can be retried from the admin panel.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | dev server |
| `pnpm build` / `pnpm start` | production build / serve |
| `pnpm lint` | eslint (Next core-web-vitals + typescript rules) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | vitest unit suite |
| `pnpm test:integration` | file-store integration suite |
| `pnpm test:e2e` | Playwright critical journeys (needs dev server) |
| `pnpm db:reset` | reset local `.data/studio.json` |
| `pnpm check:production-config` | production preflight (fails on placeholders/missing secrets) |

## Admin bootstrap (production)

Run the operator script (never a web endpoint):

```bash
MONGODB_URI=... MONGODB_DB_NAME=... \
  pnpm bootstrap-admin founder@studio.com 'a-strong-password-12+-chars' owner
```

The script runs with `--conditions=react-server` so the `server-only` guard in
the app modules resolves to its no-op build under plain Node. Invoking
`tsx scripts/bootstrap-admin.ts` directly (without that flag) fails with
"This module cannot be imported from a Client Component module".

Revoke: set `isActive=false` on the user in the `admin_users` collection and
delete their rows in `admin_sessions` (or wait for the 12h TTL expiry).

## Deployment & launch blockers

- Point `MONGODB_URI` at a dedicated production cluster; verify collections
  and indexes; enable provider backups.
- Configure Gmail App Password (`GMAIL_USER`, `GMAIL_APP_PASSWORD`),
  verified `EMAIL_FROM`, monitored `INTERNAL_NOTIFICATION_EMAIL`,
  Turnstile keys, Upstash Redis, canonical `NEXT_PUBLIC_SITE_URL` (https).
- `ADMIN_BOOTSTRAP_ALLOWED=false` in production runtime.
- Approve brand name, contact email, services, portfolio entries, and all four
  policy pages; bootstrap founder accounts; complete backup test-restore.
- Run `pnpm check:production-config` — it must pass before launch.

## Known limitations

- Local dev uses the file store when `MONGODB_URI` is absent; the MongoDB
  paths require a live Atlas cluster to verify end-to-end (documented as
  unverified without credentials).
- Email without Gmail credentials uses the log-only adapter (marked sent,
  logged server-side) so the enquiry flow stays testable.
- `ADMIN_DEV_*` fallback auth is development-only; production enforces
  MongoDB-backed admin users + sessions when `MONGODB_URI` is present.

## Notes

- CSP (`next.config.ts`) is strict in production. Development adds
  `'unsafe-eval'` to `script-src` because the Next.js dev client requires it;
  without it, client hydration silently fails. Production never includes it.
- Playwright runs with `workers: 1`: the local dev store is a single JSON
  file with no cross-process locking, so parallel workers would race.
  `tests/e2e/shots.spec.ts` regenerates viewport screenshots for visual review.
- `pnpm check:production-config` reads `process.env` (CI/hosting injects it);
  it is expected to FAIL locally until real production secrets are configured.

## Docs

- `SECURITY.md` — reporting, rotation, revocation, incidents, deletion, backups.
- `docs/architecture.md` — source of truth.
