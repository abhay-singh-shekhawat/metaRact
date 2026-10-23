/**
 * Operator-only email delivery check. This is NOT a web route.
 *
 * Usage:
 *   pnpm email:test -- you@example.com
 *
 * Uses whichever transport is configured: Gmail SMTP (GMAIL_USER +
 * GMAIL_APP_PASSWORD, no domain required) or Resend (RESEND_API_KEY + a sender
 * on a verified domain). The script prints only the transport and the provider
 * message id; it never prints credentials or the recipient.
 */
async function main() {
  const to = (process.argv[2] || "").trim();
  if (!to) {
    console.error("Usage: pnpm email:test -- you@example.com");
    process.exit(1);
  }

  const { isEmailConfigured, getEmailMode, sendEmail } = await import(
    "../src/lib/email/sender"
  );

  if (!isEmailConfigured()) {
    console.error(
      "Email is not configured. Set GMAIL_USER + GMAIL_APP_PASSWORD + AGENCY_EMAIL (free, no domain), " +
        "or RESEND_API_KEY + AGENCY_EMAIL on a verified Resend domain."
    );
    process.exit(1);
  }

  const mode = getEmailMode();
  const result = await sendEmail({
    to,
    subject: `Email delivery test — ${new Date().toISOString()}`,
    html: "<p>This is an operator-triggered delivery test. If you received it, the configured sender and credentials are working.</p>",
    type: "delivery_test",
  });

  if (!result.ok) {
    console.error(
      `Test send failed via ${mode}: ${result.errorCode ?? "unknown"}${result.detail ? ` (${result.detail})` : ""}`
    );
    process.exit(1);
  }
  if (result.mode === "log-only") {
    console.error(
      "Test send did not leave the server (log-only). Configure a transport, then retry."
    );
    process.exit(1);
  }

  console.log(
    `Delivered via ${result.mode} (messageId=${result.messageId ?? "unknown"}). Check the destination inbox.`
  );
}

main().catch((err) => {
  console.error(
    "Test send failed:",
    err instanceof Error ? err.message : "unknown error"
  );
  process.exit(1);
});

// Makes this file a module so its `main` does not collide with other scripts
// that are compiled into the same global scope.
export {};
