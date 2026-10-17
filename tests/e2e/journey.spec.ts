import { test, expect } from "@playwright/test";
import { randomUUID } from "crypto";
import { devSignIn, stubTurnstile } from "./helpers";

test("home -> service -> start-project -> submit -> reference shown", async ({ page }) => {
  await stubTurnstile(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const servicesLink = page.getByRole("link", { name: "Services" }).first();
  if (!(await servicesLink.isVisible())) {
    await page.getByRole("button", { name: /menu/i }).click();
  }
  await servicesLink.click();
  await expect(page).toHaveURL(/\/services/);
  await page.getByRole("link", { name: /Details/ }).first().click();
  await expect(page).toHaveURL(/\/services\//);
  await page.goto("/start-project");
  await page.getByLabel(/Project title/i).fill("E2E test website");
  await page.getByLabel(/Project summary/i).fill(
    "End-to-end test brief with more than thirty characters for validation."
  );
  await page.getByLabel(/Your name/i).fill("E2E Tester");
  await page.getByLabel(/^Email/i).fill(`e2e-${Date.now()}@example.com`);
  await page.getByRole("checkbox", { name: /privacy notice/i }).check();
  await page.getByRole("button", { name: /Submit enquiry/i }).click();
  // Generous: the first enquiry in a run makes the dev server compile the route.
  await expect(page.getByText(/Request received/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/REQ-/)).toBeVisible();
});

test("invalid input shows field errors and preserves input", async ({ page }) => {
  await stubTurnstile(page);
  await page.goto("/start-project");
  await page.getByLabel(/Project title/i).fill("Hi");
  await page.getByRole("button", { name: /Submit enquiry/i }).click();
  await expect(page.getByText(/correct the highlighted fields/i)).toBeVisible();
  await expect(page.getByLabel(/Project title/i)).toHaveValue("Hi");
});

test("unknown slugs do not 500", async ({ page }) => {
  for (const url of ["/services/nope", "/work/nope", "/admin/enquiries/00000000-0000-0000-0000-000000000000"]) {
    const res = await page.goto(url);
    expect(res && res.status()).toBeLessThan(500);
  }
});

test("unauthenticated admin API is denied", async ({ request }) => {
  const res = await request.get("/api/admin/enquiries");
  expect([401, 403, 307]).toContain(res.status());
});

test("admin can sign in, see a new enquiry, and move it to reviewing", async ({ page, request }) => {
  const key = randomUUID();
  // No turnstileToken: the e2e server runs with TURNSTILE_SECRET_KEY="" so the
  // documented dev bypass applies (see tests/e2e/env.ts). A real token cannot
  // be minted outside a browser widget.
  const created = await request.post("/api/public/enquiries", {
    headers: { "Idempotency-Key": key },
    data: {
      idempotencyKey: key,
      serviceSlug: "software-applications",
      projectTitle: "E2E triage dashboard",
      projectSummary: "An end-to-end test brief with more than thirty characters for validation.",
      name: "E2E Admin",
      email: `admin-e2e-${Date.now()}@example.com`,
      privacyNoticeAcknowledged: true,
    },
  });
  expect(created.status()).toBe(201);
  const { data } = await created.json();
  expect(data.referenceNumber).toMatch(/^REQ-/);

  await devSignIn(page);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText(data.referenceNumber).first()).toBeVisible();

  await page.getByText(data.referenceNumber).first().click();
  await expect(page).toHaveURL(/\/admin\/enquiries\//);
  await page.getByLabel(/Change status/i).selectOption("reviewing");
  await page.getByRole("button", { name: /Update status/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  await page.getByLabel(/internal note/i).fill("E2E note: looks qualified, awaiting scope call.");
  await page.getByRole("button", { name: /Add note/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
});
