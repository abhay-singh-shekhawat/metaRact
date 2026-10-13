/**
 * Production preflight: fails when required public fields remain placeholders
 * or when server secrets needed for production are missing.
 * Run: pnpm check:production-config
 */
const requiredPublic: Array<[string, string[]]> = [
  ["NEXT_PUBLIC_STUDIO_NAME", ["", "Your Studio Name"]],
  ["NEXT_PUBLIC_SITE_URL", [""]],
];

const requiredServer = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "INTERNAL_NOTIFICATION_EMAIL",
  "TURNSTILE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

let failed = false;
for (const [key, bad] of requiredPublic) {
  const v = (process.env[key] || "").trim();
  if (bad.includes(v)) {
    console.error(`MISSING/PLACEHOLDER: ${key}`);
    failed = true;
  }
}
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
if (siteUrl && !siteUrl.startsWith("https://")) {
  console.error("NEXT_PUBLIC_SITE_URL must be a canonical https origin in production.");
  failed = true;
}
for (const key of requiredServer) {
  if (!process.env[key]) {
    console.error(`MISSING: ${key}`);
    failed = true;
  }
}
if (process.env.ADMIN_BOOTSTRAP_ALLOWED === "true") {
  console.error("ADMIN_BOOTSTRAP_ALLOWED must be false for normal production runtime.");
  failed = true;
}
if (failed) {
  console.error("\nProduction preflight FAILED.");
  process.exit(1);
} else {
  console.log("Production preflight OK.");
}
