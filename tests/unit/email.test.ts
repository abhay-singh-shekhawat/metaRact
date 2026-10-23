import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  sendEmail,
  teamAlertHtml,
  customerReceiptHtml,
  htmlToText,
  notificationEmail,
  isEmailConfigured,
  getEmailMode,
  classifySmtpError,
  __setMailTransportForTests,
  type MailPayload,
} from "@/lib/email/sender";

const SAVED = { ...process.env };

const EMAIL_KEYS = [
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "RESEND_API_KEY",
  "AGENCY_EMAIL",
  "EMAIL_FROM",
  "AGENCY_EMAIL_NAME",
  "AGENCY_REPLY_TO",
  "AGENCY_BCC_EMAIL",
  "AGENCY_NOTIFICATION_EMAIL",
  "INTERNAL_NOTIFICATION_EMAIL",
  "NODE_ENV",
] as const;

function clearEmailEnv() {
  for (const key of EMAIL_KEYS) delete process.env[key];
}

function smtpEnv() {
  process.env.GMAIL_USER = "studio.owner@gmail.com";
  process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
  process.env.AGENCY_EMAIL = "studio.owner@gmail.com";
  delete process.env.EMAIL_FROM;
}

function resendEnv() {
  process.env.RESEND_API_KEY = "re_test_stub";
  process.env.AGENCY_EMAIL = "studio@example.com";
  delete process.env.EMAIL_FROM;
}

/** Capture the payload the sender would have handed to the provider. */
function captureTransport() {
  const seen: { payload: MailPayload; mode: string; key?: string }[] = [];
  __setMailTransportForTests(async (payload, mode, key) => {
    seen.push({ payload, mode, key });
    return { ok: true, messageId: "provider-id", mode };
  });
  return seen;
}

beforeEach(() => {
  clearEmailEnv();
  __setMailTransportForTests(undefined);
});

afterEach(() => {
  __setMailTransportForTests(undefined);
  for (const key of EMAIL_KEYS) {
    if (SAVED[key] === undefined) delete process.env[key];
    else (process.env as Record<string, string | undefined>)[key] = SAVED[key];
  }
});

describe("transport selection", () => {
  it("reports unconfigured with no credentials", () => {
    expect(isEmailConfigured()).toBe(false);
    expect(getEmailMode()).toBe("log-only");
  });

  it("prefers Gmail SMTP, which needs no domain", () => {
    smtpEnv();
    expect(isEmailConfigured()).toBe(true);
    expect(getEmailMode()).toBe("smtp");
  });

  it("refuses a sender address that is not the authenticated Gmail account", () => {
    smtpEnv();
    process.env.AGENCY_EMAIL = "someone@example.com";
    expect(getEmailMode()).toBe("log-only");
  });

  it("falls back to Resend when a verified domain is configured instead", () => {
    resendEnv();
    expect(isEmailConfigured()).toBe(true);
    expect(getEmailMode()).toBe("resend");
  });

  it("uses SMTP when both transports are configured", () => {
    smtpEnv();
    process.env.RESEND_API_KEY = "re_test_stub";
    expect(getEmailMode()).toBe("smtp");
  });
});

describe("log-only and misconfiguration", () => {
  it("logs instead of sending in development and says so", async () => {
    const r = await sendEmail({
      to: "team@example.com",
      subject: "hello",
      html: "<p>hello</p>",
      type: "team_new_enquiry",
    });
    expect(r.ok).toBe(true);
    expect(r.messageId).toMatch(/^log-/);
    expect(r.mode).toBe("log-only");
  });

  it("fails closed in production instead of pretending a log-only send succeeded", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const r = await sendEmail({
      to: "team@example.com",
      subject: "hello",
      html: "<p>hello</p>",
      type: "team_new_enquiry",
    });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe("email_not_configured");
  });
});

describe("payload built for the provider", () => {
  it("sends through SMTP with a plain-text alternative", async () => {
    smtpEnv();
    const seen = captureTransport();
    const r = await sendEmail({
      to: "team@example.com",
      subject: "hello",
      html: "<p>hello</p><p>world</p>",
      type: "team_new_enquiry",
    });
    expect(r).toMatchObject({ ok: true, messageId: "provider-id", mode: "smtp" });
    expect(seen[0].mode).toBe("smtp");
    expect(seen[0].payload.from).toBe("studio.owner@gmail.com");
    expect(seen[0].payload.to).toEqual(["team@example.com"]);
    expect(seen[0].payload.text).toBe("hello\nworld");
  });

  it("normalises the app password Gmail displays with spaces", async () => {
    smtpEnv();
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    expect(getEmailMode()).toBe("smtp");
  });

  it("adds the display name, reply-to, BCC and multiple recipients", async () => {
    smtpEnv();
    process.env.AGENCY_EMAIL_NAME = "Metaract Studio";
    process.env.AGENCY_REPLY_TO = "hello@example.com";
    process.env.AGENCY_BCC_EMAIL =
      "archive1@example.com; archive2@example.com";
    const seen = captureTransport();
    await sendEmail({
      to: "founder1@example.com, founder2@example.com",
      subject: "x",
      html: "<p>x</p>",
      type: "team_new_enquiry",
    });
    expect(seen[0].payload.from).toBe('"Metaract Studio" <studio.owner@gmail.com>');
    expect(seen[0].payload.to).toEqual([
      "founder1@example.com",
      "founder2@example.com",
    ]);
    expect(seen[0].payload.replyTo).toBe("hello@example.com");
    expect(seen[0].payload.bcc).toEqual([
      "archive1@example.com",
      "archive2@example.com",
    ]);
  });

  it("turns the outbox job id into a stable Message-ID so a retry cannot duplicate", async () => {
    smtpEnv();
    const seen = captureTransport();
    await sendEmail({
      to: "team@example.com",
      subject: "x",
      html: "<p>x</p>",
      type: "team_new_enquiry",
      idempotencyKey: "job-1",
    });
    expect(seen[0].payload.messageId).toBe("<job-1@gmail.com>");
    expect(seen[0].key).toBe("job-1");
  });

  it("omits the Message-ID when there is no job id", async () => {
    smtpEnv();
    const seen = captureTransport();
    await sendEmail({
      to: "team@example.com",
      subject: "x",
      html: "<p>x</p>",
      type: "delivery_test",
    });
    expect(seen[0].payload.messageId).toBeUndefined();
  });
});

describe("recipient validation", () => {
  it("rejects an invalid recipient without touching the provider", async () => {
    smtpEnv();
    let called = false;
    __setMailTransportForTests(async (_p, mode) => {
      called = true;
      return { ok: true, messageId: "should-not-happen", mode };
    });
    const r = await sendEmail({
      to: "not-an-email",
      subject: "x",
      html: "<p>x</p>",
      type: "team_new_enquiry",
    });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe("invalid_recipient");
    expect(called).toBe(false);
  });

  it("rejects a list when any address is invalid", async () => {
    smtpEnv();
    let called = false;
    __setMailTransportForTests(async (_p, mode) => {
      called = true;
      return { ok: true, messageId: "should-not-happen", mode };
    });
    const r = await sendEmail({
      to: "founder1@example.com, broken-address",
      subject: "x",
      html: "<p>x</p>",
      type: "team_new_enquiry",
    });
    expect(r.errorCode).toBe("invalid_recipient");
    expect(called).toBe(false);
  });

  it("rejects more than 50 recipients before calling the provider", async () => {
    smtpEnv();
    let called = false;
    __setMailTransportForTests(async (_p, mode) => {
      called = true;
      return { ok: true, messageId: "should-not-happen", mode };
    });
    const r = await sendEmail({
      to: Array.from({ length: 51 }, (_, i) => `person${i}@example.com`).join(
        ","
      ),
      subject: "x",
      html: "<p>x</p>",
      type: "team_new_enquiry",
    });
    expect(r.errorCode).toBe("invalid_recipient");
    expect(called).toBe(false);
  });
});

describe("SMTP error classification", () => {
  it("maps bad credentials to auth_failed", () => {
    expect(classifySmtpError({ code: "EAUTH", responseCode: 535 })).toBe(
      "auth_failed"
    );
  });

  it("maps a rejected recipient to invalid_recipient", () => {
    expect(
      classifySmtpError({ code: "EENVELOPE", responseCode: 550, response: "550 5.1.1 user unknown" })
    ).toBe("invalid_recipient");
  });

  it("maps a sending limit to a transient failure", () => {
    expect(
      classifySmtpError({
        responseCode: 550,
        response: "550 5.4.5 Daily user sending limit exceeded",
      })
    ).toBe("transient_failure");
  });

  it("maps connection problems to a transient failure", () => {
    expect(classifySmtpError({ code: "ETIMEDOUT" })).toBe("transient_failure");
    expect(classifySmtpError({ code: "ESOCKET" })).toBe("transient_failure");
    expect(classifySmtpError({ responseCode: 421 })).toBe("transient_failure");
  });

  it("falls back to provider_error", () => {
    expect(classifySmtpError(new Error("odd"))).toBe("provider_error");
  });

  it("propagates a transport failure with its mode and code", async () => {
    smtpEnv();
    __setMailTransportForTests(async () => ({
      ok: false,
      errorCode: "auth_failed",
      mode: "smtp",
      detail: "EAuth smtp=535",
    }));
    const r = await sendEmail({
      to: "team@example.com",
      subject: "x",
      html: "<p>x</p>",
      type: "team_new_enquiry",
    });
    expect(r).toMatchObject({ ok: false, errorCode: "auth_failed", mode: "smtp" });
  });
});

describe("templates", () => {
  it("escapes untrusted content including quotes", () => {
    const html = teamAlertHtml(
      'REQ-1"><script>',
      'Design "special" <b>',
      "Title' <img src=x>",
      "https://admin.example/?x=1&y=2"
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&quot;");
    expect(html).toContain("&#39;");
    expect(html).toContain("&amp;");
  });

  it("customer receipt keeps the reference and public contact", () => {
    const html = customerReceiptHtml("REQ-2026-000001", "team@studio.example");
    expect(html).toContain("REQ-2026-000001");
    expect(html).toContain("team@studio.example");
  });

  it("builds the same customer receipt content used by send and retry", () => {
    const content = notificationEmail({
      type: "customer_receipt",
      referenceNumber: "REQ-2026-000001",
      serviceTitle: "Websites",
      projectTitle: "A project",
      adminUrl: "https://admin.example/enquiries/1",
      contactEmail: "hello@studio.example",
    });
    expect(content.subject).toBe(
      "We received your project enquiry — REQ-2026-000001"
    );
    expect(content.html).toContain("hello@studio.example");
    expect(content.html).not.toContain("founder1@example.com");
  });

  it("generates a plain-text alternative", () => {
    expect(htmlToText("<p>Hello<br>World</p>")).toBe("Hello\nWorld");
    expect(htmlToText("<p>a &amp; b</p>")).toBe("a & b");
  });
});
