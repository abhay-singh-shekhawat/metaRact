# Digital Services Studio — Phase 1 (Lead-generation MVP)

Polished public website + project-enquiry workflow + minimal admin triage,
implemented per `docs/architecture.md` (DSS-ARCH-001 v2.0).

## Stack

Next.js 15 App Router + TypeScript (strict) + Tailwind CSS v4 + Zod.
MongoDB Atlas for production; file-backed store (`.data/studio.json`)
for local development and tests when `MONGODB_URI` is absent.
Gmail SMTP via Nodemailer for transactional email (free, no domain needed;
log-only fallback in dev), with Resend available when a verified domain exists.
Cloudflare Turnstile (fail-closed in production, bypass in dev), Upstash Redis
rate limiting (in-memory fallback in dev).

> No invented business facts: the portfolio shows only approved entries (one
> labelled concept), and the four policy pages publish the operator's supplied
> documents verbatim (`docs/legal/`). Contact details default to empty until
> supplied.

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

1. Create a cluster and database user. For Cloudflare Workers, configure Atlas
   network access as described in `CLOUDFLARE_DEPLOYMENT.md` (Workers have no
   fixed egress IP).
2. Set `MONGODB_URI` (full connection string) and `MONGODB_DB_NAME` in
   `.env.local` / hosting secrets. Collections and indexes are created
   automatically on first use (`ensureIndexes`).
3. Bootstrap the first admin (see below), then set
   `ADMIN_BOOTSTRAP_ALLOWED=false`.

## Email setup

Two transports exist. Gmail SMTP is used whenever it is configured, because it
is free and needs no domain. Resend is used only when Gmail is absent and a
verified domain exists.

### Gmail SMTP (free, default)

1. Enable 2-Step Verification on the Google account, then create an App
   Password (Google Account → Security → App passwords).
2. Set `GMAIL_USER` to that account, `GMAIL_APP_PASSWORD` to the 16-character
   App Password (spaces are ignored), and `AGENCY_EMAIL` to the **same**
   address. Gmail silently rewrites any other `From`, so the app refuses the
   configuration instead.
3. Set `AGENCY_NOTIFICATION_EMAIL` to the founder/team inbox(es) that receive
   new-enquiry alerts; optionally `AGENCY_EMAIL_NAME`, `AGENCY_REPLY_TO`,
   `AGENCY_BCC_EMAIL`.
4. Limits: a free Gmail account can send to roughly 500 recipients per day.
   Exceeding that surfaces as `transient_failure` and is retryable.

SMTP runs over TLS on port 465, which Cloudflare Workers support with
`nodejs_compat` (port 25 is blocked). This was verified in the local `workerd`
runtime, not just in Node.

### Resend (optional alternative)

1. Verify a sending domain in the Resend dashboard. Without a verified domain
   Resend only delivers to the account owner's own address, which is useless
   for customer receipts. `*.workers.dev` cannot be verified: Cloudflare owns
   that zone.
2. Set `RESEND_API_KEY` and leave the Gmail variables blank. Set `AGENCY_EMAIL`
   to an address on the verified domain.

### Either transport

- Without a configured transport the app uses the log-only adapter in
  development. Production records a failed notification instead of a fake
  "sent" status.
- Troubleshoot: `auth_failed` means the credentials or sender identity were
  rejected; `invalid_recipient` means local recipient validation failed (or the
  provider rejected the address); `transient_failure` means a rate limit,
  quota, or network/server issue — the enquiry is still saved and the
  notification can be retried from the admin panel.

Safe delivery check (operator-only; not a public endpoint):

```bash
# Set the server-only email values for this shell first (or point tsx at
# .env.local: pnpm exec tsx --env-file=.env.local --conditions=react-server \
#   scripts/send-test-email.ts you@example.com)
pnpm email:test -- you@example.com
```

The script uses the real sender adapter, sends one message to the address you
pass, and prints only the transport and message id. It does not run in
automated tests.

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
| `pnpm email:test -- you@example.com` | operator-only delivery check (not a route) |

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

- Cloudflare Workers: follow `CLOUDFLARE_DEPLOYMENT.md` for the OpenNext build,
  build-time vs runtime environment split, Atlas networking, Workers Builds,
  verification, and rollback.
- Point `MONGODB_URI` at a dedicated production cluster; verify collections
  and indexes; enable provider backups.
- Configure email (`GMAIL_USER` + `GMAIL_APP_PASSWORD` with a matching
  `AGENCY_EMAIL`, or `RESEND_API_KEY` with a verified-domain `AGENCY_EMAIL`),
  a monitored `AGENCY_NOTIFICATION_EMAIL`, Turnstile keys, Upstash Redis, a
  canonical `NEXT_PUBLIC_SITE_URL` (https), and send a real test with
  `pnpm email:test -- you@example.com`.
- `ADMIN_BOOTSTRAP_ALLOWED=false` in production runtime.
- Approve contact email, services, and portfolio entries; bootstrap founder
  accounts; complete backup test-restore. (Studio name and all four policy pages
  are now supplied and published — see `docs/legal/`.)
- Run `pnpm check:production-config` — it must pass before launch.

## Known limitations

- Local dev uses the file store when `MONGODB_URI` is absent. The MongoDB paths
  were verified against a local replica set in the Workers runtime; connecting
  to Atlas from Cloudflare's edge remains a post-deploy check (see
  `CLOUDFLARE_DEPLOYMENT.md`).
- Email without Gmail SMTP credentials or a Resend key uses the log-only adapter
  in development (marked sent, logged server-side) so the enquiry flow stays
  testable. Production fails the notification instead.
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
