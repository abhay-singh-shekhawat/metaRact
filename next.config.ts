import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// 'unsafe-eval' is required by the Next.js development client runtime only.
// Production stays strict; dev reloads still work under the relaxed directive.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"
  : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // All images are local files under public/ and are already small (the largest
  // is ~160 KB). Cloudflare Workers has no next/image optimizer of its own; its
  // Images binding is a separate, billed product. Serving the originals keeps
  // deployment working on any Workers plan without changing the markup.
  images: {
    unoptimized: true,
  },
  // Hide the Next.js dev-tools indicator (the floating "N" button).
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://challenges.cloudflare.com https://*.upstash.io",
              "frame-src https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
