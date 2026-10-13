import type { Page } from "@playwright/test";

/**
 * Sign in on the dev server. Retries once: if the first click lands before
 * React hydration, the browser performs a native GET submit (visible as
 * ?email= in the URL) instead of the fetch + router.push flow. By the retry,
 * hydration has settled.
 */
export async function devSignIn(page: Page, email: string, password: string) {
  await page.goto("/admin/sign-in");
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    try {
      await page.waitForURL(/\/admin$/, { timeout: 8000 });
      return;
    } catch {
      /* retry once */
    }
  }
  await page.waitForURL(/\/admin$/, { timeout: 8000 });
}
