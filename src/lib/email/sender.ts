export interface EmailResult {
  ok: boolean;
  messageId?: string;
  errorCode?: string;
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  type: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    // Dev/test fallback: log-only adapter, marked sent so the enquiry flow
    // stays verifiable without credentials. Production preflight blocks launch.
    console.log(
      `[email:log-only] type=${opts.type} to=${opts.to} subject=${opts.subject}`
    );
    return { ok: true, messageId: `log-${Date.now()}` };
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (result.error) {
      console.error(`[email] provider error type=${opts.type}`);
      return { ok: false, errorCode: "provider_rejected" };
    }
    return { ok: true, messageId: result.data?.id };
  } catch {
    return { ok: false, errorCode: "provider_error" };
  }
}
