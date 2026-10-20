import { legalConfig } from "./legal";

/**
 * The name the business is published under. Real since 2026-10-18: the supplied
 * policy documents name it, so it is a configured fact rather than a placeholder
 * awaiting one (docs/legal/). `NEXT_PUBLIC_STUDIO_NAME` can still override it.
 */
const DEFAULT_STUDIO_NAME = "Metaract";

/** Values that mean "nobody has supplied a real name", and must fail the preflight. */
export const PLACEHOLDER_STUDIO_NAMES = ["", "Your Studio Name"];

/**
 * The studio's published inbox, supplied 2026-10-19. A default (not an
 * env-only value) so the contact page never falls back to "will appear here
 * once approved" in production; `NEXT_PUBLIC_CONTACT_EMAIL` still wins.
 */
const DEFAULT_CONTACT_EMAIL = "metaract3x@gmail.com";

const studioName = (process.env.NEXT_PUBLIC_STUDIO_NAME ?? DEFAULT_STUDIO_NAME).trim();

export const siteConfig = {
  studioName,
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  tagline: "A small studio for websites, software, design, and applied AI.",
  heroTitle: "Have an idea? Let's scope it properly.",
  heroSubtitle:
    "We design and build websites, custom software, prototypes, brand assets, and practical AI integrations — scoped in writing, quoted by a human, and handed over cleanly.",
  primaryCta: "Describe your project",
  secondaryCta: "Explore Our Work",
  contactEmail: (
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    process.env.AGENCY_EMAIL ||
    DEFAULT_CONTACT_EMAIL
  ).trim(),
  whatsappUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || "",
  privacyNoticeVersion: legalConfig.version,
  responseNote: "We review every request by hand and reply from the contact details you share.",
  isPlaceholderName: PLACEHOLDER_STUDIO_NAMES.includes(studioName),
};

export function isProductionConfigValid(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (siteConfig.isPlaceholderName) missing.push("NEXT_PUBLIC_STUDIO_NAME");
  if (!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")) missing.push("NEXT_PUBLIC_SITE_URL (must be https)");
  if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
  if (!process.env.MONGODB_DB_NAME) missing.push("MONGODB_DB_NAME");
  if (!process.env.GMAIL_USER) missing.push("GMAIL_USER");
  if (!process.env.GMAIL_APP_PASSWORD) missing.push("GMAIL_APP_PASSWORD");
  if (!process.env.AGENCY_EMAIL && !process.env.EMAIL_FROM)
    missing.push("AGENCY_EMAIL (or EMAIL_FROM)");
  if (!process.env.AGENCY_NOTIFICATION_EMAIL && !process.env.INTERNAL_NOTIFICATION_EMAIL)
    missing.push("AGENCY_NOTIFICATION_EMAIL (or INTERNAL_NOTIFICATION_EMAIL)");
  if (!process.env.TURNSTILE_SECRET_KEY) missing.push("TURNSTILE_SECRET_KEY");
  if (!process.env.UPSTASH_REDIS_REST_URL) missing.push("UPSTASH_REDIS_REST_URL");
  if (!process.env.UPSTASH_REDIS_REST_TOKEN) missing.push("UPSTASH_REDIS_REST_TOKEN");
  return { ok: missing.length === 0, missing };
}

/** Alias used by tests and the production preflight script. */
export const isProductionConfigComplete = isProductionConfigValid;
