/**
 * The environment the e2e suite runs its dev server in.
 *
 * The suite is deliberately hermetic: it must pass on a fresh clone, with no
 * accounts, no network, and no chance of touching a developer's real data.
 * Every external service is therefore replaced with the app's own documented
 * local fallback, and every credential both sides need is defined here so the
 * server and the specs cannot disagree.
 *
 * | Service            | Live value                    | E2E value                 |
 * | ------------------ | ----------------------------- | ------------------------- |
 * | MongoDB Atlas      | MONGODB_URI                   | "" -> local file store    |
 * | Upstash Redis      | UPSTASH_REDIS_REST_URL/TOKEN  | "" -> in-process limiter  |
 * | Cloudflare Turnstile | TURNSTILE_SECRET_KEY        | "" -> documented bypass   |
 * | Turnstile widget   | real sitekey                  | always-pass test sitekey  |
 * | Admin sign-in      | Atlas admin_users             | local operator credentials |
 *
 * What that gives up is covered elsewhere: the Mongo store by
 * `tests/integration/mongo.test.ts` (on mongodb-memory-server) and the real
 * siteverify round-trip by `tests/unit/turnstile.test.ts`.
 *
 * Previously the specs guessed the admin credentials from `process.env`, which
 * Playwright never loads from `.env.local` — so they silently detached from
 * whatever the server actually accepted the moment an operator set real local
 * credentials. `E2E_SERVER_ENV` makes that impossible.
 */

/** Credentials the e2e server accepts, and the specs present. Dev-only values:
 *  they exist nowhere but this file, and auth is refused outside development. */
export const E2E_ADMIN_EMAIL = "e2e-operator@example.test";
export const E2E_ADMIN_PASSWORD = "e2e-local-file-store-only";

/** Cloudflare's published "always passes" test sitekey. It renders a working
 *  widget on any origin, so the form exercises its real token path without a
 *  registered site. Paired with an empty secret the server takes the dev
 *  bypass and never calls siteverify, so the run needs no outbound network. */
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

/** Overrides applied on top of the shell environment. */
export const E2E_SERVER_ENV: Record<string, string> = {
  // Pin NODE_ENV rather than inheriting it: the dev bypass in
  // src/lib/security/turnstile.ts and the local credentials in
  // src/lib/auth/devSession.ts both key off this value, and a misspelled
  // NODE_ENV in a local .env.local must not be able to weaken them.
  NODE_ENV: "development",
  MONGODB_URI: "",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",
  TURNSTILE_SECRET_KEY: "",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
  ADMIN_DEV_EMAIL: E2E_ADMIN_EMAIL,
  ADMIN_DEV_PASSWORD: E2E_ADMIN_PASSWORD,
  // The published name is pinned rather than inherited: `@next/env` only fills a
  // key that is undefined, so a developer's `.env.local` would otherwise decide
  // what the specs are asserting about titles and metadata. Pinning it here also
  // records that the suite's expectations include the real name, not the old
  // "Your Studio Name" placeholder.
  NEXT_PUBLIC_STUDIO_NAME: "Metaract",
  // No real email may leave a test run. getEmailMode() returns "smtp" the
  // moment GMAIL_USER + GMAIL_APP_PASSWORD + AGENCY_EMAIL are set, and
  // "resend" when RESEND_API_KEY + AGENCY_EMAIL are — both of which may be in a
  // developer's .env.local, so without these overrides the suite could send
  // genuine mail from the operator's real account.
  GMAIL_USER: "",
  GMAIL_APP_PASSWORD: "",
  RESEND_API_KEY: "",
  AGENCY_EMAIL: "",
  EMAIL_FROM: "",
  INTERNAL_NOTIFICATION_EMAIL: "e2e-team@example.test",
  // Never bootstrap real admins from a test run.
  ADMIN_BOOTSTRAP_ALLOWED: "false",
  ALLOW_DEV_ADMIN: "false",
};

/**
 * The shell environment with the overrides applied. Playwright replaces the
 * child environment when `webServer.env` is supplied, so the shell vars
 * (PATH, SystemRoot, ...) have to be carried over explicitly.
 */
export function e2eServerEnv(): Record<string, string> {
  const shell = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
  return { ...shell, ...E2E_SERVER_ENV };
}
