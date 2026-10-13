import { siteConfig } from "@/config/site";
import { enabledServices } from "@/config/services";
import { approvedWork } from "@/config/work";

export function GET() {
  const base = siteConfig.siteUrl;
  const staticPaths = [
    "",
    "/services",
    "/work",
    "/process",
    "/pricing",
    "/about",
    "/faq",
    "/start-project",
    "/contact",
    "/privacy",
    "/terms",
    "/cancellation",
    "/intellectual-property",
  ];
  const urls = [
    ...staticPaths,
    ...enabledServices().map((s) => `/services/${s.slug}`),
    ...approvedWork().map((w) => `/work/${w.slug}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${base}${u || "/"}</loc></url>`)
    .join("\n")}\n</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
