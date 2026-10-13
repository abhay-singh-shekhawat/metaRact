# Digital Services Studio — Phase 1 (Lead-generation MVP)

Polished public website + project-enquiry workflow + minimal admin triage,
implemented per `digital_services_agency_final_architecture.md` (DSS-ARCH-001 v2.0).

## Stack

Next.js 15 App Router + TypeScript (strict) + Tailwind CSS v4 + Zod.
Supabase Auth/PostgreSQL for production; file-backed store (`.data/studio.json`)
for local development and tests when Supabase env is absent.
Resend adapter (log-only fallback in dev), Cloudflare Turnstile (fail-closed in
production, bypass in dev), Upstash Redis rate limiting (in-memory fallback in dev).

> No invented business facts: studio name/contact default to placeholders,
> portfolio shows only approved entries (one labelled concept), policies are
> marked drafts pending legal review.

## Prerequisites

- Node 24 (`cat .nvmrc`), pnpm 10
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

1. Invite/create the founder user in the Supabase dashboard (email verified).
2. Run the operator script (never a web endpoint):
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \
     pnpm tsx scripts/bootstrap-admin.ts founder@studio.com owner
   ```
3. Revoke: set `is_active=false` in `admin_memberships` and revoke the user's
   Supabase session in the dashboard.

## Deployment & launch blockers

- Apply `supabase/migrations/0001_phase1_schema.sql` to a dedicated production
  project; review RLS/policies table-by-table.
- Configure verified sender domain (`EMAIL_FROM`), monitored `INTERNAL_NOTIFICATION_EMAIL`,
  Turnstile keys, Upstash Redis, canonical `NEXT_PUBLIC_SITE_URL` (https).
- `ADMIN_BOOTSTRAP_ALLOWED=false` in production runtime.
- Approve brand name, contact email, services, portfolio entries, and all four
  policy pages; invite/verify founder accounts; complete backup test-restore.
- Run `pnpm check:production-config` — it must pass before launch.

## Known limitations

- Local dev uses the file store; Supabase RLS/RPC paths are implemented in SQL
  (`supabase/migrations`) and the app's Supabase branch but require a live project
  to verify end-to-end (documented as unverified without credentials).
- Email without `RESEND_API_KEY` uses the log-only adapter (marked sent, logged
  server-side) so the enquiry flow stays testable.
- `ADMIN_DEV_*` fallback auth is development-only; production enforces Supabase
  Auth + `admin_memberships` when Supabase env is present.

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
- `digital_services_agency_final_architecture.md` — source of truth.
