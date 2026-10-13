import { test, expect } from "@playwright/test";
import * as fs from "fs";
import { devSignIn } from "./helpers";

const ROUTES = [
  "/", "/services", "/services/websites-digital-experiences",
  "/services/software-applications", "/services/product-design-prototyping",
  "/services/ai-automation", "/services/graphic-brand-design",
  "/services/does-not-exist", "/work", "/work/concept-studio-starter",
  "/work/does-not-exist", "/process", "/pricing", "/about", "/faq",
  "/start-project", "/start-project?service=ai-automation", "/contact",
  "/privacy", "/terms", "/cancellation", "/intellectual-property",
  "/robots.txt", "/sitemap.xml", "/admin/sign-in",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const findings: Array<Record<string, unknown>> = [];

for (const vp of VIEWPORTS) {
  test(`sweep ${vp.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    let currentErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") currentErrors.push(m.text().slice(0, 200));
    });
    for (const route of ROUTES) {
      // Raw endpoints have no viewport/overflow semantics; still assert status.
      const isRaw = route === "/robots.txt" || route === "/sitemap.xml";
      currentErrors = [];
      const res = await page.goto(route, { waitUntil: "networkidle" });
      const status = res?.status() ?? -1;
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const title = await page.title();
      const shot = `test-results/qa/${testInfo.project.name}-${vp.name}${route === "/" ? "-home" : route.replace(/[^a-z0-9]+/gi, "-")}.png`;
      await page.screenshot({ path: shot, fullPage: false });
      findings.push({ viewport: vp.name, route, status, consoleErrors: isRaw ? [] : [...currentErrors], hOverflow: isRaw ? 0 : overflow, title });
      expect(status, `${vp.name} ${route}`).toBeLessThan(500);
    }
    fs.writeFileSync(`test-results/qa/sweep-${vp.name}.json`, JSON.stringify(findings.filter((f) => f.viewport === vp.name), null, 2));
  });
}

test("sweep admin authed", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const adminErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") adminErrors.push(m.text().slice(0, 200));
  });
  await devSignIn(
    page,
    process.env.ADMIN_DEV_EMAIL || "founder@example.com",
    process.env.ADMIN_DEV_PASSWORD || "change-me-in-env-local"
  );
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  for (const route of ["/admin", "/admin/enquiries", "/admin/settings"]) {
    adminErrors.length = 0;
    const res = await page.goto(route, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.screenshot({ path: `test-results/qa/${testInfo.project.name}-admin${route.replace(/[^a-z0-9]+/gi, "-")}.png` });
    findings.push({ viewport: "desktop", route, status: res?.status() ?? -1, consoleErrors: [...adminErrors], hOverflow: overflow, title: await page.title() });
    expect(res?.status(), route).toBeLessThan(500);
  }
  fs.writeFileSync("test-results/qa/sweep-admin.json", JSON.stringify(findings.filter((f) => String(f.route).startsWith("/admin")), null, 2));
});
