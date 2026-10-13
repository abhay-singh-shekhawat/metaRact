import { siteConfig } from "@/config/site";

export function GET() {
  const base = siteConfig.siteUrl;
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
