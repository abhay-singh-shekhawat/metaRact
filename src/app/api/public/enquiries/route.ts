import { NextResponse } from "next/server";
import { createEnquiryUseCase } from "@/server/use-cases/createEnquiry";
import { checkEnquiryRateLimit, rateLimitKey } from "@/lib/rate-limit/limiter";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { enquiryRequestSchema } from "@/lib/validation/enquiry";
import { isSupabaseConfigured, serviceClient } from "@/lib/supabase/server-privileged";
import { siteConfig } from "@/config/site";
import { logEvent } from "@/lib/observability/log";

export const runtime = "nodejs";

let counter = 0;
function requestId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}`;
}

function errEnvelope(code: string, message: string, rid: string, fieldErrors?: Record<string, string>, status = 422) {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) }, requestId: rid },
    { status }
  );
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const rid = requestId();
  try {
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > 32 * 1024) {
      return errEnvelope("PAYLOAD_TOO_LARGE", "Request too large. Please shorten your brief.", rid, undefined, 413);
    }

    // Same-origin check in production (defense-in-depth; validated server-side).
    if (process.env.NODE_ENV === "production") {
      const origin = req.headers.get("origin");
      if (origin) {
        try {
          if (new URL(origin).origin !== new URL(siteConfig.siteUrl).origin) {
            return errEnvelope("FORBIDDEN", "Request could not be processed.", rid, undefined, 403);
          }
        } catch {
          return errEnvelope("FORBIDDEN", "Request could not be processed.", rid, undefined, 403);
        }
      }
    }

    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > 32 * 1024) {
      return errEnvelope("PAYLOAD_TOO_LARGE", "Request too large. Please shorten your brief.", rid, undefined, 413);
    }
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return errEnvelope("VALIDATION_ERROR", "Please correct the highlighted fields.", rid, {
        _form: "Invalid request format.",
      });
    }

    // Check order is deliberate (see docs/adr/002-submission-check-ordering.md):
    // size → origin → rate-limit → honeypot → schema → Turnstile.
    // Rate limiting runs before the honeypot short-circuit so bot traffic
    // still consumes budget; the honeypot check runs on the raw body before
    // schema validation so bots get no 422-vs-201 oracle.

    // Abuse controls before any persistence.
    const rl = await checkEnquiryRateLimit(rateLimitKey(clientIp(req)));
    if (!rl.success) {
      const res = errEnvelope(
        "RATE_LIMITED",
        "Too many attempts. Please wait a few minutes and try again.",
        rid,
        undefined,
        429
      );
      res.headers.set("Retry-After", "600");
      return res;
    }

    // Honeypot: pretend success without persisting. Applies to every
    // persistence branch below (local use-case and Supabase RPC alike).
    const bodyRecord = body as Record<string, unknown>;
    if (typeof bodyRecord.website === "string" && bodyRecord.website.trim() !== "") {
      return NextResponse.json(
        { data: { referenceNumber: "REQ-0000-000000", received: true }, requestId: rid },
        { status: 201 }
      );
    }

    // Early structural parse for the idempotency-key header comparison.
    const prelim = enquiryRequestSchema.safeParse(body);
    if (!prelim.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of prelim.error.issues) {
        const k = String(issue.path[0] ?? "_form");
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      return errEnvelope("VALIDATION_ERROR", "Please correct the highlighted fields.", rid, fieldErrors);
    }
    const headerKey = req.headers.get("idempotency-key");
    if (headerKey && headerKey !== prelim.data.idempotencyKey) {
      return errEnvelope("VALIDATION_ERROR", "Please reload the form and try again.", rid, {
        _form: "Submission key mismatch.",
      });
    }

    const ts = await verifyTurnstile(prelim.data.turnstileToken, clientIp(req));
    if (!ts.ok) {
      return errEnvelope(
        "ANTI_ABUSE_FAILED",
        "Anti-abuse verification failed. Please reload and try again.",
        rid,
        undefined,
        403
      );
    }

    if (isSupabaseConfigured()) {
      return await createViaSupabase(body, rid);
    }

    const result = await createEnquiryUseCase({ body, ip: clientIp(req) });
    if (!result.ok) {
      if (result.status === 409) {
        return errEnvelope(
          "IDEMPOTENCY_KEY_REUSED",
          "This submission was already used with different details. Please reload the form for a new enquiry.",
          rid,
          undefined,
          409
        );
      }
      return errEnvelope("VALIDATION_ERROR", "Please correct the highlighted fields.", rid, result.fieldErrors);
    }
    logEvent({ level: "info", route: "POST /api/public/enquiries", code: result.duplicate ? "DUPLICATE_REPLAY" : "CREATED", requestId: rid });
    return NextResponse.json(
      { data: { referenceNumber: result.referenceNumber, received: true }, requestId: rid },
      { status: result.status }
    );
  } catch {
    logEvent({ level: "error", route: "POST /api/public/enquiries", code: "UNHANDLED", requestId: rid });
    return errEnvelope("INTERNAL_ERROR", "Something went wrong. Your request was not confirmed — please retry.", rid, undefined, 500);
  }
}

/**
 * Production path: validated payload goes through the privileged
 * `create_public_enquiry` RPC (single transaction: enquiry + event + outbox).
 * Never reachable in local dev without Supabase credentials.
 */
async function createViaSupabase(body: unknown, rid: string) {
  const { validateServiceDetails, normalizeEmail } = await import("@/lib/validation/enquiry");
  const { payloadFingerprint } = await import("@/lib/security/fingerprint");
  const { getService } = await import("@/config/services");

  const parsed = enquiryRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "_form");
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return errEnvelope("VALIDATION_ERROR", "Please correct the highlighted fields.", rid, fieldErrors);
  }
  const d = parsed.data;
  const sd = validateServiceDetails(d.serviceSlug, d.serviceDetails ?? {});
  if (!sd.ok) return errEnvelope("VALIDATION_ERROR", "Please correct the highlighted fields.", rid, { serviceDetails: sd.error });
  const svc = getService(d.serviceSlug);
  if (!svc) {
    return errEnvelope("VALIDATION_ERROR", "Please correct the highlighted fields.", rid, {
      serviceSlug: "This service is not currently available.",
    });
  }

  const emailNormalized = normalizeEmail(d.email);
  const fingerprint = payloadFingerprint({
    serviceSlug: d.serviceSlug,
    projectTitle: d.projectTitle.trim(),
    projectSummary: d.projectSummary.trim(),
    name: d.name.trim(),
    email: emailNormalized,
    companyOrOrganization: (d.companyOrOrganization || "").trim(),
    phone: (d.phone || "").trim(),
    preferredContactMethod: d.preferredContactMethod,
    budgetBand: d.budgetBand,
    timelinePreference: d.timelinePreference,
    preferredDate: d.preferredDate,
    referenceUrls: d.referenceUrls || [],
    serviceDetails: sd.cleaned,
    privacyNoticeAcknowledged: true,
  });

  const teamRecipient = process.env.INTERNAL_NOTIFICATION_EMAIL || "";
  if (!teamRecipient) {
    logEvent({ level: "error", route: "POST /api/public/enquiries", code: "CONFIG_MISSING_TEAM_EMAIL", requestId: rid });
    return errEnvelope("INTERNAL_ERROR", "Something went wrong. Your request was not confirmed — please retry.", rid, undefined, 500);
  }

  const svcClient = serviceClient();
  const { data, error } = await svcClient.rpc("create_public_enquiry", {
    payload: {
      idempotency_key: d.idempotencyKey,
      service_slug: d.serviceSlug,
      project_title: d.projectTitle.trim(),
      project_summary: d.projectSummary.trim(),
      service_details: sd.cleaned,
      name: d.name.trim(),
      email: d.email.trim(),
      company_or_organization: (d.companyOrOrganization || "").trim(),
      phone: (d.phone || "").trim(),
      preferred_contact_method: d.preferredContactMethod,
      budget_band: d.budgetBand || "",
      timeline_preference: d.timelinePreference || "",
      preferred_date: d.preferredDate || "",
      reference_urls: d.referenceUrls || [],
      privacy_notice_version: d.privacyNoticeVersion || siteConfig.privacyNoticeVersion,
      source_path: (d.sourcePath || "").slice(0, 500),
      utm_source: (d.utmSource || "").slice(0, 200),
      utm_medium: (d.utmMedium || "").slice(0, 200),
      utm_campaign: (d.utmCampaign || "").slice(0, 200),
    },
    fingerprint,
    team_recipient: teamRecipient,
  });
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "P0002") {
      return errEnvelope(
        "IDEMPOTENCY_KEY_REUSED",
        "This submission was already used with different details. Please reload the form for a new enquiry.",
        rid,
        undefined,
        409
      );
    }
    logEvent({ level: "error", route: "POST /api/public/enquiries", code: "DB_ERROR", requestId: rid });
    return errEnvelope("INTERNAL_ERROR", "Something went wrong. Your request was not confirmed — please retry.", rid, undefined, 500);
  }
  const row = data as { id: string; reference_number: string; is_duplicate: boolean };

  // Best-effort notification via outbox claim; failure never deletes the enquiry.
  if (!row.is_duplicate) {
    try {
      const { data: jobs } = await svcClient.from("notification_outbox").select("id,notification_type").eq("enquiry_id", row.id);
      const { sendEmail, teamAlertHtml, customerReceiptHtml } = await import("@/lib/email/sender");
      for (const job of jobs || []) {
        const j = job as { id: string; notification_type: string };
        const claimed = await svcClient.rpc("begin_notification_attempt", { p_id: j.id });
        if (claimed.error) continue;
        const isTeam = j.notification_type === "team_new_enquiry";
        const res = await sendEmail({
          to: isTeam ? teamRecipient : emailNormalized,
          subject: isTeam
            ? `New project enquiry — ${row.reference_number} — ${svc.title}`
            : `We received your project enquiry — ${row.reference_number}`,
          html: isTeam
            ? teamAlertHtml(row.reference_number, svc.title, d.projectTitle.trim(), `${siteConfig.siteUrl}/admin/enquiries/${row.id}`)
            : customerReceiptHtml(row.reference_number, process.env.EMAIL_FROM || ""),
          type: j.notification_type,
        });
        await svcClient.rpc("complete_notification_attempt", {
          p_id: j.id,
          p_sent: res.ok,
          p_message_id: res.ok ? res.messageId || null : null,
          p_error: res.ok ? null : res.errorCode || "EMAIL_FAILED",
        });
      }
    } catch {
      /* notification failure must not fail the enquiry */
    }
  }

  logEvent({ level: "info", route: "POST /api/public/enquiries", code: row.is_duplicate ? "DUPLICATE_REPLAY" : "CREATED", requestId: rid });
  return NextResponse.json(
    { data: { referenceNumber: row.reference_number, received: true }, requestId: rid },
    { status: row.is_duplicate ? 200 : 201 }
  );
}
