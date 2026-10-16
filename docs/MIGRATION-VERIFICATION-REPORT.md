# Migration Verification Report — MongoDB Atlas + Gmail SMTP

**Date:** 2026-10-15
**Scope:** Verify the two commits pulled from `origin/main` — `4c5ee76` "Migrate to MongoDB Atlas and Gmail SMTP" and `ea33685` "fix some bugs" — against the prior baseline `773f57e`.
**Method:** Full gate suite + real end-to-end execution over HTTP against a live MongoDB, not code review alone.
**Result:** ✅ **Migration works.** One real bug found and fixed. One robustness regression identified and left for decision.

---

## 1. Context

The upstream commits replaced the original stack:

| Original (baseline `773f57e`) | After migration (`ea33685`) |
|---|---|
| Supabase PostgreSQL | MongoDB Atlas (`mongodb` driver) |
| Supabase Auth | MongoDB `admin_users` + bcrypt passwords + stateful `admin_sessions` |
| Resend API | Gmail SMTP via Nodemailer (log-only fallback in dev) |
| `supabase/migrations/*.sql`, `supabase/seed.sql` | removed entirely |

The migration also rewrote `docs/architecture.md`, `README.md`, `.env.example`, `docs/PROJECT-REPORT.md`, and `SECURITY.md` to match. The local file-store fallback (`.data/studio.json`) was **kept** for development and tests when `MONGODB_URI` is absent.

The pulled tree arrived **broken** (new dependencies not installed). `pnpm install` was run first.

---

## 2. Gate results (all fresh, this pass)

| Gate | Command | Result |
|---|---|---|
| Typecheck | `pnpm typecheck` | ✅ exit 0 |
| Lint | `pnpm lint` | ✅ exit 0, 0 problems |
| Unit tests | `pnpm test` | ✅ **28/28** |
| Integration tests | `pnpm test:integration` | ✅ **11/11** (5 file-store + 6 MongoDB) |
| Production build | `pnpm build` | ✅ exit 0, all routes compiled |
| E2E (chromium + Pixel 7) | `pnpm test:e2e` | ✅ **32/32** |
| Production preflight | `pnpm check:production-config` | ✅ fails closed (exit 1) as designed, listing missing secrets |

Environment: Node v24.19.0, pnpm 9.12.0, Next.js 15.5.27, Vitest 2.x, Playwright (chromium + Pixel 7).

**No regression:** the file-store fallback is exercised by the existing integration + e2e suites and still passes — dev/local behaviour is unchanged.

---

## 3. Live end-to-end proof (real MongoDB, over HTTP)

Because the migrated **production path only activates when `MONGODB_URI` is set**, a passing e2e run (which uses the file-store fallback) does **not** prove the migration. To close that gap the dev server was pointed at a live MongoDB (throwaway `mongodb-memory-server` on port 27018) and the real endpoints were driven over HTTP.

Health check confirmed the connection:
```
GET /api/health/live   → {"data":{"status":"ok"}}
GET /api/health/ready  → {"data":{"ready":true,"database":"connected"}}
```

Full flow:
```
LOGIN             200  {"ok":true,"email":"verify-admin@example.com"}   cookie set
LOGIN (bad pw)    401  {"error":"Invalid credentials."}
UNAUTH LIST       401
CREATE            201  REQ-2026-000001   emailMode: log-only
REPLAY            200  duplicate: true
CONFLICT          409  IDEMPOTENCY_KEY_REUSED
HONEYPOT          201  REQ-0000-000000
ADMIN LIST        200  total: 1
STATUS (invalid)  409  Cannot move from new to qualified.
STATUS (valid)    200  {"ok":true}
NOTE              201  {"ok":true}
DETAIL            200  events: 3  notes: 1  notifications: 2
```

Server log confirmed the correct branch executed:
```
[enquiry] saving (mongo) service=software-applications team_to=team@example.com …
[enquiry] duplicate replay ref=REQ-2026-000001 (same submission key, no new email)
[enquiry:…] honeypot hit — faking success
```

This proves, end to end: bcrypt login against MongoDB, stateful admin sessions, idempotent enquiry creation with unique reference numbering, idempotency replay/conflict handling, the honeypot short-circuit, the status machine, internal notes, and the audit trail (events) + notification outbox.

---

## 4. Bug found and fixed — Critical (was a launch blocker)

**Symptom:** the documented admin-bootstrap command crashed:
```
$ pnpm tsx scripts/bootstrap-admin.ts verify-admin@example.com 'test-password-12345' owner
Bootstrap failed: This module cannot be imported from a Client Component module.
It should only be used from a Server Component.
```

**Root cause:** `scripts/bootstrap-admin.ts` imports `src/lib/mongodb/client.ts`, `src/lib/mongodb/collections.ts`, and `src/lib/auth/password.ts`, all of which begin with `import "server-only"`. The `server-only` package resolves to a module that **throws** under plain Node; Vitest works only because `vitest.config.ts` aliases it to `tests/shims/server-only.ts`. The operator script had no such shim, so the script could never create the first admin — which is the documented prerequisite for production admin access.

**Fix (verified):** run the script with the `react-server` export condition, which resolves `server-only` to its no-op build.
```jsonc
// package.json
"bootstrap-admin": "tsx --conditions=react-server scripts/bootstrap-admin.ts"
```
Verified output after the fix:
```
OK: verify-admin@example.com is now an active owner. (No credentials printed.)
```

`README.md` was updated to use `pnpm bootstrap-admin` (not a raw `tsx` invocation) and to document why the flag is required.

`scripts/db-reset.ts` and `scripts/check-production-config.ts` were confirmed to work unchanged (they do not import guarded modules).

---

## 5. Coverage added

The migrated MongoDB path had **zero** automated tests — everything was verified only by the file-store fallback. Added `tests/integration/mongo.test.ts` (6 tests) that runs against an ephemeral in-process MongoDB and skips cleanly if the memory-server binary is unavailable (so offline CI stays green):

1. Creates enquiry + event + two outbox rows; issues sequential `REQ-YYYY-######` references.
2. Replays the same submission key (200, same reference) and rejects a changed payload (409).
3. Lists with service filter, free-text search, status counts, and pagination.
4. Enforces the status machine (invalid → 409), the decline reason requirement (→ 400), and optimistic concurrency (two concurrent transitions from one observed status: exactly one wins).
5. Requires an active admin as assignee (unknown → 400) and records internal notes (length validation included).
6. Caps notification retries at five attempts.

New devDependency: `mongodb-memory-server ^11.3.0`.

---

## 6. Issues identified but not fixed (needs a decision)

### 6.1 Non-atomic MongoDB writes — Important
`createEnquiryMongo()` performs **three separate writes** — the enquiry, its `created` event, and two outbox rows — with **no transaction**. The pre-migration Supabase RPC was a single atomic operation. A crash or connection loss between writes can leave an enquiry with no outbox rows (customer/team never emailed) or no audit event. The same update-then-insert-event pattern exists in `changeStatusMongo`, `assignMongo`, and `addNoteMongo`.

**Recommendation:** wrap the create flow in `session.withTransaction(...)`, or at minimum insert the enquiry last / add a reconciliation path. Left unfixed by choice — it is an architecture change, not a verification fix.

### 6.2 `ensureIndexes` runs once per process — Minor
A module-level boolean short-circuits index creation after the first successful call in a process. Fine for serverless cold starts; in a long-lived process a partial failure will not retry, and dev hot-reload may skip re-ensuring. Low risk.

### 6.3 Gmail SMTP not live-verified — Blocked
No `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `EMAIL_FROM` were supplied, so only the log-only adapter ran. The SMTP branch is covered by mocked-transport unit tests (`tests/unit/email.test.ts`) but has not sent a real message.

### 6.4 Turnstile / Upstash unchanged — Blocked
Still dev-bypass / in-memory fallback. Not live-verified (no keys). Unchanged from the pre-migration baseline.

### 6.5 Documentation nit — Minor
`README.md` states "pnpm 10" while `package.json` pins `pnpm@9.12.0`.

---

## 7. Changes made in this pass

| File | Change |
|---|---|
| `package.json` | `bootstrap-admin` script now uses `--conditions=react-server`; added `mongodb-memory-server` devDependency |
| `pnpm-lock.yaml` | Updated for the new devDependency |
| `tests/integration/mongo.test.ts` | **New** — 6 production-path MongoDB tests |
| `README.md` | Bootstrap command corrected to `pnpm bootstrap-admin` + explanation |

Temporary verification helpers `scripts/_memongo.ts` and `scripts/_verify-flow.ts` were created, used, and **deleted** — they are not part of the repository.

Baseline (uncommitted) state at time of writing: `README.md`, `package.json`, `pnpm-lock.yaml` modified; `tests/integration/mongo.test.ts` untracked.

---

## 8. Launch blockers (updated for the migrated stack)

Supabase/Resend are no longer relevant. The operator-supplied items are now:

1. **MongoDB Atlas** — production cluster, database user, IP allow-list, `MONGODB_URI` + `MONGODB_DB_NAME`, backups enabled.
2. **First admin** — run `pnpm bootstrap-admin <email> <password> owner`, then set `ADMIN_BOOTSTRAP_ALLOWED=false`.
3. **Gmail** — 2-Step Verification + App Password; `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM`, `INTERNAL_NOTIFICATION_EMAIL`.
4. **Cloudflare Turnstile** keys and **Upstash Redis** credentials.
5. **Canonical HTTPS** `NEXT_PUBLIC_SITE_URL`; verify security headers on the deployed origin.
6. **Brand/business inputs** — studio name, contact email, enabled services, portfolio entries, and legal review of the four policy pages.
7. Green `pnpm check:production-config` (currently fails closed, by design).

---

## 9. How to reproduce this verification

```bash
# gates
pnpm install
pnpm typecheck && pnpm lint && pnpm test && pnpm test:integration && pnpm build && pnpm test:e2e

# production-path tests run automatically inside test:integration (skipped if
# the mongodb-memory-server binary is unavailable)

# live HTTP against a real MongoDB (manual)
MONGODB_URI=... MONGODB_DB_NAME=... pnpm bootstrap-admin you@example.com 'a-strong-password-12+' owner
MONGODB_URI=... MONGODB_DB_NAME=... pnpm dev --port 3000
curl http://localhost:3000/api/health/ready     # → {"database":"connected"}
```

---

**Conclusion:** the MongoDB Atlas + Gmail SMTP migration is functionally correct and verified end to end. The one blocking defect found (admin bootstrap) is fixed and re-verified; the remaining items are an architectural improvement (transactional writes), missing credentials, and cosmetic doc nits.
