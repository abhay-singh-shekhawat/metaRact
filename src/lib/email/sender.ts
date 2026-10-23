import "server-only";

export type EmailMode = "smtp" | "resend" | "log-only";
export type NotificationType = "team_new_enquiry" | "customer_receipt";

export interface EmailResult {
  ok: boolean;
  messageId?: string;
  errorCode?: string;
  /** Short, safe-to-log provider detail (no credentials or recipients). */
  detail?: string;
  /** Which adapter handled this send. */
  mode?: EmailMode;
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

/**
 * Build the exact subject/body used for a notification. Admin retries use the
 * same helper so a retry has the same payload as the original attempt; that is
 * what lets the provider drop a duplicate when only the outbox update failed.
 */
export function notificationEmail(opts: {
  type: NotificationType;
  referenceNumber: string;
  serviceTitle: string;
  projectTitle: string;
  adminUrl: string;
  contactEmail: string;
}): { subject: string; html: string } {
  const isTeam = opts.type === "team_new_enquiry";
  return {
    subject: isTeam
      ? `New project enquiry — ${opts.referenceNumber} — ${opts.serviceTitle}`
      : `We received your project enquiry — ${opts.referenceNumber}`,
    html: isTeam
      ? teamAlertHtml(
          opts.referenceNumber,
          opts.serviceTitle,
          opts.projectTitle,
          opts.adminUrl
        )
      : customerReceiptHtml(opts.referenceNumber, opts.contactEmail),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Accept one address or a comma/semicolon-separated list. Keeping this in one
 * place means the team-alert recipient, retries, and the provider all agree.
 */
export function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function toBareAddress(raw: string): string | null {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "").trim();
  if (!trimmed) return null;
  const match = trimmed.match(/<([^<>@\s]+@[^<>@\s]+\.[^<>@\s]+)>\s*$/);
  return match ? match[1] : trimmed;
}

function fromAddress(): string | null {
  return toBareAddress(
    process.env.AGENCY_EMAIL || process.env.EMAIL_FROM || ""
  );
}

function smtpUser(): string {
  return (process.env.GMAIL_USER || "").trim();
}

function smtpPassword(): string {
  // Gmail displays app passwords in groups of four; the spaces are cosmetic.
  return (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "").trim();
}

/**
 * Gmail only accepts a `From` that matches the authenticated account or a
 * verified "Send as" alias; anything else is silently rewritten. Refusing the
 * configuration is clearer than sending mail under an identity we did not set.
 */
function smtpConfigIssue(): string | null {
  const user = smtpUser();
  if (!user) return "GMAIL_USER is not configured.";
  if (!smtpPassword()) return "GMAIL_APP_PASSWORD is not configured.";
  const addr = fromAddress();
  if (!addr || !EMAIL_RE.test(addr)) {
    return "AGENCY_EMAIL (or EMAIL_FROM) must be a valid sender address.";
  }
  if (addr.toLowerCase() !== user.toLowerCase()) {
    return 'AGENCY_EMAIL must equal GMAIL_USER (or be a verified Gmail "Send as" alias).';
  }
  return null;
}

function resendConfigIssue(): string | null {
  if (!process.env.RESEND_API_KEY?.trim()) {
    return "RESEND_API_KEY is not configured.";
  }
  const addr = fromAddress();
  if (!addr || !EMAIL_RE.test(addr)) {
    return "AGENCY_EMAIL (or EMAIL_FROM) must be a valid sender address on a domain verified in Resend.";
  }
  return null;
}

/**
 * Gmail SMTP needs no domain and no paid plan, so it wins whenever it is
 * configured. Resend is used when a verified domain exists instead. "log-only"
 * means NO real email leaves the server.
 */
export function getEmailMode(): EmailMode {
  if (smtpConfigIssue() === null) return "smtp";
  if (resendConfigIssue() === null) return "resend";
  return "log-only";
}

function configIssue(): string | null {
  const smtp = smtpConfigIssue();
  const resend = resendConfigIssue();
  if (smtp === null || resend === null) return null;
  return `${smtp} ${resend}`;
}

export function isEmailConfigured(): boolean {
  return configIssue() === null;
}

export type MailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  bcc?: string[];
  messageId?: string;
};

type Transport = (
  payload: MailPayload,
  mode: "smtp" | "resend",
  idempotencyKey?: string
) => Promise<EmailResult>;

declare global {
  var __mailTransportForTests: Transport | undefined;
}

/** Test hook: replaces the network call. Never set in production. */
export function __setMailTransportForTests(transport: Transport | undefined): void {
  globalThis.__mailTransportForTests = transport;
}

function errorName(err: unknown): string {
  const name = (err as { name?: unknown })?.name;
  return typeof name === "string" && name ? name : "unknown_error";
}

function errorCodeOf(err: unknown): string {
  const code = (err as { code?: unknown })?.code;
  return typeof code === "string" && code ? code : "";
}

function responseCodeOf(err: unknown): number | null {
  const code = (err as { responseCode?: unknown })?.responseCode;
  return typeof code === "number" ? code : null;
}

/** Provider text can echo a recipient address, so only the codes are kept. */
function smtpErrorDetail(err: unknown): string {
  const parts = [errorName(err)];
  const code = errorCodeOf(err);
  const response = responseCodeOf(err);
  if (code) parts.push(code);
  if (response !== null) parts.push(`smtp=${response}`);
  return parts.join(" ").slice(0, 120);
}

const QUOTA_TEXT = /(daily|hourly|sending) (user )?(limit|quota)|too many|rate limit|try again later/i;

/**
 * Nodemailer surfaces SMTP failures as codes and numeric replies. Mapping them
 * here is what lets the admin outbox show an actionable reason instead of a
 * generic failure.
 */
export function classifySmtpError(err: unknown): string {
  const code = errorCodeOf(err);
  const response = responseCodeOf(err);
  const responseText = String((err as { response?: unknown })?.response ?? "");
  if (QUOTA_TEXT.test(responseText)) return "transient_failure";
  if (code === "EAUTH" || response === 530 || response === 534 || response === 535) {
    return "auth_failed";
  }
  if (code === "EENVELOPE" || response === 550 || response === 551 || response === 553) {
    return "invalid_recipient";
  }
  if (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    code === "ECONNECTION" ||
    code === "EDNS" ||
    code === "EPROTOCOL" ||
    code === "EAI_AGAIN" ||
    (response !== null && response >= 400 && response < 500)
  ) {
    return "transient_failure";
  }
  return "provider_error";
}

function fromHeader(): string {
  const addr = fromAddress();
  if (!addr) return "";
  const name = (process.env.AGENCY_EMAIL_NAME || "").trim();
  if (!name) return addr;
  // Strip characters that would break the header or allow injection.
  const safeName = name.replace(/["\\\r\n]/g, "").trim();
  return safeName ? `"${safeName}" <${addr}>` : addr;
}

function replyToAddress(): string | undefined {
  const raw = (process.env.AGENCY_REPLY_TO || "").trim();
  return raw || undefined;
}

function bccAddresses(): string[] | undefined {
  const raw = (process.env.AGENCY_BCC_EMAIL || "").trim();
  if (!raw) return undefined;
  const addresses = parseRecipients(raw);
  return addresses.length ? addresses : undefined;
}

/**
 * Gmail SMTP over TLS (port 465). Cloudflare Workers support outbound TCP on
 * this port with `nodejs_compat`; port 25 is blocked and is not used here. The
 * transport is created per send and closed afterwards so no socket is shared
 * across requests.
 */
async function sendViaSmtp(payload: MailPayload): Promise<EmailResult> {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: smtpUser(), pass: smtpPassword() },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 25_000,
  });
  try {
    const info = await transport.sendMail({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
      bcc: payload.bcc,
      messageId: payload.messageId,
    });
    const messageId = info?.messageId;
    if (!messageId) {
      return {
        ok: false,
        errorCode: "provider_error",
        mode: "smtp",
        detail: "SMTP accepted the message but returned no message id.",
      };
    }
    return { ok: true, messageId, mode: "smtp" };
  } catch (err) {
    return {
      ok: false,
      errorCode: classifySmtpError(err),
      mode: "smtp",
      detail: smtpErrorDetail(err),
    };
  } finally {
    transport.close();
  }
}

type ResendPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  bcc?: string[];
};

type ResendResponse = {
  data?: { id?: string } | null;
  error?: { name?: string; statusCode?: number | null } | null;
};

async function sendViaResend(
  payload: MailPayload,
  idempotencyKey?: string
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, errorCode: "email_not_configured", mode: "resend" };
  }
  try {
    const { Resend } = await import("resend");
    const body: ResendPayload = {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    };
    if (payload.replyTo) body.replyTo = payload.replyTo;
    if (payload.bcc) body.bcc = payload.bcc;
    const resend = new Resend(apiKey);
    const result: ResendResponse = await resend.emails.send(
      body,
      idempotencyKey ? { idempotencyKey } : undefined
    );
    if (result?.error) {
      const status =
        typeof result.error.statusCode === "number" ? result.error.statusCode : null;
      const name = result.error.name ?? "unknown_error";
      const errorCode =
        status === 401 || status === 403 || name === "invalid_api_key"
          ? "auth_failed"
          : status === 429 || (status !== null && status >= 500)
            ? "transient_failure"
            : "provider_error";
      return {
        ok: false,
        errorCode,
        mode: "resend",
        detail: `${name}${status !== null ? ` status=${status}` : ""}`.slice(0, 120),
      };
    }
    const messageId = result?.data?.id;
    if (!messageId) {
      return {
        ok: false,
        errorCode: "provider_error",
        mode: "resend",
        detail: "Resend returned no message id.",
      };
    }
    return { ok: true, messageId, mode: "resend" };
  } catch (err) {
    const name = errorName(err);
    const errorCode =
      name === "AbortError" || name === "TimeoutError" || name === "TypeError"
        ? "transient_failure"
        : "provider_error";
    return { ok: false, errorCode, mode: "resend", detail: name.slice(0, 120) };
  }
}

/**
 * Stable Message-ID derived from the outbox job id. Gmail drops a second
 * message with an identical Message-ID, which makes a retry after a partial
 * failure safe even though SMTP has no idempotency key of its own.
 */
function messageIdFor(idempotencyKey: string | undefined): string | undefined {
  if (!idempotencyKey) return undefined;
  const domain = fromAddress()?.split("@")[1] || "localhost";
  return `<${idempotencyKey}@${domain}>`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  type: string;
  /**
   * Stable outbox job id. Resend uses it as Idempotency-Key and SMTP uses it as
   * the Message-ID, so retrying the same notification cannot deliver twice.
   */
  idempotencyKey?: string;
}): Promise<EmailResult> {
  const mode = getEmailMode();
  const misconfigured = configIssue();

  if (misconfigured || mode === "log-only") {
    // In development/test, log-only keeps the enquiry flow verifiable without
    // credentials. In production, silence is dangerous: report a failed
    // notification so the admin outbox shows the real reason instead of a
    // misleading "sent" row for an email that never left the server.
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[email][not-configured] ${misconfigured} type=${opts.type} recipients=${parseRecipients(opts.to).length}`
      );
      return {
        ok: false,
        errorCode: "email_not_configured",
        mode: "log-only",
        detail: misconfigured ?? "No email transport is configured.",
      };
    }
    // Dev/test fallback: marked sent so the enquiry flow stays verifiable.
    // Loud terminal line so operators never mistake this for a real send.
    console.log(
      `[email][log-only-mode] NOT sending real email (${misconfigured}) type=${opts.type} recipients=${parseRecipients(opts.to).length} subject=${opts.subject}`
    );
    return {
      ok: true,
      messageId: `log-${Date.now()}`,
      mode: "log-only",
      detail: misconfigured ?? "No email transport is configured.",
    };
  }

  const recipients = parseRecipients(opts.to);
  if (
    !recipients.length ||
    recipients.length > 50 ||
    recipients.some((address) => !EMAIL_RE.test(address))
  ) {
    console.error(
      `[email][${mode}] invalid recipient type=${opts.type} recipients=${recipients.length}`
    );
    return {
      ok: false,
      errorCode: "invalid_recipient",
      mode,
      detail: "Recipient address failed validation.",
    };
  }

  const payload: MailPayload = {
    from: fromHeader(),
    to: recipients,
    subject: opts.subject,
    html: opts.html,
    text: htmlToText(opts.html),
    messageId: messageIdFor(opts.idempotencyKey),
  };
  const replyTo = replyToAddress();
  if (replyTo) payload.replyTo = replyTo;
  const bcc = bccAddresses();
  if (bcc) payload.bcc = bcc;

  const transport: Transport =
    globalThis.__mailTransportForTests ??
    ((mail, activeMode, key) =>
      activeMode === "smtp" ? sendViaSmtp(mail) : sendViaResend(mail, key));

  const result = await transport(payload, mode, opts.idempotencyKey);
  const finalMode = result.mode ?? mode;

  if (!result.ok) {
    console.error(
      `[email][${finalMode}] FAILED type=${opts.type} recipients=${recipients.length} errorCode=${result.errorCode ?? "send_failed"} provider=${result.detail ?? "unknown"}`
    );
    return { ...result, mode: finalMode };
  }

  console.log(
    `[email][${finalMode}] sent type=${opts.type} recipients=${recipients.length} messageId=${result.messageId ?? "unknown"}`
  );
  return { ...result, mode: finalMode };
}
