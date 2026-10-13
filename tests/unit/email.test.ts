import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  sendEmail,
  teamAlertHtml,
  customerReceiptHtml,
  htmlToText,
  isGmailConfigured,
  __setEmailTransportForTests,
} from "@/lib/email/sender";

const SAVED = { ...process.env };

function gmailEnv() {
  process.env.GMAIL_USER = "studio@example.com";
  process.env.GMAIL_APP_PASSWORD = "app-password-stub";
  process.env.EMAIL_FROM = "studio@example.com";
}

function clearGmailEnv() {
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;
  delete process.env.EMAIL_FROM;
}

beforeEach(() => {
  clearGmailEnv();
  __setEmailTransportForTests(undefined);
});

afterEach(() => {
  __setEmailTransportForTests(undefined);
  for (const k of ["GMAIL_USER", "GMAIL_APP_PASSWORD", "EMAIL_FROM"] as const) {
    if (SAVED[k] === undefined) delete process.env[k];
    else process.env[k] = SAVED[k];
  }
});

describe("gmail configuration", () => {
  it("reports unconfigured without credentials", () => {
    expect(isGmailConfigured()).toBe(false);
  });

  it("uses the log-only adapter when Gmail is not configured", async () => {
    const r = await sendEmail({
      to: "team@example.com",
      subject: "hello",
      html: "<p>hello</p>",
      type: "team_new_enquiry",
    });
    expect(r.ok).toBe(true);
    expect(r.messageId).toMatch(/^log-/);
  });
});

describe("mocked smtp transport", () => {
  it("submits through the configured transport and returns its message id", async () => {
    gmailEnv();
    __setEmailTransportForTests({
      sendMail: async (opts) => {
        expect(opts.from).toBe("studio@example.com");
        expect(opts.to).toBe("team@example.com");
        expect(opts.text).toContain("hello");
        return { messageId: "gmail-123" };
      },
    });
    const r = await sendEmail({
      to: "team@example.com",
      subject: "hello",
      html: "<p>hello</p>",
      type: "team_new_enquiry",
    });
    expect(r).toEqual({ ok: true, messageId: "gmail-123" });
  });

  it("rejects invalid recipients without touching smtp", async () => {
    gmailEnv();
    let called = false;
    __setEmailTransportForTests({
      sendMail: async () => {
        called = true;
        return {};
      },
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

  it("maps auth failures without leaking details", async () => {
    gmailEnv();
    __setEmailTransportForTests({
      sendMail: async () => {
        throw Object.assign(new Error("Invalid credentials (Failure)"), {
          code: "EAUTH",
        });
      },
    });
    const r = await sendEmail({
      to: "team@example.com",
      subject: "x",
      html: "<p>x</p>",
      type: "team_new_enquiry",
    });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe("auth_failed");
  });

  it("maps timeouts as transient failures", async () => {
    gmailEnv();
    __setEmailTransportForTests({
      sendMail: async () => {
        throw Object.assign(new Error("Connection timeout"), { code: "ETIMEDOUT" });
      },
    });
    const r = await sendEmail({
      to: "team@example.com",
      subject: "x",
      html: "<p>x</p>",
      type: "team_new_enquiry",
    });
    expect(r.errorCode).toBe("transient_failure");
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

  it("customer receipt keeps the reference and contact", () => {
    const html = customerReceiptHtml("REQ-2026-000001", "team@studio.example");
    expect(html).toContain("REQ-2026-000001");
    expect(html).toContain("team@studio.example");
  });

  it("generates a plain-text alternative", () => {
    expect(htmlToText("<p>Hello<br>World</p>")).toBe("Hello\nWorld");
    expect(htmlToText("<p>a &amp; b</p>")).toBe("a & b");
  });
});
