import { test } from "@playwright/test";

const shots: Array<{ url: string; name: string; width: number; height: number }> = [
  { url: "/", name: "home-desktop", width: 1440, height: 900 },
  { url: "/", name: "home-mobile", width: 390, height: 844 },
  { url: "/services", name: "services-desktop", width: 1440, height: 900 },
  { url: "/services/ai-automation", name: "service-detail-mobile", width: 390, height: 844 },
  { url: "/start-project", name: "form-desktop", width: 1440, height: 900 },
  { url: "/start-project", name: "form-mobile", width: 390, height: 844 },
  { url: "/pricing", name: "pricing-desktop", width: 1440, height: 900 },
  { url: "/admin/sign-in", name: "admin-signin-desktop", width: 1440, height: 900 },
];

for (const s of shots) {
  test(`shot ${s.name}`, async ({ page }) => {
    await page.setViewportSize({ width: s.width, height: s.height });
    await page.goto(s.url);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/shots/${s.name}.png` });
  });
}
