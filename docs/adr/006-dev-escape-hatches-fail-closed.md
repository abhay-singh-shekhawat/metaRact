# ADR-006: Development escape hatches fail closed

Date: 2026-10-17
Status: Accepted

## Context

Two code paths exist to make local development possible without live credentials: a Turnstile bypass and a signed "dev admin" cookie. Both decided whether they were allowed with a *negative* test:

```ts
const isProd = process.env.NODE_ENV === "production";   // Turnstile bypass enabled when false
```

A negative test fails **open**. Anything that is not exactly `"production"` — an empty string, a typo, a bare script with no `NODE_ENV` at all — enabled the bypass. The deployed `.env.local` in this repository contained `NODE_ENV=developments`, which is precisely that mistake, and no warning was produced.

The dev-admin path was worse: it silently falls back to a hard-coded signing secret (`"dev-only-secret-change-me"`) when `ADMIN_SESSION_SECRET` is unset, so an unrecognised `NODE_ENV` in a production deployment would have accepted locally-forgeable admin cookies.

## Decision

Both paths require a **recognised** non-production value:

- `verifyTurnstile`: the bypass opens only for `NODE_ENV === "development" | "test"`. Anything else, including unset, means verification is required — and with no `TURNSTILE_SECRET_KEY` configured it fails closed with `TURNSTILE_NOT_CONFIGURED` rather than passing.
- `isDevAuthAllowed()`: `development`/`test`, or an explicit `ALLOW_DEV_ADMIN=true` as the documented emergency operator path. Nothing else.

The `.env.local` typo was corrected at the same time.

## Consequences

- An unset or unrecognised `NODE_ENV` can no longer disable anti-abuse or enable a local admin session.
- A misconfigured deployment now fails loudly (submissions rejected, sign-in refused) instead of quietly accepting unverified input.
- The emergency operator path still exists, but it must be asked for explicitly and is visible in the environment.
- Both branches have unit tests, including a regression test for `NODE_ENV="developments"` — the exact value that was live in this repository.
