import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import path from "node:path";
import { settle } from "./helpers";
import { E2E_SERVER_ENV } from "./env";

/**
 * The four policy pages publish operator-supplied legal text, so these specs check the
 * pages against the markdown itself rather than against a copy of it: the expected
 * headings, the section count and the title are all read from `docs/legal/*.md` at run
 * time. A page that quietly drops, merges or reorders a section fails here.
 *
 * Text-level fidelity (no character altered, no paraphrase) is enforced by
 * `tests/unit/legal-content.test.ts`; this is the part that needs a browser.
 */

const DOCS = [
  { route: "/privacy", file: "privacy-policy.md" },
  { route: "/terms", file: "terms-of-service.md" },
  { route: "/cancellation", file: "cancellation-refund-policy.md" },
  { route: "/intellectual-property", file: "intellectual-property-policy.md" },
];

function readDocument(file: string) {
  const source = fs.readFileSync(path.join(process.cwd(), "docs", "legal", file), "utf8");
  const lines = source.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("# "))?.slice(2).trim() ?? "";
  const headings = lines.filter((line) => line.startsWith("## ")).map((line) => line.slice(3).trim());
  return { title, headings };
}

for (const doc of DOCS) {
  test(`policy ${doc.route} publishes the supplied document`, async ({ page }) => {
    const { title, headings } = readDocument(doc.file);
    expect(headings.length, `${doc.file} should have sections`).toBeGreaterThan(5);

    const response = await page.goto(doc.route, { waitUntil: "load" });
    await settle(page);

    expect(response?.status(), doc.route).toBe(200);
    await expect(page).toHaveTitle(`${title} · ${E2E_SERVER_ENV.NEXT_PUBLIC_STUDIO_NAME}`);

    // Every section is published, in order, as a heading.
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.locator("h2")).toHaveCount(headings.length);
    for (const heading of headings) {
      await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
    }

    // The contents rail lists all of them, and shows the first and last. On small
    // screens the rail is a closed <details>, so open it first — the disclosure is
    // part of what is being tested.
    const contents = page.locator(".legal-toc").filter({ visible: true });
    const disclosure = contents.locator("summary");
    if ((await disclosure.count()) > 0) await disclosure.click();
    await expect(contents.getByRole("link", { name: headings[0] })).toBeVisible();
    await expect(contents.getByRole("link", { name: headings[headings.length - 1] })).toBeVisible();

    // Publication facts are stated, and the page no longer claims to be a draft.
    const footerLine = page.locator(".legal-article footer p").first();
    await expect(footerLine).toContainText(/version \d+\.\d+/);
    await expect(footerLine).toContainText(/\d{1,2} \w+ \d{4}/);
    await expect(page.getByText(/pending (business and )?legal review/i)).toHaveCount(0);
    await expect(page.getByText("Draft.", { exact: true })).toHaveCount(0);

    // A section link actually jumps to the section.
    await contents.getByRole("link", { name: headings[2] }).click();
    await expect(page.locator(`#s3`)).toBeInViewport();
  });
}

test("cross-references link to the other policies, never to the page you are on", async ({ page }) => {
  await page.goto("/terms", { waitUntil: "load" });
  await settle(page);

  // /terms §10 and §12 name two other policies in bold; those names become links.
  await expect(page.locator('.legal-article a[href="/intellectual-property"]').first()).toBeVisible();
  await expect(page.locator('.legal-article a[href="/cancellation"]').first()).toBeVisible();

  await page.goto("/privacy", { waitUntil: "load" });
  await settle(page);

  // The privacy policy refers to itself; a self-link would be a navigation trap.
  await expect(page.locator('.legal-article a[href="/privacy"]')).toHaveCount(0);
  // The other three are offered at the foot of the page.
  for (const route of ["/terms", "/cancellation", "/intellectual-property"]) {
    await expect(page.locator(`.legal-article a[href="${route}"]`).first()).toBeVisible();
  }
});
