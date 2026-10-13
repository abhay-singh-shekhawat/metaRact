# Digital Services Studio — Complete Project Report

**Spec:** `digital_services_agency_final_architecture.md` (DSS-ARCH-001 v2.0)
**Status:** IMPLEMENTED WITH KNOWN LIMITATIONS (all Phase-1 scope built, verified locally; live third-party integrations await operator credentials)
**Codebase:** ~78 source files, ~4,500 lines TS/TSX + 3 SQL migrations + docs
**Live preview:** http://localhost:3000 (`pnpm dev --port 3000`)

---

## 1. What this is

A polished public website for a three-founder digital-services studio (websites, custom software, product design, brand design, applied AI) combined with a secure lead-intake and internal triage workflow. Visitors read about services, describe a project through a validated form, and receive a traceable `REQ-YYYY-######` reference. Founders review, assign, and advance enquiries in a private admin area. Human review decides scope, price, and acceptance — there is no automated quoting, no payments, no customer portal, no chatbot (all explicitly deferred to later phases).

No business facts are invented: studio name/contact are placeholders gated by the production preflight, portfolio shows one labelled concept, policy pages are marked drafts pending legal review.

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.5.27 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4, CSS-variable tokens, shared component classes |
| Validation | Zod (server-authoritative; browser checks are UX only) |
| Data/auth (production) | Supabase PostgreSQL + Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) |
| Data (local/dev/test) | File-backed JSON store `.data/studio.json` through the same use-cases |
| Email | Resend adapter with log-only dev fallback |
| Anti-abuse | Cloudflare Turnstile (fail-closed prod / bypass dev) + Upstash Redis rate limit (in-memory fallback, 5 per 10 min) |
| Tests | Vitest (unit + integration), Playwright (e2e, chromium + mobile) |
| Package manager | pnpm |

## 3. Architecture (modular monolith, one deployable app)

```
Browser
  ├─ Public pages (Server Components; static/SSG where safe)
  ├─ EnquiryForm / AdminDetailClient / SignInForm ("use client" leaves only)
  └─ fetch → Route Handlers (src/app/api/*)
        ├─ POST /api/public/enquiries → abuse checks → createEnquiryUseCase
        │     (or privileged Supabase RPC when configured)
        └─ /api/admin/* → requireAdmin() → use-cases → store
Server layers (one direction, no skipping):
  validation (Zod schemas, shared types) → use-cases (business rules)
  → repositories/store (server/db.ts file store | Supabase RPC/SQL)
  → policies (adminAuth, statusMachine) → providers (email/rate-limit/Turnstile)
Cross-cutting: request IDs, redacted structured logs, security headers/CSP,
private Cache-Control on admin/API, middleware defense-in-depth redirect.
```

**Submission check order** (deliberate, see `docs/adr/002`): size → origin → rate-limit → honeypot (raw body) → schema → Turnstile → persist. Honeypot returns fake `201 REQ-0000-000000` with zero writes on every branch.

**Enquiry status machine:** `new → reviewing | awaiting_customer | declined | archived`; `reviewing → awaiting_customer | qualified | declined | archived`; `awaiting_customer → reviewing | qualified | declined | archived`; `qualified → converted | reviewing | declined | archived`; `converted → archived`; `declined → archived`; `archived` terminal. Decline/archival require a reason. Every transition appends an audit event atomically; invalid transitions return 409.

## 4. Route inventory (all verified 200; unknown slugs 404, never 500)

**Public (16 + SEO):** `/`, `/services`, `/services/[slug]` ×5 (SSG), `/work`, `/work/[slug]`, `/process`, `/pricing`, `/about`, `/faq`, `/start-project` (+`?service=` preselect), `/contact`, `/privacy`, `/terms`, `/cancellation`, `/intellectual-property`, `/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/icon.svg`.
**Admin (guarded, `force-dynamic`):** `/admin` (counts + recent), `/admin/enquiries` (search/filter/paginate), `/admin/enquiries/[id]` (brief, contact, status, assignment, notes, notifications, timeline), `/admin/settings` (read-only posture, no secrets), `/admin/sign-in` (no public registration).
**APIs:** `POST /api/public/enquiries` (201 new / 200 replay / 409 conflict / 422 validation / 403 anti-abuse / 429+Retry-After / 413 oversize); `GET /api/admin/enquiries` (allowlisted filters); `GET /api/admin/enquiries/[id]` (404 masked); `POST .../[id]/status|assignment|notes`; `POST /api/admin/notifications/[id]/retry`; `GET|POST|DELETE /api/admin/session`; `GET /api/health/live|ready` (coarse, secret-free).

## 5. Codebase map

- `src/app/` — routes above; `layout.tsx` (skip link, header/footer, SEO), `not-found.tsx`, `error.tsx`, `global-error.tsx`, `middleware.ts` (admin cookie-presence redirect; re-checked server-side everywhere).
- `src/components/` — `marketing/Header|Footer|PolicyShell`, `ui/primitives` (Section, Eyebrow, PageHero, ButtonLink, Card), `forms/EnquiryForm` (conditional fieldsets for all 5 pillars, honeypot, idempotency key, focus management, mount-gated submit), `admin/AdminDetailClient|SignInForm` (live-region feedback, mount-gated sign-in, error focus).
- `src/config/` — `site.ts` (typed site config + `isProductionConfigComplete` preflight), `services.ts` (5 pillars, canonical slugs, deliverables/exclusions/FAQs/SEO), `work.ts` (approval + concept flags), `navigation.ts`.
- `src/lib/` — `validation/enquiry.ts` (request schema, 5 discriminated detail schemas, SSRF-safe `isSafeUrlString`), `security/fingerprint.ts` (canonical SHA-256, email normalize, `REQ-` refs), `security/turnstile.ts`, `rate-limit/limiter.ts` (Upstash → bounded memory fallback), `email/sender.ts` (Resend → log-only), `auth/devSession.ts` (HMAC cookie, `isDevAuthAllowed` gate), `supabase/server-privileged.ts` (`server-only`), `observability/log.ts` (PII redaction, CR/LF sanitize).
- `src/server/` — `db.ts` (atomic tmp+rename JSON store, `resetStoreForTests`), `use-cases/createEnquiry.ts` (validate → honeypot → idempotency → atomic insert + event + 2 outbox rows → best-effort notify), `use-cases/admin.ts` (list/get/status/assign/note/retry), `policies/adminAuth.ts` (Supabase+membership → gated dev fallback), `policies/statusMachine.ts`.
- `supabase/migrations/` — `0001` schema, `0002` RLS (deny-anon, `is_active_admin()` helper, read-own/admin-read policies, no direct writes), `0003` RPC contracts A–E (public create, status change, assign, note, notification claim/complete/retry) with fixed `search_path`, least-privilege revokes/grants, stable error codes.
- `scripts/` — `check-production-config.ts` (fail-closed preflight), `bootstrap-admin.ts` (operator-only membership upsert), `db-reset.ts`.
- `tests/` — unit (schemas, URLs, fingerprint, transitions, preflight), integration (atomicity, idempotency, transitions, notes, failure survival, honeypot), e2e (5 journeys × 2 viewports + route sweep + screenshots + `helpers.ts` hydration-safe sign-in).
- `docs/adr/` — 001 CTA rename, 002 check ordering. `.impeccable/critique/` — archived design critique (22/32, Acceptable).

## 6. Data schema (production PostgreSQL; local store mirrors it)

- **`admin_memberships`** — `user_id` PK/FK `auth.users`, `role` owner|member, `is_active` default true, `created_at`, `created_by`. RLS: read own row only; no self-edit.
- **`enquiries`** — `id` UUID PK, `reference_number` unique (`REQ-YYYY-######`, sequence-backed, server-generated), `idempotency_key` UUID unique, `payload_fingerprint` SHA-256, `service_slug`, `status` enum (7 states, default `new`), `project_title` (3–120), `project_summary` (30–5000, plain text), `service_details` JSONB object (allowlisted keys only), `name`, `email` + `email_normalized` (indexed), `company_or_organization`, `phone`, `preferred_contact_method` email|whatsapp, `budget_band` / `timeline_preference` (planning enums), `preferred_date` (preference only), `reference_urls` JSONB array (≤5, validated), `privacy_notice_version` + `privacy_notice_acknowledged_at`, `assigned_to` FK (must be active admin), `decline_reason` (internal), `source_path` + `utm_*` (allowlisted only), `created_at/updated_at`, `converted_at`, `archived_at`. Indexes: created desc, (status, created), (service, created), assigned_to, email. Money: none stored (no quotes/payments in Phase 1).
- **`enquiry_events`** — append-only: `enquiry_id` cascade, `actor_user_id` (null = system), `event_type` allowlist, `from/to_status`, redacted `summary`, small `metadata` JSONB.
- **`enquiry_internal_notes`** — `enquiry_id` cascade, `author_user_id`, `body` 1–5000. Never emailed, never in public responses/analytics.
- **`notification_outbox`** — `enquiry_id` cascade, `team_new_enquiry|customer_receipt` (unique per enquiry+type), `pending|processing|sent|failed`, `attempt_count` (cap 5), timestamps, `provider_message_id`, safe `last_error_code`. Created in the same transaction as the enquiry; provider outage never loses the enquiry.

## 7. Design system

Tokens: `--bg #F7F8FA, --surface #fff, --ink #151923, --ink-2 #596273, --border #DDE2EA, --action #315BE8, --action-hover #2446BE`; radii 6/10/16; system sans; 1160px container; shared `.card/.btn-primary/.btn-secondary/.field-*` classes; 3px visible focus; `prefers-reduced-motion` kill-switch; 44px targets; single-line desktop nav; mobile single-column, icon-only logo under 420px. Single primary CTA label centralized on `siteConfig.primaryCta` ("Describe your project", ADR-001).

## 8. Verification log (all executed)

`typecheck` ✅ · `lint` ✅ (0 problems) · unit 17/17 ✅ · integration 5/5 ✅ · `build` ✅ (30+ routes) · e2e **32/32** (chromium + Pixel 7) ✅ · live curl smoke (201→200→409→422→401, sign-in→list→detail→409→200) ✅ · sweep: all 200s, zero console errors (except intentional 404 documents), zero overflow ✅ · 8+ viewport screenshots inspected ✅ · secret scan clean ✅ · preflight fails closed without prod secrets ✅ · independent dual-oracle QA: PASS ✅ · impeccable critique archived (22/32) with detector-clean static scan ✅.

## 9. Launch blockers (operator)

Brand name/logo, contact + sender emails + verified domain, enabled-services confirmation, portfolio decision, policy legal review, separate Supabase prod project + applied migrations + RLS review, 3 founder invites + bootstrap script, secrets/Turnstile/Upstash config, `ADMIN_BOOTSTRAP_ALLOWED=false`, email deliverability test, HTTPS/header check, backup test-restore, green preflight. Deferred by design: uploads, quotes, payments, customer portal, chatbot, CMS, analytics beyond aggregates.
