export const siteConfig = {
  studioName: process.env.NEXT_PUBLIC_STUDIO_NAME || "Your Studio Name",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  tagline: "A small studio for websites, software, design, and applied AI.",
  heroTitle: "Have an idea? Let's scope it properly.",
  heroSubtitle:
    "We design and build websites, custom software, prototypes, brand assets, and practical AI integrations — scoped in writing, quoted by a human, and handed over cleanly.",
  primaryCta: "Describe your project",
  secondaryCta: "Explore Our Work",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  whatsappUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || "",
  privacyNoticeVersion: process.env.PRIVACY_NOTICE_VERSION || "2026-10-01",
  responseNote: "We review every request by hand and reply from the contact details you share.",
  isPlaceholderName: !process.env.NEXT_PUBLIC_STUDIO_NAME || process.env.NEXT_PUBLIC_STUDIO_NAME === "Your Studio Name",
};

export function isProductionConfigValid(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (siteConfig.isPlaceholderName) missing.push("NEXT_PUBLIC_STUDIO_NAME");
  if (!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")) missing.push("NEXT_PUBLIC_SITE_URL (must be https)");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!process.env.EMAIL_FROM) missing.push("EMAIL_FROM");
  if (!process.env.INTERNAL_NOTIFICATION_EMAIL) missing.push("INTERNAL_NOTIFICATION_EMAIL");
  if (!process.env.TURNSTILE_SECRET_KEY) missing.push("TURNSTILE_SECRET_KEY");
  if (!process.env.UPSTASH_REDIS_REST_URL) missing.push("UPSTASH_REDIS_REST_URL");
  if (!process.env.UPSTASH_REDIS_REST_TOKEN) missing.push("UPSTASH_REDIS_REST_TOKEN");
  return { ok: missing.length === 0, missing };
}

/** Alias used by tests and the production preflight script. */
export const isProductionConfigComplete = isProductionConfigValid;
