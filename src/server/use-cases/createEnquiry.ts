import { randomUUID } from "crypto";
import {
  enquiryRequestSchema,
  validateServiceDetails,
} from "@/lib/validation/enquiry";
import {
  normalizeEmail,
  payloadFingerprint,
} from "@/lib/security/fingerprint";
import { readStore, writeStore, nextReference } from "@/server/db";
import { sendEmail, teamAlertHtml, customerReceiptHtml } from "@/lib/email/sender";
import { siteConfig } from "@/config/site";
import { getService } from "@/config/services";

export interface CreateInput {
  body: unknown;
  ip: string;
}

export async function createEnquiryUseCase(input: CreateInput) {
  const parsed = enquiryRequestSchema.safeParse(input.body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false as const,
      status: 400,
      code: "validation_failed",
      fieldErrors,
    };
  }
  const data = parsed.data;

  // Honeypot: pretend success without persisting.
  if (data.website && data.website.trim() !== "") {
    return {
      ok: true as const,
      status: 201,
      referenceNumber: "REQ-0000-000000",
      duplicate: false,
      honeypot: true,
    };
  }

  // Specific-date must be a future date when supplied.
  if (data.timelinePreference === "specific_date" && data.preferredDate) {
    const d = new Date(data.preferredDate);
    if (Number.isNaN(d.getTime()) || d.getTime() < Date.now() - 86400000) {
      return {
        ok: false as const,
        status: 400,
        code: "validation_failed",
        fieldErrors: { preferredDate: "Choose a future date (preference only)." },
      };
    }
  }

  const detailsCheck = validateServiceDetails(
    data.serviceSlug,
    (data.serviceDetails ?? {}) as Record<string, unknown>
  );
  if (!detailsCheck.ok) {
    return {
      ok: false as const,
      status: 400,
      code: "validation_failed",
      fieldErrors: { serviceDetails: detailsCheck.error ?? "Invalid details." },
    };
  }

  // Dedupe + normalize URLs
  const urls = Array.from(
    new Set(
      (data.referenceUrls ?? [])
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter(Boolean)
    )
  ).slice(0, 5);

  const normalized = {
    serviceSlug: data.serviceSlug,
    projectTitle: data.projectTitle.trim(),
    projectSummary: data.projectSummary.trim(),
    name: data.name.trim(),
    email: data.email.trim(),
    emailNormalized: normalizeEmail(data.email),
    companyOrOrganization: (data.companyOrOrganization ?? "").trim(),
    phone: (data.phone ?? "").trim(),
    preferredContactMethod: data.preferredContactMethod,
    budgetBand: data.budgetBand ?? null,
    timelinePreference: data.timelinePreference ?? null,
    preferredDate: data.preferredDate ?? null,
    referenceUrls: urls,
    serviceDetails: detailsCheck.cleaned,
    privacyNoticeVersion: data.privacyNoticeVersion || siteConfig.privacyNoticeVersion,
    idempotencyKey: data.idempotencyKey,
    sourcePath: (data.sourcePath ?? "").slice(0, 500),
    utmSource: (data.utmSource ?? "").slice(0, 200),
    utmMedium: (data.utmMedium ?? "").slice(0, 200),
    utmCampaign: (data.utmCampaign ?? "").slice(0, 200),
  };

  const fingerprint = payloadFingerprint(normalized as unknown as Record<string, unknown>);
  const store = await readStore();

  const existing = store.enquiries.find(
    (e) => e.idempotencyKey === normalized.idempotencyKey
  );
  if (existing) {
    if (existing.payloadFingerprint !== fingerprint) {
      return {
        ok: false as const,
        status: 409,
        code: "idempotency_conflict",
        fieldErrors: {},
      };
    }
    return {
      ok: true as const,
      status: 200,
      referenceNumber: existing.referenceNumber,
      duplicate: true,
    };
  }

  const now = new Date().toISOString();
  const referenceNumber = nextReference(store);
  const id = randomUUID();
  const service = getService(normalized.serviceSlug);

  store.enquiries.push({
    id,
    referenceNumber,
    idempotencyKey: normalized.idempotencyKey,
    payloadFingerprint: fingerprint,
    serviceSlug: normalized.serviceSlug,
    status: "new",
    projectTitle: normalized.projectTitle,
    projectSummary: normalized.projectSummary,
    serviceDetails: normalized.serviceDetails,
    name: normalized.name,
    email: normalized.email,
    emailNormalized: normalized.emailNormalized,
    companyOrOrganization: normalized.companyOrOrganization,
    phone: normalized.phone,
    preferredContactMethod: normalized.preferredContactMethod,
    budgetBand: normalized.budgetBand,
    timelinePreference: normalized.timelinePreference,
    preferredDate: normalized.preferredDate,
    referenceUrls: normalized.referenceUrls,
    privacyNoticeVersion: normalized.privacyNoticeVersion,
    privacyNoticeAcknowledgedAt: now,
    assignedTo: null,
    declineReason: null,
    sourcePath: normalized.sourcePath,
    utmSource: normalized.utmSource,
    utmMedium: normalized.utmMedium,
    utmCampaign: normalized.utmCampaign,
    createdAt: now,
    updatedAt: now,
    convertedAt: null,
    archivedAt: null,
  });
  store.events.push({
    id: randomUUID(),
    enquiryId: id,
    actorUserId: null,
    eventType: "created",
    fromStatus: null,
    toStatus: "new",
    summary: `Enquiry ${referenceNumber} created via ${normalized.sourcePath || "/start-project"}.`,
    metadata: { serviceSlug: normalized.serviceSlug },
    createdAt: now,
  });
  const teamRecipient =
    process.env.INTERNAL_NOTIFICATION_EMAIL || "team@example.com";
  store.outbox.push({
    id: randomUUID(),
    enquiryId: id,
    notificationType: "team_new_enquiry",
    recipient: teamRecipient,
    status: "pending",
    attemptCount: 0,
    lastAttemptAt: null,
    sentAt: null,
    providerMessageId: null,
    lastErrorCode: null,
    createdAt: now,
  });
  store.outbox.push({
    id: randomUUID(),
    enquiryId: id,
    notificationType: "customer_receipt",
    recipient: normalized.emailNormalized,
    status: "pending",
    attemptCount: 0,
    lastAttemptAt: null,
    sentAt: null,
    providerMessageId: null,
    lastErrorCode: null,
    createdAt: now,
  });
  await writeStore(store);

  // Best-effort notification: failure must not delete the enquiry.
  const siteUrl = siteConfig.siteUrl;
  const jobs = readOutboxFor(id, store);
  await deliverJobs(jobs, {
    referenceNumber,
    serviceTitle: service?.title ?? normalized.serviceSlug,
    projectTitle: normalized.projectTitle,
    adminUrl: `${siteUrl}/admin/enquiries/${id}`,
    contactEmail: teamRecipient,
    customerEmail: normalized.emailNormalized,
  });

  return { ok: true as const, status: 201, referenceNumber, duplicate: false };
}

function readOutboxFor(enquiryId: string, store: Awaited<ReturnType<typeof readStore>>) {
  return store.outbox.filter((o) => o.enquiryId === enquiryId);
}

async function deliverJobs(
  jobs: Awaited<ReturnType<typeof readStore>>["outbox"],
  ctx: {
    referenceNumber: string;
    serviceTitle: string;
    projectTitle: string;
    adminUrl: string;
    contactEmail: string;
    customerEmail: string;
  }
) {
  const { readStore: rs, writeStore: ws } = await import("@/server/db");
  const store = await rs();
  for (const job of jobs) {
    const row = store.outbox.find((o) => o.id === job.id);
    if (!row || row.status === "sent") continue;
    row.status = "processing";
    row.attemptCount += 1;
    row.lastAttemptAt = new Date().toISOString();
    const isTeam = row.notificationType === "team_new_enquiry";
    const result = await sendEmail({
      to: row.recipient,
      subject: isTeam
        ? `New project enquiry — ${ctx.referenceNumber} — ${ctx.serviceTitle}`
        : `We received your project enquiry — ${ctx.referenceNumber}`,
      html: isTeam
        ? teamAlertHtml(ctx.referenceNumber, ctx.serviceTitle, ctx.projectTitle, ctx.adminUrl)
        : customerReceiptHtml(ctx.referenceNumber, ctx.contactEmail),
      type: row.notificationType,
    });
    if (result.ok) {
      row.status = "sent";
      row.sentAt = new Date().toISOString();
      row.providerMessageId = result.messageId ?? null;
      row.lastErrorCode = null;
    } else {
      row.status = "failed";
      row.lastErrorCode = result.errorCode ?? "send_failed";
    }
  }
  await ws(store);
}
