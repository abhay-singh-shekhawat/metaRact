import { NextResponse } from "next/server";
import { createEnquiryUseCase } from "@/server/use-cases/createEnquiry";
import { checkEnquiryRateLimit, rateLimitKey } from "@/lib/rate-limit/limiter";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { enquiryRequestSchema } from "@/lib/validation/enquiry";
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

    // Honeypot: pretend success without persisting. Applies to the
    // persistence use-case below (MongoDB Atlas when configured,
    // local file store otherwise).
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
