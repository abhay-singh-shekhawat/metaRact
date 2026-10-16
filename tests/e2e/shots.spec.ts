import { test } from "@playwright/test";
import * as fs from "fs";

/**
 * Visual QA captures. Every public surface is shot at phone and desktop width,
 * and the homepage is additionally swept across small-phone / tablet / laptop /
 * large-desktop so responsive defects are visible in review rather than in
 * production. Files land in `test-results/shots/`.
 */

const PUBLIC_PAGES = [
  "/",
  "/services",
  "/services/websites-digital-experiences",
  "/services/ai-automation",
  "/work",
  "/work/concept-studio-starter",
  "/process",
  "/pricing",
  "/about",
  "/faq",
  "/contact",
  "/start-project",
  "/privacy",
  "/admin/sign-in",
  "/not-a-real-page",
];

const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const HERO_WIDTHS = [
  { name: "xs", width: 320, height: 720 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "wide", width: 1920, height: 1080 },
];

function slugify(path: string): string {
  return path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "-");
}

test.beforeAll(() => {
  fs.mkdirSync("test-results/shots", { recursive: true });
});

for (const page_ of PUBLIC_PAGES) {
  for (const vp of VIEWPORTS) {
    test(`shot ${slugify(page_)}-${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(page_);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `test-results/shots/${slugify(page_)}-${vp.name}.png` });
    });
  }
}

for (const vp of HERO_WIDTHS) {
  test(`shot home-${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await page.waitForTimeout(700);
    await page.screenshot({ path: `test-results/shots/home-${vp.name}.png` });
  });
}
