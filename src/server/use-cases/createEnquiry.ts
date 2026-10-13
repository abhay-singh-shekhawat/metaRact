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
import { isMongoConfigured } from "@/lib/mongodb/client";
import { sendEmail, teamAlertHtml, customerReceiptHtml, getEmailMode } from "@/lib/email/sender";
import { siteConfig } from "@/config/site";
import { getService } from "@/config/services";

export interface CreateInput {
  body: unknown;
  ip: string;
}

export interface NotificationStatus {
  type: "team_new_enquiry" | "customer_receipt";
  to: string;
  status: "sent" | "failed" | "skipped";
  messageId?: string | null;
  errorCode?: string | null;
  /** "log-only" = written to terminal only, no real email left the server. */
  mode: "smtp" | "log-only";
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
    console.log(`[enquiry] honeypot hit — faking success, nothing saved (ip=${input.ip})`);
    return {
      ok: true as const,
      status: 201,
      referenceNumber: "REQ-0000-000000",
      duplicate: false,
      honeypot: true,
      emailMode: getEmailMode(),
      notifications: [] as NotificationStatus[],
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

  // MongoDB Atlas path (production). File-store path below is the local fallback.
  if (isMongoConfigured()) {
    try {
      return await createEnquiryMongoFlow(normalized, fingerprint);
    } catch (err) {
      console.error(`[enquiry] storage FAILED (mongo) detail=${String((err as { message?: unknown })?.message ?? err).slice(0, 200)}`);
      return {
        ok: false as const,
        status: 500,
        code: "storage_failed",
        fieldErrors: { _form: "Could not save your enquiry. Please retry — your text is preserved." },
      };
    }
  }

  let store: Awaited<ReturnType<typeof readStore>>;
  try {
    store = await readStore();
  } catch (err) {
    console.error(`[enquiry] storage FAILED (read) detail=${String((err as { message?: unknown })?.message ?? err).slice(0, 200)}`);
    return {
      ok: false as const,
      status: 500,
      code: "storage_failed",
      fieldErrors: { _form: "Could not save your enquiry. Please retry — your text is preserved." },
    };
  }

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
    console.log(`[enquiry] duplicate replay ref=${existing.referenceNumber} (same submission key, no new email)`);
    return {
      ok: true as const,
      status: 200,
      referenceNumber: existing.referenceNumber,
      duplicate: true,
      emailMode: getEmailMode(),
      notifications: [] as NotificationStatus[],
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
  const emailMode = getEmailMode();
  console.log(`[enquiry] saving service=${normalized.serviceSlug} team_to=${teamRecipient} customer_to=${normalized.emailNormalized} email_mode=${emailMode}`);
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
  try {
    await writeStore(store);
  } catch (err) {
    console.error(`[enquiry] storage FAILED (write) detail=${String((err as { message?: unknown })?.message ?? err).slice(0, 200)}`);
    return {
      ok: false as const,
      status: 500,
      code: "storage_failed",
      fieldErrors: { _form: "Could not save your enquiry. Please retry — your text is preserved." },
    };
  }
  console.log(`[enquiry] saved ref=${referenceNumber} id=${id}`);

  // Best-effort notification: failure must not delete the enquiry.
  const siteUrl = siteConfig.siteUrl;
  const jobs = readOutboxFor(id, store);
  const notifications = await deliverJobs(jobs, {
    referenceNumber,
    serviceTitle: service?.title ?? normalized.serviceSlug,
    projectTitle: normalized.projectTitle,
    adminUrl: `${siteUrl}/admin/enquiries/${id}`,
    contactEmail: teamRecipient,
    customerEmail: normalized.emailNormalized,
  });

  const summary = notifications.map((n) => `${n.type}=${n.status}${n.mode === "log-only" ? "(log-only)" : ""}${n.errorCode ? `(${n.errorCode})` : ""}`).join(" ");
  console.log(`[enquiry] done ref=${referenceNumber} email_mode=${emailMode} ${summary}`);

  return { ok: true as const, status: 201, referenceNumber, duplicate: false, emailMode, notifications };
}

function readOutboxFor(enquiryId: string, store: Awaited<ReturnType<typeof readStore>>) {
  return store.outbox.filter((o) => o.enquiryId === enquiryId);
}

/**
 * MongoDB Atlas creation flow: same validation/normalization as above, then
 * an idempotent Mongo insert (unique idempotency key) followed by best-effort
 * notification delivery. Email failure never deletes the enquiry.
 */
async function createEnquiryMongoFlow(
  normalized: {
    serviceSlug: string;
    projectTitle: string;
    projectSummary: string;
    name: string;
    email: string;
    emailNormalized: string;
    companyOrOrganization: string;
    phone: string;
    preferredContactMethod: string;
    budgetBand: string | null;
    timelinePreference: string | null;
    preferredDate: string | null;
    referenceUrls: string[];
    serviceDetails: Record<string, unknown>;
    privacyNoticeVersion: string;
    idempotencyKey: string;
    sourcePath: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
  },
  fingerprint: string
) {
  const {
    createEnquiryMongo,
    readOutboxForMongo,
    markOutboxProcessingMongo,
    completeOutboxJobMongo,
  } = await import("@/server/mongo-store");
  const teamRecipient =
    process.env.INTERNAL_NOTIFICATION_EMAIL || "team@example.com";
  const created = await createEnquiryMongo(normalized, fingerprint, teamRecipient);
  if (!created.ok) {
    return {
      ok: false as const,
      status: 409,
      code: "idempotency_conflict",
      fieldErrors: {},
    };
  }
  if (created.duplicate) {
    console.log(`[enquiry] duplicate replay ref=${created.referenceNumber} (same submission key, no new email)`);
    return {
      ok: true as const,
      status: 200,
      referenceNumber: created.referenceNumber,
      duplicate: true,
      emailMode: getEmailMode(),
      notifications: [] as NotificationStatus[],
    };
  }
  const service = getService(normalized.serviceSlug);
  const siteUrl = siteConfig.siteUrl;
  const emailMode = getEmailMode();
  console.log(`[enquiry] saving (mongo) service=${normalized.serviceSlug} team_to=${teamRecipient} customer_to=${normalized.emailNormalized} email_mode=${emailMode}`);
  const jobs = await readOutboxForMongo(created.enquiryId);
  const notifications: NotificationStatus[] = [];
  for (const job of jobs) {
    const claimed = await markOutboxProcessingMongo(job.id);
    if (!claimed) continue;
    const isTeam = job.notificationType === "team_new_enquiry";
    console.log(`[enquiry] sending ${job.notificationType} to=${job.recipient} ref=${created.referenceNumber}`);
    let result;
    try {
      result = await sendEmail({
        to: job.recipient,
        subject: isTeam
          ? `New project enquiry — ${created.referenceNumber} — ${service?.title ?? normalized.serviceSlug}`
          : `We received your project enquiry — ${created.referenceNumber}`,
        html: isTeam
          ? teamAlertHtml(
              created.referenceNumber,
              service?.title ?? normalized.serviceSlug,
              normalized.projectTitle,
              `${siteUrl}/admin/enquiries/${created.enquiryId}`
            )
          : customerReceiptHtml(created.referenceNumber, teamRecipient),
        type: job.notificationType,
      });
    } catch (err) {
      console.error(`[enquiry] email THREW ${job.notificationType} to=${job.recipient} detail=${String((err as { message?: unknown })?.message ?? err).slice(0, 200)}`);
      result = { ok: false as const, errorCode: "send_threw", mode: emailMode as "smtp" | "log-only" };
    }
    try {
      await completeOutboxJobMongo(job.id, result);
    } catch (err) {
      console.error(`[enquiry] outbox update FAILED job=${job.id} detail=${String((err as { message?: unknown })?.message ?? err).slice(0, 200)}`);
    }
    console.log(`[enquiry] ${job.notificationType} -> ${result.ok ? "sent" : `FAILED(${result.errorCode ?? "send_failed"})`} to=${job.recipient}${result.mode === "log-only" ? " [log-only, no real email]" : ""}`);
    notifications.push({
      type: job.notificationType,
      to: job.recipient,
      status: result.ok ? "sent" : "failed",
      messageId: result.messageId ?? null,
      errorCode: result.ok ? null : (result.errorCode ?? "send_failed"),
      mode: result.mode ?? emailMode,
    });
  }
  const summary = notifications.map((n) => `${n.type}=${n.status}${n.mode === "log-only" ? "(log-only)" : ""}${n.errorCode ? `(${n.errorCode})` : ""}`).join(" ");
  console.log(`[enquiry] done ref=${created.referenceNumber} email_mode=${emailMode} ${summary}`);
  return {
    ok: true as const,
    status: 201,
    referenceNumber: created.referenceNumber,
    duplicate: false,
    emailMode,
    notifications,
  };
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
): Promise<NotificationStatus[]> {
  const { readStore: rs, writeStore: ws } = await import("@/server/db");
  const notifications: NotificationStatus[] = [];
  let store: Awaited<ReturnType<typeof rs>>;
  try {
    store = await rs();
  } catch (err) {
    console.error(`[enquiry] outbox read FAILED ref=${ctx.referenceNumber} detail=${String((err as { message?: unknown })?.message ?? err).slice(0, 200)}`);
    return notifications;
  }
  for (const job of jobs) {
    const row = store.outbox.find((o) => o.id === job.id);
    if (!row || row.status === "sent") continue;
    row.status = "processing";
    row.attemptCount += 1;
    row.lastAttemptAt = new Date().toISOString();
    const isTeam = row.notificationType === "team_new_enquiry";
    console.log(`[enquiry] sending ${row.notificationType} to=${row.recipient} ref=${ctx.referenceNumber}`);
    let result;
    try {
      result = await sendEmail({
        to: row.recipient,
        subject: isTeam
          ? `New project enquiry — ${ctx.referenceNumber} — ${ctx.serviceTitle}`
          : `We received your project enquiry — ${ctx.referenceNumber}`,
        html: isTeam
          ? teamAlertHtml(ctx.referenceNumber, ctx.serviceTitle, ctx.projectTitle, ctx.adminUrl)
          : customerReceiptHtml(ctx.referenceNumber, ctx.contactEmail),
        type: row.notificationType,
      });
    } catch (err) {
      console.error(`[enquiry] email THREW ${row.notificationType} to=${row.recipient} detail=${String((err as { message?: unknown })?.message ?? err).slice(0, 200)}`);
      result = { ok: false as const, errorCode: "send_threw", mode: getEmailMode() };
    }
    if (result.ok) {
      row.status = "sent";
      row.sentAt = new Date().toISOString();
      row.providerMessageId = result.messageId ?? null;
      row.lastErrorCode = null;
    } else {
      row.status = "failed";
      row.lastErrorCode = result.errorCode ?? "send_failed";
    }
    console.log(`[enquiry] ${row.notificationType} -> ${result.ok ? "sent" : `FAILED(${result.errorCode ?? "send_failed"})`} to=${row.recipient}${result.mode === "log-only" ? " [log-only, no real email]" : ""}`);
    notifications.push({
      type: row.notificationType,
      to: row.recipient,
      status: result.ok ? "sent" : "failed",
      messageId: result.messageId ?? null,
      errorCode: result.ok ? null : (result.errorCode ?? "send_failed"),
      mode: result.mode ?? getEmailMode(),
    });
  }
  try {
    await ws(store);
  } catch (err) {
    console.error(`[enquiry] outbox write FAILED ref=${ctx.referenceNumber} detail=${String((err as { message?: unknown })?.message ?? err).slice(0, 200)}`);
  }
  return notifications;
}
