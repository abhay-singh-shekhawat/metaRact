import { z } from "zod";
import { services } from "@/config/services";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSafeUrlString(v: string): boolean {
  if (typeof v !== "string" || v.length > 2048) return false;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (u.username || u.password) return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost")) return false;
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false;
    if (host === "[::1]" || host === "::1") return false;
    return true;
  } catch {
    return false;
  }
}

const urlSafety = z
  .string()
  .max(2048)
  .refine(isSafeUrlString, { message: "Enter a valid public https URL." });

const websitesDetails = z
  .object({
    purpose: z.enum(["lead_generation", "informational", "portfolio", "ecommerce", "content", "redesign", "other", "not_sure"]).optional(),
    pageCount: z.enum(["1", "2_5", "6_10", "10_plus", "not_sure"]).optional(),
    features: z.array(z.enum(["contact_form", "booking", "authentication", "payments", "ecommerce", "cms", "api_integration", "multilingual", "other", "responsive_design"])).max(10).optional(),
    otherFeatures: z.string().max(1000).optional(),
    existingSiteUrl: urlSafety.optional().or(z.literal("").transform(() => undefined)),
    contentReadiness: z.enum(["ready", "mostly_ready", "needs_help", "not_sure"]).optional(),
    deploymentNeed: z.enum(["yes", "no", "not_sure"]).optional(),
  })
  .strict();

const softwareDetails = z
  .object({
    problemWorkflow: z.string().max(2000).optional(),
    userTypes: z.enum(["internal_team", "external_customers", "both", "not_sure"]).optional(),
    targetEnvironment: z.enum(["web", "mobile", "desktop", "internal_tool", "not_sure"]).optional(),
    mustHaveFeatures: z.string().max(2000).optional(),
    integrations: z.string().max(1500).optional(),
    deploymentNeed: z.enum(["yes", "no", "not_sure"]).optional(),
    maintenanceInterest: z.enum(["yes", "no", "not_sure"]).optional(),
  })
  .strict();

const designDetails = z
  .object({
    fidelity: z.enum(["wireframe", "clickable", "functional_demo", "not_sure"]).optional(),
    screenCount: z.enum(["1_5", "6_10", "11_25", "over_25", "not_sure"]).optional(),
    developmentAlso: z.enum(["yes", "no", "considering", "not_sure"]).optional(),
    targetUsers: z.string().max(1000).optional(),
  })
  .strict();

const aiDetails = z
  .object({
    desiredOutcome: z.string().max(2000).optional(),
    exampleInputOutput: z.string().max(2000).optional(),
    dataRights: z.enum(["owned_or_authorized", "permission_needed", "no_dataset", "not_sure"]).optional(),
    targetEnvironment: z.enum(["existing_app", "web_app", "workflow", "standalone_demo", "not_sure"]).optional(),
    evaluationNeed: z.enum(["yes", "no", "not_sure"]).optional(),
    integrationNeed: z.enum(["yes", "no", "not_sure"]).optional(),
  })
  .strict();

const graphicDetails = z
  .object({
    assetTypes: z.array(z.enum(["social_media", "poster_flyer", "brochure", "brand_identity", "digital_invitation", "presentation", "campaign_assets", "other"])).max(10).optional(),
    otherAssetType: z.string().max(500).optional(),
    quantity: z.number().int().min(1).max(100).nullable().optional(),
    dimensionsOrPlatform: z.string().max(500).optional(),
    usage: z.enum(["digital", "print", "both", "not_sure"]).optional(),
    exportFormats: z.array(z.enum(["png", "jpg", "pdf", "svg", "editable_source", "not_sure"])).max(6).optional(),
    brandAssets: z.enum(["ready", "partial", "not_ready", "not_sure"]).optional(),
  })
  .strict();

export const serviceDetailsSchemas = {
  "websites-digital-experiences": websitesDetails,
  "software-applications": softwareDetails,
  "product-design-prototyping": designDetails,
  "ai-automation": aiDetails,
  "graphic-brand-design": graphicDetails,
} as const;

export type ServiceSlug = keyof typeof serviceDetailsSchemas;

export const enquiryRequestSchema = z.object({
  idempotencyKey: z.string().regex(UUID_RE, "Invalid submission key. Please reload the form."),
  serviceSlug: z
    .string()
    .min(1, "Choose a service.")
    .refine((s) => services.some((x) => x.slug === s && x.enabled), {
      message: "This service is not currently available.",
    }),
  projectTitle: z.string().trim().min(3, "Give your project a short title (min 3 characters).").max(120),
  projectSummary: z.string().trim().min(30, "Describe your project in at least 30 characters.").max(5000),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().max(254).email("Enter a valid email address."),
  privacyNoticeAcknowledged: z.literal(true, {
    errorMap: () => ({ message: "Please acknowledge the Privacy Policy." }),
  }),
  privacyNoticeVersion: z.string().max(20).optional(),
  companyOrOrganization: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  preferredContactMethod: z.enum(["email", "whatsapp"]).optional().default("email"),
  budgetBand: z.enum(["under_10000", "10000_30000", "30000_75000", "75000_150000", "over_150000", "not_sure", "prefer_not_to_say"]).optional(),
  timelinePreference: z.enum(["flexible", "under_1_week", "2_4_weeks", "1_3_months", "specific_date"]).optional(),
  preferredDate: z.string().optional(),
  referenceUrls: z.array(urlSafety).max(5, "Maximum 5 reference links.").optional().default([]),
  serviceDetails: z.record(z.unknown()).optional().default({}),
  turnstileToken: z.string().optional().default(""),
  website: z.string().max(200).optional().default(""), // honeypot
  sourcePath: z.string().max(500).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
});

/** Backwards-compatible alias (same schema). */
export const enquirySchema = enquiryRequestSchema;

export type EnquiryInput = z.infer<typeof enquiryRequestSchema>;

export function validateServiceDetails(slug: string, details: unknown) {
  const schema = (serviceDetailsSchemas as Record<string, z.ZodTypeAny>)[slug];
  if (!schema) return { ok: false as const, error: "This service is not currently available." };
  const parsed = schema.safeParse(details ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first && first.path.length ? ` (${String(first.path[0])})` : "";
    return { ok: false as const, error: `${first?.message ?? "Invalid details."}${where}` };
  }
  // Strip empty-string values; persist only meaningful allowlisted keys.
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data as Record<string, unknown>)) {
    if (v === "" || v === undefined) continue;
    cleaned[k] = v;
  }
  return { ok: true as const, cleaned, data: cleaned };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
