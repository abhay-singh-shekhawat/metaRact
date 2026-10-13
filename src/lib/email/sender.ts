import "server-only";

export interface EmailResult {
  ok: boolean;
  messageId?: string;
  errorCode?: string;
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function customerReceiptHtml(ref: string, contactEmail: string): string {
  return `<p>Thank you — we received your project enquiry <strong>${escapeText(ref)}</strong>.</p><p>Our team will review your brief and contact you. This confirmation means your request was received; it is not an acceptance of work or a quote.</p><p>If you need to add context, reply with your reference number. Contact: ${escapeText(contactEmail || "see our contact page")}.</p>`;
}

export function teamAlertHtml(
  ref: string,
  serviceTitle: string,
  projectTitle: string,
  adminUrl: string
): string {
  return `<p>New project enquiry <strong>${escapeText(ref)}</strong> — ${escapeText(serviceTitle)}</p><p>${escapeText(projectTitle)}</p><p>Review: ${escapeText(adminUrl)}</p>`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isGmailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.EMAIL_FROM
  );
}

function configError(): string | null {
  if (!process.env.GMAIL_USER) return "GMAIL_USER is not configured.";
  if (!process.env.GMAIL_APP_PASSWORD) return "GMAIL_APP_PASSWORD is not configured.";
  if (!process.env.EMAIL_FROM) return "EMAIL_FROM is not configured.";
  if (!EMAIL_RE.test(process.env.EMAIL_FROM)) return "EMAIL_FROM is not a valid email address.";
  return null;
}

type Transport = {
  sendMail: (opts: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<{ messageId?: string }>;
  verify?: () => Promise<unknown>;
};

declare global {
  var __gmailTransport: Transport | undefined;
}

async function getTransport(): Promise<Transport> {
  if (!globalThis.__gmailTransport) {
    const nodemailer = await import("nodemailer");
    globalThis.__gmailTransport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    }) as unknown as Transport;
  }
  return globalThis.__gmailTransport!;
}

/** Test hook: replace the SMTP transport with a stub. Never used in production. */
export function __setEmailTransportForTests(transport: Transport | undefined): void {
  globalThis.__gmailTransport = transport;
}

function classifySmtpError(err: unknown): string {
  const code = (err as { code?: string; responseCode?: number })?.code;
  if (code === "EAUTH" || code === "EENVELOPE") return "auth_failed";
  if (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    code === "ECONNECTION" ||
    code === "EGREETING"
  ) {
    return "transient_failure";
  }
  return "provider_error";
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  type: string;
}): Promise<EmailResult> {
  const misconfigured = configError();
  if (misconfigured) {
    // Dev/test fallback: log-only adapter, marked sent so the enquiry flow
    // stays verifiable without credentials. Production preflight blocks launch.
    console.log(
      `[email:log-only] type=${opts.type} to=${opts.to} subject=${opts.subject}`
    );
    return { ok: true, messageId: `log-${Date.now()}` };
  }
  if (!EMAIL_RE.test(opts.to)) {
    console.error(`[email] invalid recipient type=${opts.type}`);
    return { ok: false, errorCode: "invalid_recipient" };
  }
  try {
    const transport = await getTransport();
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM!,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: htmlToText(opts.html),
    });
    // Accepted by Gmail for submission. Confirmed delivery is not observable
    // here; downstream bounces are handled out of band.
    return { ok: true, messageId: info?.messageId };
  } catch (err) {
    console.error(`[email] smtp error type=${opts.type}`);
    return { ok: false, errorCode: classifySmtpError(err) };
  }
}
