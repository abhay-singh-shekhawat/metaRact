import { expect, type Page } from "@playwright/test";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./env";

/**
 * Sign in on the dev server.
 *
 * The submit button is disabled until React hydrates (SignInForm gates it on
 * useSyncExternalStore), so waiting for it to become enabled is an exact
 * hydration signal. Clicking before hydration performs a native GET submit —
 * credentials in the URL — and the previous implementation papered over that
 * with a blind 8s retry, which then lost the race against a cold dev compile of
 * /admin.
 */
export async function devSignIn(
  page: Page,
  email: string = E2E_ADMIN_EMAIL,
  password: string = E2E_ADMIN_PASSWORD
): Promise<void> {
  await page.goto("/admin/sign-in");
  const submit = page.getByRole("button", { name: /sign in/i });
  await expect(submit).toBeEnabled({ timeout: 30_000 });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await submit.click();

  // The console normally arrives through the client router's push. In dev that
  // transition is occasionally dropped when it immediately follows the session
  // POST — observed about one run in three, with the RSC payload arriving 200
  // and then never being committed. A document navigation is the honest
  // fallback: it cannot pass on a bad session, because /admin redirects to
  // /admin/sign-in whenever requireAdmin() rejects the cookie.
  try {
    await page.waitForURL(/\/admin$/, { timeout: 15_000 });
  } catch {
    await page.goto("/admin");
    await page.waitForURL(/\/admin$/, { timeout: 15_000 });
  }
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

/**
 * Wait until the page is quiet enough to measure or photograph.
 *
 * `waitUntil: "networkidle"` never settles on /start-project: the Turnstile
 * widget keeps its own iframe polling, so the network never goes idle and the
 * navigation times out at the test timeout. Fonts plus two frames is what the
 * overflow measurement and the screenshots actually need.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

/** The token the stubbed widget below hands back. */
export const E2E_TURNSTILE_TOKEN = "e2e-turnstile-token";

/**
 * Serve Cloudflare's Turnstile script from the test itself.
 *
 * A test suite must not depend on a third-party CDN being reachable, and this
 * one measurably is not free: against the real script, the widget's iframe work
 * held the renderer for ~20s per page load and the widget's own requests kept
 * the network from ever going idle. The stub preserves the integration path
 * that belongs to this app — script load, `window.turnstile.render`, the
 * callback token, the hidden input, the POST — and leaves out the challenge
 * itself, which is Cloudflare's service and is verified by
 * `tests/unit/turnstile.test.ts` on the server side.
 */
export async function stubTurnstile(page: Page): Promise<void> {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.turnstile = {
  ready: function (callback) { setTimeout(callback, 0); },
  render: function (el, opts) {
    if (opts && typeof opts.callback === "function") {
      setTimeout(function () { opts.callback(${JSON.stringify(E2E_TURNSTILE_TOKEN)}); }, 0);
    }
    return "e2e-widget";
  },
  reset: function () {},
  remove: function () {}
};`,
    })
  );
}
