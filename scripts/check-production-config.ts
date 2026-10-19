/**
 * Production preflight: fails when a required public field is still a placeholder
 * or when server secrets needed for production are missing.
 * Run: pnpm check:production-config
 */
import { siteConfig } from "../src/config/site";

let failed = false;

// The studio name is a configured fact now (the supplied policies in docs/legal/ name
// the business), so this gate is no longer "set the env var" but "never deploy a
// placeholder" — it fails if the name resolves to one, however it got there. The
// resolution rule lives in src/config/site.ts so the app and this check cannot drift.
if (siteConfig.isPlaceholderName) {
  console.error("MISSING/PLACEHOLDER: NEXT_PUBLIC_STUDIO_NAME");
  failed = true;
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
if (!siteUrl) {
  console.error("MISSING/PLACEHOLDER: NEXT_PUBLIC_SITE_URL");
  failed = true;
} else if (!siteUrl.startsWith("https://")) {
  console.error("NEXT_PUBLIC_SITE_URL must be a canonical https origin in production.");
  failed = true;
}

const requiredServer = [
  "MONGODB_URI",
  "MONGODB_DB_NAME",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "EMAIL_FROM",
  "INTERNAL_NOTIFICATION_EMAIL",
  "TURNSTILE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

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
