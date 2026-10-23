# Security

## Reporting a vulnerability

Email the studio security contact (to be published at launch). Include:
steps to reproduce, affected route/version, and impact. Do not publicly
disclose before a fix is available. Expect acknowledgement within two
business days.

## Secrets

- Never commit `.env.local` or real credentials. `.env.example` holds names only.
- Server-only keys (`MONGODB_URI`, `GMAIL_APP_PASSWORD`, `RESEND_API_KEY`,
  `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`) must
  never use `NEXT_PUBLIC_` or appear in client bundles, logs or screenshots.
- `GMAIL_APP_PASSWORD` must be a Google App Password (2-Step Verification
  required), never the account password, and must be a Worker secret. Gmail
  SMTP only accepts a `from` equal to the authenticated account or a verified
  “Send as” alias, so `AGENCY_EMAIL` must match `GMAIL_USER`.
- If the Resend transport is used instead, scope the key to sending where the
  dashboard allows it and set it as a Worker secret; the `from` address must be
  on the verified Resend domain.
- Rotate any exposed secret immediately in the provider dashboard and hosting
  secret manager, then invalidate old sessions/tokens.

## Access revocation

- Admin: set `isActive=false` on the user in `admin_users` and delete their
  rows in `admin_sessions` (sessions also expire after 12h via TTL).
- If a device is lost: revoke that user's `admin_sessions` rows immediately;
  rotate the email credentials (App Password / Resend key) and Upstash tokens as
  applicable, then force re-login.

## Incident triage

1. Identify scope (routes, data, time window) via request IDs and provider logs —
   never log full enquiry bodies, emails, notes or tokens.
2. Contain: disable affected integration keys, block abusive IPs at the edge.
3. Preserve the enquiry store/database; notification failures never delete enquiries.
4. Notify affected individuals per legal advice; record timeline and remediation.

## Data deletion requests

Locate enquiries by reference number/email, verify requester identity
out-of-band, delete or anonymise the enquiry + related events/notes/outbox
rows, and confirm in writing. Default retention: delete/anonymise
unconverted/declined enquiries after 12 months of inactivity.

## Backups

- Production database: provider-scheduled backups + documented periodic logical
  export. Test-restore to a non-production environment before the first real
  enquiry and after major schema changes.
- Local file store (`.data/`) is not a backup; never use production data locally.
