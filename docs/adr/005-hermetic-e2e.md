# ADR-005: The e2e suite runs hermetically, on the app's own local fallbacks

Date: 2026-10-17
Status: Accepted

## Context

`pnpm test:e2e` could not pass on a fresh checkout. It failed four separate ways depending on which external service was missing — live Atlas with a bootstrapped admin, a reachable Upstash instance, a real Cloudflare Turnstile secret, and the operator's Gmail credentials.

Worse, it passed on the author's machine *because* those things happened to be configured: `getEmailMode()` returns `smtp` whenever `GMAIL_USER`/`GMAIL_APP_PASSWORD`/`EMAIL_FROM` are present, so the suite was sending real email and blocking 6–9 s per submission on the SMTP round-trip. The assertions were timing out on Gmail, not on the app.

## Decision

The Playwright config starts the dev server with an explicit environment (`tests/e2e/env.ts`) that replaces every external service with the app's own documented local fallback:

| Variable | Value | Effect |
|---|---|---|
| `MONGODB_URI` | `""` | local file store (`.data/studio.json`) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | `""` | in-process rate limiter |
| `TURNSTILE_SECRET_KEY` | `""` | documented dev bypass |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `EMAIL_FROM` | `""` | log-only email adapter |
| `ADMIN_DEV_EMAIL` / `ADMIN_DEV_PASSWORD` | fixed test values | credentials given to both sides, not guessed |
| `NODE_ENV` | `development` | pinned, not inherited |

`@next/env` only fills in a `.env.local` key that is **undefined**, so an explicit `""` in `webServer.env` reliably wins over a developer's local file. That was verified rather than assumed.

The Cloudflare script is served by a `page.route` stub that emulates `window.turnstile.render`. This keeps the app's real integration path intact — script load → `render` → callback token → hidden input → POST → `siteverify` — while removing the CDN dependency and a measured ~20 s renderer stall per page load that also kept the network permanently busy (which is what `waitUntil: "networkidle"` was really tripping over).

## Consequences

- `pnpm test:e2e` is green on a machine that has never seen Atlas, Upstash, Cloudflare or Gmail. It is the regression net for everything else.
- The MongoDB production path is **not** covered here; it is covered by `tests/integration/mongo.test.ts` against an ephemeral replica set. The `siteverify` call is covered by `tests/unit/turnstile.test.ts` with a mocked fetch. Together they cover the branches the hermetic e2e run deliberately skips.
- Tests can no longer reach a live service even when one is configured locally. That is the point.
- `devSignIn` waits for the submit button to become enabled — an exact hydration signal — instead of racing the form, and falls back to a document navigation if the client router drops the push (observed about one run in three in dev, with the RSC payload arriving 200 and never being committed). The fallback cannot mask a broken session: `/admin` redirects to `/admin/sign-in` when `requireAdmin()` rejects the cookie.
